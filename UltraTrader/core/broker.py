"""
UltraTrader 券商 API 封裝
提供 BaseBroker 抽象 + ShioajiBroker（永豐實盤）+ MockBroker（本地模擬）
"""

import threading
import time as time_module
import random
import math
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, time, timedelta
from typing import Callable, Optional

from loguru import logger

from core.market_data import Tick


@dataclass
class OrderResult:
    """下單結果"""
    success: bool
    order_id: str = ""
    fill_price: float = 0.0
    fill_quantity: int = 0
    message: str = ""


@dataclass
class AccountInfo:
    """帳戶資訊"""
    balance: float = 0.0          # 帳戶餘額
    equity: float = 0.0           # 帳戶權益
    margin_used: float = 0.0      # 已用保證金
    margin_available: float = 0.0  # 可用保證金
    unrealized_pnl: float = 0.0   # 未實現損益


# ============================================================
# 抽象基類
# ============================================================

class BaseBroker(ABC):
    """券商介面抽象"""

    @abstractmethod
    def connect(self) -> bool:
        """連線登入"""
        ...

    @abstractmethod
    def disconnect(self):
        """安全登出"""
        ...

    @abstractmethod
    def subscribe_tick(self, callback: Callable[[Tick], None]):
        """訂閱即時 Tick"""
        ...

    @abstractmethod
    def place_order(self, action: str, quantity: int, price: float = 0, price_type: str = "MKT") -> OrderResult:
        """
        下單
        action: "BUY" / "SELL"
        price_type: "MKT"（市價）/ "LMT"（限價）
        """
        ...

    @abstractmethod
    def cancel_order(self, order_id: str) -> bool:
        """取消委託"""
        ...

    @abstractmethod
    def get_account_info(self) -> AccountInfo:
        """查詢帳戶"""
        ...

    @abstractmethod
    def get_contract_name(self) -> str:
        """取得合約名稱"""
        ...


# ============================================================
# 永豐 Shioaji 實盤
# ============================================================

class ShioajiBroker(BaseBroker):
    """永豐金 Shioaji API 封裝"""

    def __init__(self, api_key: str, secret_key: str, ca_path: str = "", ca_password: str = "",
                 person_id: str = "", simulation: bool = True, contract_code: str = "MXF"):
        self._api_key = api_key
        self._secret_key = secret_key
        self._ca_path = ca_path
        self._ca_password = ca_password
        self._person_id = person_id
        self._simulation = simulation
        self._contract_code = contract_code
        self._api = None
        self._contract = None
        self._tick_callback: Optional[Callable] = None
        self._connected = False
        self._lock = threading.Lock()

    def connect(self) -> bool:
        try:
            import shioaji as sj

            self._api = sj.Shioaji(simulation=self._simulation)
            accounts = self._api.login(
                api_key=self._api_key,
                secret_key=self._secret_key,
                fetch_contract=True,
            )

            if not accounts:
                logger.error("登入失敗：沒有取得帳戶資訊")
                return False

            logger.info(f"✅ 永豐登入成功（{'模擬盤' if self._simulation else '實單'}）")

            # 啟用憑證（實單需要）
            if not self._simulation and self._ca_path:
                self._api.activate_ca(
                    ca_path=self._ca_path,
                    ca_passwd=self._ca_password,
                    person_id=self._person_id,
                )
                logger.info("✅ 憑證啟用成功")

            # 取得近月合約
            self._contract = self._get_nearby_contract()
            if self._contract:
                logger.info(f"📡 合約: {self._contract.code} ({self._contract.name})")

            self._connected = True
            return True

        except ImportError:
            logger.error("找不到 shioaji 套件，請執行: pip install shioaji")
            return False
        except Exception as e:
            logger.error(f"連線失敗: {e}")
            return False

    def disconnect(self):
        if self._api:
            try:
                self._api.logout()
                logger.info("已登出永豐")
            except Exception as e:
                logger.warning(f"登出時發生錯誤: {e}")
        self._connected = False

    def subscribe_tick(self, callback: Callable[[Tick], None]):
        if not self._api or not self._contract:
            logger.error("尚未連線，無法訂閱行情")
            return

        self._tick_callback = callback

        import shioaji as sj

        @self._api.on_tick_fop_v1()
        def on_tick(exchange, tick):
            t = Tick(
                datetime=tick.datetime,
                price=float(tick.close),
                volume=int(tick.volume),
                bid_price=float(tick.bid_price[0]) if tick.bid_price else 0.0,
                ask_price=float(tick.ask_price[0]) if tick.ask_price else 0.0,
            )
            if self._tick_callback:
                self._tick_callback(t)

        self._api.quote.subscribe(
            self._contract,
            quote_type=sj.constant.QuoteType.Tick,
            version=sj.constant.QuoteVersion.v1,
        )
        logger.info(f"📡 已訂閱 {self._contract.code} Tick 行情")

    def place_order(self, action: str, quantity: int, price: float = 0, price_type: str = "MKT") -> OrderResult:
        if not self._api or not self._contract:
            return OrderResult(success=False, message="尚未連線")

        import shioaji as sj

        with self._lock:
            try:
                order = self._api.Order(
                    action=sj.constant.Action.Buy if action == "BUY" else sj.constant.Action.Sell,
                    price=price,
                    quantity=quantity,
                    price_type=sj.constant.FuturesPriceType.MKT if price_type == "MKT" else sj.constant.FuturesPriceType.LMT,
                    order_type=sj.constant.OrderType.IOC,
                    octype=sj.constant.FuturesOCType.Auto,
                    account=self._api.futopt_account,
                )
                trade = self._api.place_order(self._contract, order)
                return OrderResult(
                    success=True,
                    order_id=trade.order.id if trade else "",
                    message="下單成功",
                )
            except Exception as e:
                logger.error(f"下單失敗: {e}")
                return OrderResult(success=False, message=str(e))

    def cancel_order(self, order_id: str) -> bool:
        logger.warning("取消委託功能尚未實作")
        return False

    def get_account_info(self) -> AccountInfo:
        if not self._api:
            return AccountInfo()
        try:
            margin = self._api.margin()
            return AccountInfo(
                balance=float(getattr(margin, "equity", 0)),
                equity=float(getattr(margin, "equity", 0)),
                margin_used=float(getattr(margin, "margin", 0)),
                margin_available=float(getattr(margin, "available_margin", 0)),
            )
        except Exception as e:
            logger.warning(f"查詢帳戶失敗: {e}")
            return AccountInfo()

    def get_contract_name(self) -> str:
        if self._contract:
            return f"{self._contract.code} ({self._contract.name})"
        return self._contract_code

    def _get_nearby_contract(self):
        """自動取得近月合約"""
        try:
            futures = self._api.Contracts.Futures
            mxf = getattr(futures, self._contract_code, None)
            if mxf is None:
                logger.error(f"找不到商品: {self._contract_code}")
                return None

            # 優先用 R1（近月）
            if hasattr(mxf, "MXFR1"):
                return mxf["MXFR1"]

            # 手動找最近到期
            contracts = [c for c in mxf if c.code[-2:] not in ("R1", "R2")]
            if contracts:
                return min(contracts, key=lambda c: c.delivery_date)
            return None
        except Exception as e:
            logger.error(f"取得合約失敗: {e}")
            return None


# ============================================================
# 本地模擬券商（MockBroker）
# ============================================================

class MockBroker(BaseBroker):
    """
    本地模擬券商 — 不需要永豐帳號就能完整測試
    產生合成的 MXF Tick 資料（隨機漫步 + 日內特徵）
    """

    def __init__(self, initial_price: float = 22000.0, tick_interval: float = 0.5,
                 volatility: float = 0.3, initial_balance: float = 100000.0):
        self._initial_price = initial_price
        self._tick_interval = tick_interval  # 秒
        self._volatility = volatility
        self._initial_balance = initial_balance
        self._balance = initial_balance
        self._price = initial_price
        self._tick_callback: Optional[Callable] = None
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        self._order_counter = 0
        self._position_pnl = 0.0

    def connect(self) -> bool:
        logger.info("✅ 模擬券商連線成功")
        logger.info(f"💰 模擬帳戶餘額: {self._balance:,.0f} 元")
        logger.info(f"📊 起始價格: {self._price:,.0f}")
        return True

    def disconnect(self):
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3)
        logger.info("模擬券商已斷線")

    def subscribe_tick(self, callback: Callable[[Tick], None]):
        self._tick_callback = callback
        self._running = True
        self._thread = threading.Thread(target=self._generate_ticks, daemon=True)
        self._thread.start()
        logger.info(f"📡 開始產生模擬 Tick（間隔 {self._tick_interval}s）")

    def place_order(self, action: str, quantity: int, price: float = 0, price_type: str = "MKT") -> OrderResult:
        with self._lock:
            self._order_counter += 1
            # 模擬滑價（0~2 點）
            slippage = random.randint(0, 2)
            fill_price = self._price + slippage if action == "BUY" else self._price - slippage

            # 扣除手續費
            commission = 18.0 * quantity
            self._balance -= commission

            order_id = f"MOCK-{self._order_counter:06d}"
            logger.info(f"📋 模擬成交: {action} {quantity}口 @ {fill_price} (滑價{slippage}點)")

            return OrderResult(
                success=True,
                order_id=order_id,
                fill_price=fill_price,
                fill_quantity=quantity,
                message=f"模擬成交 @ {fill_price}",
            )

    def cancel_order(self, order_id: str) -> bool:
        logger.info(f"模擬取消委託: {order_id}")
        return True

    def get_account_info(self) -> AccountInfo:
        return AccountInfo(
            balance=self._balance,
            equity=self._balance + self._position_pnl,
            margin_used=0,
            margin_available=self._balance,
            unrealized_pnl=self._position_pnl,
        )

    def get_contract_name(self) -> str:
        return "MXF 模擬合約"

    def update_pnl(self, pnl: float):
        """外部更新損益（引擎呼叫）"""
        self._position_pnl = pnl

    def update_balance(self, amount: float):
        """外部更新餘額（平倉時呼叫）"""
        self._balance += amount

    def _generate_ticks(self):
        """產生模擬 Tick 資料"""
        while self._running:
            try:
                now = datetime.now()

                # 模擬日內價格走勢（隨機漫步 + 均值回歸）
                # 波動率隨時間變化（開盤和收盤較大）
                hour = now.hour + now.minute / 60.0
                time_volatility = self._get_time_volatility(hour)

                # 隨機漫步
                change = random.gauss(0, self._volatility * time_volatility)

                # 微弱均值回歸（防止價格飄太遠）
                mean_reversion = (self._initial_price - self._price) * 0.001
                change += mean_reversion

                # 偶爾來個大波動（模擬突發事件）
                if random.random() < 0.005:  # 0.5% 機率
                    change *= random.uniform(3, 8)

                self._price = round(self._price + change)
                self._price = max(self._price, self._initial_price * 0.9)  # 防止跌太多
                self._price = min(self._price, self._initial_price * 1.1)  # 防止漲太多

                # 模擬成交量
                volume = max(1, int(random.gauss(5, 3) * time_volatility))

                tick = Tick(
                    datetime=now,
                    price=self._price,
                    volume=volume,
                    bid_price=self._price - 1,
                    ask_price=self._price + 1,
                )

                if self._tick_callback:
                    self._tick_callback(tick)

                time_module.sleep(self._tick_interval)

            except Exception as e:
                logger.error(f"模擬 Tick 產生錯誤: {e}")
                time_module.sleep(1)

    @staticmethod
    def _get_time_volatility(hour: float) -> float:
        """日內波動率曲線（開盤收盤大，中午小）"""
        if 8.75 <= hour <= 9.5:    # 開盤前30分鐘：高波動
            return 2.0
        elif 9.5 <= hour <= 11.0:  # 上午盤：正常
            return 1.0
        elif 11.0 <= hour <= 12.5:  # 午盤：低波動
            return 0.6
        elif 12.5 <= hour <= 13.75:  # 收盤前：高波動
            return 1.8
        elif 15.0 <= hour <= 16.0:  # 夜盤開盤：高波動
            return 1.5
        elif 16.0 <= hour <= 23.0:  # 夜盤：正常
            return 0.8
        else:  # 凌晨：低波動
            return 0.5
