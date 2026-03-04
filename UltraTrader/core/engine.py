"""
UltraTrader 交易引擎
核心迴圈：串接 Broker → MarketData → Strategy → Risk → Dashboard
"""

import os
import sys
import threading
import queue
from datetime import datetime, time
from enum import Enum
from pathlib import Path
from typing import Optional, Callable

from loguru import logger
from dotenv import load_dotenv

# 確保 UltraTrader 根目錄在 sys.path
PROJECT_ROOT = Path(__file__).parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from core.broker import BaseBroker, MockBroker, ShioajiBroker, OrderResult, AccountInfo
from core.market_data import Tick, KBar, TickAggregator, IndicatorEngine, MarketSnapshot
from core.position import PositionManager, Position, Side
from core.logger import setup_logger, log_trade, log_order, log_fill, log_pnl
from strategy.base import BaseStrategy, Signal, SignalDirection
from strategy.momentum import AdaptiveMomentumStrategy
from strategy.filters import MarketRegime
from risk.manager import RiskManager


class EngineState(Enum):
    INITIALIZING = "initializing"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"
    ERROR = "error"


class TradingEngine:
    """
    交易引擎 — 事件驅動架構

    資料流：
    Tick → TickAggregator → K棒完成 → IndicatorEngine → Strategy → RiskManager → Broker
    """

    def __init__(self):
        self.state = EngineState.INITIALIZING
        self._lock = threading.Lock()
        self._event_queue: queue.Queue = queue.Queue(maxsize=10000)

        # 元件（初始化時建立）
        self.broker: Optional[BaseBroker] = None
        self.aggregator: Optional[TickAggregator] = None
        self.indicator_engine: Optional[IndicatorEngine] = None
        self.strategy: Optional[BaseStrategy] = None
        self.risk_manager: Optional[RiskManager] = None
        self.position_manager: Optional[PositionManager] = None
        self.snapshot: MarketSnapshot = MarketSnapshot()

        # 設定
        self.trading_mode: str = "simulation"
        self.risk_profile: str = "balanced"
        self.timeframe: int = 1  # 主策略用的 K 棒週期（分鐘）

        # Dashboard 回調
        self._ws_broadcast: Optional[Callable] = None

        # 狀態
        self._running = False
        self._engine_thread: Optional[threading.Thread] = None
        self._heartbeat_count = 0

    def initialize(self):
        """初始化所有元件"""
        logger.info("🚀 UltraTrader 初始化中...")

        # 載入環境變數
        env_path = PROJECT_ROOT / ".env"
        if env_path.exists():
            load_dotenv(env_path)
            logger.info("✅ 載入 .env 設定")
        else:
            logger.warning("⚠️ 找不到 .env，使用預設設定")

        self.trading_mode = os.getenv("TRADING_MODE", "simulation")
        self.risk_profile = os.getenv("RISK_PROFILE", "balanced")

        # 建立 Broker
        if self.trading_mode == "simulation":
            self.broker = MockBroker(
                initial_price=22000.0,
                tick_interval=0.5,
                volatility=0.5,
                initial_balance=100000.0,
            )
            logger.info("📊 模式: 本地模擬")
        else:
            api_key = os.getenv("SHIOAJI_API_KEY", "")
            secret_key = os.getenv("SHIOAJI_SECRET_KEY", "")
            if not api_key or not secret_key:
                logger.error("❌ 缺少 SHIOAJI_API_KEY / SHIOAJI_SECRET_KEY")
                self.state = EngineState.ERROR
                return False

            self.broker = ShioajiBroker(
                api_key=api_key,
                secret_key=secret_key,
                ca_path=os.getenv("SHIOAJI_CA_PATH", ""),
                ca_password=os.getenv("SHIOAJI_CA_PASSWORD", ""),
                person_id=os.getenv("SHIOAJI_PERSON_ID", ""),
                simulation=(self.trading_mode == "paper"),
                contract_code=os.getenv("CONTRACT_CODE", "MXF"),
            )
            logger.info(f"📊 模式: {'模擬盤' if self.trading_mode == 'paper' else '實單'}")

        # 建立行情處理
        self.aggregator = TickAggregator(intervals=[1, 5, 15])
        self.indicator_engine = IndicatorEngine(lookback_period=200)

        # 建立策略
        self.strategy = AdaptiveMomentumStrategy()

        # 建立風控
        self.risk_manager = RiskManager(profile=self.risk_profile)

        # 建立部位管理
        self.position_manager = PositionManager(
            point_value=1.0,
            commission=18.0,
        )

        # 註冊 K 棒完成回調
        self.aggregator.on_kbar_complete(self.timeframe, self._on_kbar_complete)

        self.state = EngineState.INITIALIZING
        logger.info("✅ 所有元件初始化完成")
        return True

    def start(self):
        """啟動交易引擎"""
        if self.state == EngineState.RUNNING:
            logger.warning("引擎已在運行中")
            return

        # 連線 Broker
        if not self.broker.connect():
            logger.error("❌ Broker 連線失敗")
            self.state = EngineState.ERROR
            return

        # 訂閱 Tick
        self.broker.subscribe_tick(self._on_tick)

        self._running = True
        self.state = EngineState.RUNNING

        # 啟動引擎執行緒（處理事件佇列）
        self._engine_thread = threading.Thread(target=self._engine_loop, daemon=True)
        self._engine_thread.start()

        logger.info("🟢 交易引擎啟動")
        self._broadcast("engine_state", {"state": "running"})

    def stop(self):
        """停止交易引擎"""
        logger.info("⏹️ 停止交易引擎...")

        # 平倉
        if not self.position_manager.position.is_flat:
            self._force_close("引擎停止，強制平倉")

        self._running = False
        self.state = EngineState.STOPPED

        # 斷線
        if self.broker:
            self.broker.disconnect()

        logger.info("🔴 交易引擎已停止")
        self._broadcast("engine_state", {"state": "stopped"})

    def pause(self):
        """暫停交易（繼續接收行情但不下單）"""
        self.state = EngineState.PAUSED
        logger.info("⏸️ 交易暫停")
        self._broadcast("engine_state", {"state": "paused"})

    def resume(self):
        """恢復交易"""
        if self.state == EngineState.PAUSED:
            self.state = EngineState.RUNNING
            logger.info("▶️ 交易恢復")
            self._broadcast("engine_state", {"state": "running"})

    def manual_close(self):
        """手動平倉"""
        if self.position_manager.position.is_flat:
            logger.info("目前沒有持倉")
            return
        self._force_close("手動平倉")

    def set_risk_profile(self, profile: str):
        """切換風險等級"""
        self.risk_profile = profile
        if self.risk_manager:
            self.risk_manager.set_profile(profile)
        self._broadcast("settings", {"risk_profile": profile})

    def set_ws_broadcast(self, callback: Callable):
        """設定 WebSocket 廣播函數"""
        self._ws_broadcast = callback

    # ============================================================
    # 事件處理（核心邏輯）
    # ============================================================

    def _on_tick(self, tick: Tick):
        """Tick 回調（在 Broker 的執行緒上）"""
        # 放入事件佇列，由引擎執行緒處理
        try:
            self._event_queue.put_nowait(("tick", tick))
        except queue.Full:
            pass  # 佇列滿了就丟棄（不阻塞 Broker 執行緒）

    def _on_kbar_complete(self, kbar: KBar):
        """K 棒完成回調"""
        try:
            self._event_queue.put_nowait(("kbar", kbar))
        except queue.Full:
            pass

    def _engine_loop(self):
        """引擎主迴圈（單獨執行緒）"""
        logger.info("🔄 引擎迴圈啟動")

        while self._running:
            try:
                event_type, data = self._event_queue.get(timeout=1.0)

                if event_type == "tick":
                    self._process_tick(data)
                elif event_type == "kbar":
                    self._process_kbar(data)

            except queue.Empty:
                # 心跳
                self._heartbeat_count += 1
                if self._heartbeat_count % 60 == 0:  # 每 60 秒
                    self._heartbeat()
            except Exception as e:
                logger.error(f"引擎迴圈錯誤: {e}")

        logger.info("🔄 引擎迴圈結束")

    def _process_tick(self, tick: Tick):
        """處理 Tick"""
        # 更新聚合器
        self.aggregator.on_tick(tick)

        # 更新部位追蹤
        self.position_manager.update_price(tick.price)

        # 更新 MockBroker 損益
        if isinstance(self.broker, MockBroker):
            pnl = self.position_manager.position.unrealized_pnl(tick.price)
            self.broker.update_pnl(pnl)

        # 盤中停損停利檢查（每個 Tick 都檢查）
        if self.state == EngineState.RUNNING and not self.position_manager.position.is_flat:
            self.snapshot.price = tick.price
            self.snapshot.timestamp = tick.datetime
            exit_signal = self.strategy.check_exit(self.position_manager.position, self.snapshot)
            if exit_signal:
                self._execute_exit(exit_signal, tick.price)

        # 廣播 Tick
        self._broadcast("tick", {
            "price": tick.price,
            "volume": tick.volume,
            "time": tick.datetime.isoformat(),
            "bid": tick.bid_price,
            "ask": tick.ask_price,
        })

    def _process_kbar(self, kbar: KBar):
        """處理完成的 K 棒"""
        # 更新指標
        df = self.aggregator.get_bars_dataframe(self.timeframe, count=200)
        if len(df) < 5:
            return

        self.snapshot = self.indicator_engine.update(df)

        # 更新持倉 K 棒計數
        self.position_manager.increment_bars()

        # 廣播 K 棒
        self._broadcast("kbar", {
            "time": kbar.datetime.isoformat(),
            "open": kbar.open,
            "high": kbar.high,
            "low": kbar.low,
            "close": kbar.close,
            "volume": kbar.volume,
            "interval": kbar.interval,
        })

        # 廣播指標
        self._broadcast("signal", {
            "regime": self.strategy.regime_classifier.get_regime_info() if hasattr(self.strategy, 'regime_classifier') else {},
            "signal_strength": self.strategy._last_signal_strength if hasattr(self.strategy, '_last_signal_strength') else 0,
            "adx": round(self.snapshot.adx, 1),
            "rsi": round(self.snapshot.rsi, 1),
            "atr": round(self.snapshot.atr, 1),
            "ema20": round(self.snapshot.ema20, 0),
            "ema60": round(self.snapshot.ema60, 0),
            "bb_upper": round(self.snapshot.bb_upper, 0),
            "bb_lower": round(self.snapshot.bb_lower, 0),
        })

        # 引擎暫停中 → 不做交易決策
        if self.state != EngineState.RUNNING:
            return

        # 收盤前檢查（13:40 強制平倉）
        now = datetime.now().time()
        if time(13, 40) <= now <= time(13, 44):
            if not self.position_manager.position.is_flat:
                self._force_close("收盤前自動平倉")
                return

        # ---- 策略決策 ----
        # 先檢查出場
        if not self.position_manager.position.is_flat:
            exit_signal = self.strategy.check_exit(self.position_manager.position, self.snapshot)
            if exit_signal:
                self._execute_exit(exit_signal, self.snapshot.price)
                return

        # 再檢查進場
        if self.position_manager.position.is_flat:
            entry_signal = self.strategy.on_kbar(kbar, self.snapshot)
            if entry_signal:
                self._execute_entry(entry_signal)

    def _execute_entry(self, signal: Signal):
        """執行進場"""
        # 風控評估
        account = self.broker.get_account_info()
        decision = self.risk_manager.evaluate(
            signal, self.position_manager, account, self.snapshot
        )

        if not decision.approved:
            logger.info(f"🚫 風控拒絕: {decision.rejection_reason}")
            return

        # 下單
        action = "BUY" if signal.is_buy else "SELL"
        log_order(action, self.snapshot.price, decision.quantity, "MKT")

        result = self.broker.place_order(
            action=action,
            quantity=decision.quantity,
            price_type="MKT",
        )

        if not result.success:
            logger.error(f"❌ 下單失敗: {result.message}")
            return

        # 更新持倉
        fill_price = result.fill_price if result.fill_price > 0 else self.snapshot.price
        side = Side.LONG if signal.is_buy else Side.SHORT

        self.position_manager.open_position(
            side=side,
            price=fill_price,
            quantity=decision.quantity,
            stop_loss=signal.stop_loss,
            take_profit=signal.take_profit,
        )

        log_fill(action, fill_price, decision.quantity)

        # 廣播交易
        self._broadcast("trade", {
            "time": datetime.now().isoformat(),
            "action": action.lower(),
            "price": fill_price,
            "quantity": decision.quantity,
            "stop_loss": signal.stop_loss,
            "take_profit": signal.take_profit,
            "reason": signal.reason,
            "signal_strength": round(signal.strength, 2),
        })

    def _execute_exit(self, signal: Signal, price: float):
        """執行出場"""
        pos = self.position_manager.position
        action = "SELL" if pos.side == Side.LONG else "BUY"

        log_order(action, price, pos.quantity, "MKT 平倉")

        result = self.broker.place_order(
            action=action,
            quantity=pos.quantity,
            price_type="MKT",
        )

        if not result.success:
            logger.error(f"❌ 平倉下單失敗: {result.message}")
            return

        fill_price = result.fill_price if result.fill_price > 0 else price
        trade = self.position_manager.close_position(fill_price, signal.reason)

        if trade:
            log_pnl(trade.net_pnl, signal.reason)

            # 更新 MockBroker 餘額
            if isinstance(self.broker, MockBroker):
                self.broker.update_balance(trade.pnl)
                self.broker.update_pnl(0)

            # 通知風控
            self.risk_manager.on_trade_closed(trade.net_pnl)

            # 廣播交易
            self._broadcast("trade", {
                "time": datetime.now().isoformat(),
                "action": "close",
                "price": fill_price,
                "pnl": round(trade.net_pnl, 0),
                "pnl_points": round(trade.pnl_points, 0),
                "reason": signal.reason,
                "side": trade.side,
            })

    def _force_close(self, reason: str):
        """強制平倉"""
        signal = Signal(
            direction=SignalDirection.CLOSE,
            strength=1.0,
            stop_loss=0,
            take_profit=0,
            reason=reason,
            source="Engine",
        )
        self._execute_exit(signal, self.snapshot.price)

    def _heartbeat(self):
        """心跳日誌"""
        pos = self.position_manager.position
        price = self.aggregator.current_price if self.aggregator else 0
        if pos.is_flat:
            logger.debug(f"💓 心跳 | 價格: {price:.0f} | 空倉 | 狀態: {self.state.value}")
        else:
            pnl = pos.unrealized_pnl(price)
            logger.debug(f"💓 心跳 | 價格: {price:.0f} | {pos.side.value} @ {pos.entry_price:.0f} | 損益: {pnl:+.0f}")

    def _broadcast(self, msg_type: str, data: dict):
        """廣播訊息到 Dashboard"""
        if self._ws_broadcast:
            try:
                self._ws_broadcast({"type": msg_type, "data": data})
            except Exception:
                pass

    # ============================================================
    # 狀態查詢（供 Dashboard API 使用）
    # ============================================================

    def get_state(self) -> dict:
        """取得完整引擎狀態"""
        price = self.aggregator.current_price if self.aggregator else 0
        return {
            "engine_state": self.state.value,
            "trading_mode": self.trading_mode,
            "risk_profile": self.risk_profile,
            "contract": self.broker.get_contract_name() if self.broker else "",
            "price": price,
            "position": self.position_manager.to_dict(price) if self.position_manager else {},
            "daily_pnl": self.position_manager.get_daily_pnl() if self.position_manager else 0,
            "daily_trades": self.position_manager.get_daily_trade_count() if self.position_manager else 0,
            "strategy": self.strategy.get_parameters() if self.strategy else {},
            "risk": self.risk_manager.to_dict() if self.risk_manager else {},
            "snapshot": {
                "adx": round(self.snapshot.adx, 1),
                "rsi": round(self.snapshot.rsi, 1),
                "atr": round(self.snapshot.atr, 1),
                "ema20": round(self.snapshot.ema20, 0),
                "ema60": round(self.snapshot.ema60, 0),
                "volume_ratio": round(self.snapshot.volume_ratio, 2),
            },
        }

    def get_trade_history(self) -> list[dict]:
        """取得交易紀錄"""
        if not self.position_manager:
            return []
        return [
            {
                "entry_time": t.entry_time.isoformat(),
                "exit_time": t.exit_time.isoformat(),
                "side": t.side,
                "entry_price": t.entry_price,
                "exit_price": t.exit_price,
                "quantity": t.quantity,
                "pnl": round(t.net_pnl, 0),
                "pnl_points": round(t.pnl_points, 0),
                "reason": t.reason,
                "bars_held": t.bars_held,
            }
            for t in self.position_manager.trades
        ]

    def get_kbars(self, timeframe: int = 1, count: int = 200) -> list[dict]:
        """取得 K 棒資料（供圖表用）"""
        if not self.aggregator:
            return []
        bars = self.aggregator.get_bars(timeframe, count)
        return [
            {
                "time": b.datetime.isoformat(),
                "open": b.open,
                "high": b.high,
                "low": b.low,
                "close": b.close,
                "volume": b.volume,
            }
            for b in bars
        ]

    def get_stats(self) -> dict:
        """取得績效統計"""
        if not self.position_manager:
            return {}
        return self.position_manager.get_stats()
