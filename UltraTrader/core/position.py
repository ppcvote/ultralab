"""
UltraTrader 部位管理
追蹤持倉、記錄交易、計算績效
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class Side(Enum):
    FLAT = "flat"
    LONG = "long"
    SHORT = "short"


@dataclass
class Position:
    """當前持倉"""
    side: Side = Side.FLAT
    entry_price: float = 0.0
    quantity: int = 0
    entry_time: Optional[datetime] = None
    stop_loss: float = 0.0
    take_profit: float = 0.0
    trailing_stop: float = 0.0
    trailing_activated: bool = False
    highest_since_entry: float = 0.0
    lowest_since_entry: float = 999999.0
    bars_since_entry: int = 0

    @property
    def is_flat(self) -> bool:
        return self.side == Side.FLAT

    def unrealized_pnl(self, current_price: float, point_value: float = 1.0) -> float:
        """計算未實現損益"""
        if self.is_flat:
            return 0.0
        if self.side == Side.LONG:
            return (current_price - self.entry_price) * self.quantity * point_value
        else:  # SHORT
            return (self.entry_price - current_price) * self.quantity * point_value

    def unrealized_points(self, current_price: float) -> float:
        """計算未實現點數"""
        if self.is_flat:
            return 0.0
        if self.side == Side.LONG:
            return (current_price - self.entry_price) * self.quantity
        else:
            return (self.entry_price - current_price) * self.quantity


@dataclass
class Trade:
    """已完成的交易紀錄"""
    entry_time: datetime
    exit_time: datetime
    side: str  # "long" / "short"
    entry_price: float
    exit_price: float
    quantity: int
    pnl: float  # 損益（元）
    pnl_points: float  # 損益（點）
    commission: float  # 手續費
    reason: str  # 出場原因
    bars_held: int = 0  # 持倉 K 棒數

    @property
    def is_winner(self) -> bool:
        return self.pnl > 0

    @property
    def net_pnl(self) -> float:
        """扣除手續費後的淨損益"""
        return self.pnl - self.commission


# ============================================================
# 部位管理器
# ============================================================

class PositionManager:
    """管理持倉狀態和交易紀錄"""

    # 微台規格
    POINT_VALUE = 1.0       # 1 點 = 1 元
    COMMISSION = 18.0       # 單邊手續費
    TAX_RATE = 0.00002      # 交易稅

    def __init__(self, point_value: float = 1.0, commission: float = 18.0):
        self.POINT_VALUE = point_value
        self.COMMISSION = commission
        self.position = Position()
        self.trades: list[Trade] = []
        self.daily_trades: list[Trade] = []
        self._today: Optional[str] = None

    def open_position(
        self,
        side: Side,
        price: float,
        quantity: int,
        stop_loss: float,
        take_profit: float,
        timestamp: Optional[datetime] = None,
    ) -> Position:
        """開倉"""
        if not self.position.is_flat:
            raise ValueError("已有持倉，請先平倉")

        self.position = Position(
            side=side,
            entry_price=price,
            quantity=quantity,
            entry_time=timestamp or datetime.now(),
            stop_loss=stop_loss,
            take_profit=take_profit,
            trailing_stop=0.0,
            trailing_activated=False,
            highest_since_entry=price,
            lowest_since_entry=price,
            bars_since_entry=0,
        )
        return self.position

    def close_position(
        self,
        price: float,
        reason: str,
        timestamp: Optional[datetime] = None,
    ) -> Optional[Trade]:
        """平倉，回傳交易紀錄"""
        if self.position.is_flat:
            return None

        pos = self.position
        exit_time = timestamp or datetime.now()

        # 計算損益
        if pos.side == Side.LONG:
            pnl_points = (price - pos.entry_price) * pos.quantity
        else:
            pnl_points = (pos.entry_price - price) * pos.quantity

        pnl = pnl_points * self.POINT_VALUE
        commission = self.COMMISSION * 2 * pos.quantity  # 來回手續費

        trade = Trade(
            entry_time=pos.entry_time,
            exit_time=exit_time,
            side=pos.side.value,
            entry_price=pos.entry_price,
            exit_price=price,
            quantity=pos.quantity,
            pnl=pnl,
            pnl_points=pnl_points,
            commission=commission,
            reason=reason,
            bars_held=pos.bars_since_entry,
        )

        self.trades.append(trade)
        self._update_daily_trades(trade)

        # 清空持倉
        self.position = Position()
        return trade

    def update_price(self, price: float):
        """更新當前價格（追蹤最高/最低價）"""
        if self.position.is_flat:
            return
        self.position.highest_since_entry = max(self.position.highest_since_entry, price)
        self.position.lowest_since_entry = min(self.position.lowest_since_entry, price)

    def increment_bars(self):
        """K 棒收盤，增加持倉 K 棒計數"""
        if not self.position.is_flat:
            self.position.bars_since_entry += 1

    def _update_daily_trades(self, trade: Trade):
        """更新每日交易紀錄"""
        today = trade.exit_time.strftime("%Y-%m-%d")
        if self._today != today:
            self._today = today
            self.daily_trades = []
        self.daily_trades.append(trade)

    # ---- 統計 ----

    def get_daily_pnl(self) -> float:
        """今日已實現損益"""
        return sum(t.net_pnl for t in self.daily_trades)

    def get_daily_trade_count(self) -> int:
        """今日交易次數"""
        return len(self.daily_trades)

    def get_consecutive_losses(self) -> int:
        """當前連續虧損次數"""
        count = 0
        for trade in reversed(self.daily_trades):
            if trade.net_pnl < 0:
                count += 1
            else:
                break
        return count

    def get_stats(self) -> dict:
        """計算整體績效統計"""
        if not self.trades:
            return {
                "total_trades": 0,
                "win_rate": 0.0,
                "avg_win": 0.0,
                "avg_loss": 0.0,
                "profit_factor": 0.0,
                "total_pnl": 0.0,
                "max_drawdown": 0.0,
            }

        winners = [t for t in self.trades if t.net_pnl > 0]
        losers = [t for t in self.trades if t.net_pnl <= 0]

        total_wins = sum(t.net_pnl for t in winners) if winners else 0
        total_losses = abs(sum(t.net_pnl for t in losers)) if losers else 0

        # 最大回撤
        equity_curve = []
        running = 0.0
        for t in self.trades:
            running += t.net_pnl
            equity_curve.append(running)

        max_dd = 0.0
        peak = 0.0
        for eq in equity_curve:
            peak = max(peak, eq)
            dd = peak - eq
            max_dd = max(max_dd, dd)

        return {
            "total_trades": len(self.trades),
            "winners": len(winners),
            "losers": len(losers),
            "win_rate": len(winners) / len(self.trades) * 100 if self.trades else 0,
            "avg_win": total_wins / len(winners) if winners else 0,
            "avg_loss": total_losses / len(losers) if losers else 0,
            "profit_factor": total_wins / total_losses if total_losses > 0 else float("inf"),
            "total_pnl": sum(t.net_pnl for t in self.trades),
            "max_drawdown": max_dd,
            "avg_bars_held": sum(t.bars_held for t in self.trades) / len(self.trades),
        }

    def to_dict(self, current_price: float = 0.0) -> dict:
        """序列化為 dict（供 Dashboard 顯示）"""
        pos = self.position
        return {
            "side": pos.side.value,
            "entry_price": pos.entry_price,
            "quantity": pos.quantity,
            "entry_time": pos.entry_time.isoformat() if pos.entry_time else None,
            "stop_loss": pos.stop_loss,
            "take_profit": pos.take_profit,
            "trailing_stop": pos.trailing_stop,
            "trailing_activated": pos.trailing_activated,
            "bars_since_entry": pos.bars_since_entry,
            "unrealized_pnl": pos.unrealized_pnl(current_price, self.POINT_VALUE),
            "unrealized_points": pos.unrealized_points(current_price),
        }
