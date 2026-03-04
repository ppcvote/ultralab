"""
UltraTrader 策略基類
定義策略介面和共用資料結構
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional

from core.market_data import KBar, MarketSnapshot


class SignalDirection(Enum):
    BUY = "BUY"
    SELL = "SELL"
    CLOSE = "CLOSE"


@dataclass
class Signal:
    """交易訊號"""
    direction: SignalDirection
    strength: float          # 0.0 ~ 1.0
    stop_loss: float         # 建議停損價
    take_profit: float       # 建議停利價
    reason: str              # 進場理由
    source: str = ""         # 來源策略名稱
    timestamp: datetime = field(default_factory=datetime.now)

    @property
    def is_buy(self) -> bool:
        return self.direction == SignalDirection.BUY

    @property
    def is_sell(self) -> bool:
        return self.direction == SignalDirection.SELL

    @property
    def is_close(self) -> bool:
        return self.direction == SignalDirection.CLOSE

    def to_dict(self) -> dict:
        return {
            "direction": self.direction.value,
            "strength": round(self.strength, 3),
            "stop_loss": self.stop_loss,
            "take_profit": self.take_profit,
            "reason": self.reason,
            "source": self.source,
            "timestamp": self.timestamp.isoformat(),
        }


class BaseStrategy(ABC):
    """策略抽象基類"""

    @property
    @abstractmethod
    def name(self) -> str:
        """策略名稱"""
        ...

    @abstractmethod
    def on_kbar(self, kbar: KBar, snapshot: MarketSnapshot) -> Optional[Signal]:
        """
        K 棒收盤時呼叫
        回傳 Signal 表示要進場/出場，回傳 None 表示不動作
        """
        ...

    def on_tick(self, price: float, timestamp: datetime) -> Optional[Signal]:
        """
        即時 Tick 觸發（用於盤中停損/停利檢查）
        預設不處理，子類可覆寫
        """
        return None

    def get_parameters(self) -> dict:
        """取得當前參數（供 Dashboard 顯示）"""
        return {}

    def update_parameters(self, params: dict):
        """更新參數（從 Dashboard 調整）"""
        pass

    def reset(self):
        """重置策略狀態（新交易日）"""
        pass
