"""
UltraTrader 風控測試
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import unittest
from datetime import datetime

from risk.position_sizing import PositionSizer, RISK_PRESETS
from risk.circuit_breaker import CircuitBreaker, CircuitState
from risk.manager import RiskManager
from core.position import PositionManager
from core.broker import AccountInfo
from core.market_data import MarketSnapshot
from strategy.base import Signal, SignalDirection


class TestPositionSizer(unittest.TestCase):
    """測試部位大小計算"""

    def test_conservative_sizing(self):
        """保守模式：最多 1 口"""
        sizer = PositionSizer("conservative")
        qty = sizer.calculate(account_balance=100000, stop_distance=100)
        self.assertEqual(qty, 1)

    def test_balanced_sizing(self):
        """平衡模式：計算合理口數"""
        sizer = PositionSizer("balanced")
        # 100000 * 1% = 1000 元風險 / 100 點停損 / 1 元點值 = 10，但上限 2
        qty = sizer.calculate(account_balance=100000, stop_distance=100)
        self.assertEqual(qty, 2)  # max_contracts = 2

    def test_aggressive_sizing(self):
        """積極模式"""
        sizer = PositionSizer("aggressive")
        qty = sizer.calculate(account_balance=100000, stop_distance=100)
        self.assertEqual(qty, 3)  # max_contracts = 3

    def test_minimum_one_contract(self):
        """不管多小都至少 1 口"""
        sizer = PositionSizer("conservative")
        qty = sizer.calculate(account_balance=1000, stop_distance=500)
        self.assertEqual(qty, 1)

    def test_zero_balance(self):
        """餘額為 0"""
        sizer = PositionSizer("balanced")
        qty = sizer.calculate(account_balance=0, stop_distance=100)
        self.assertEqual(qty, 1)


class TestCircuitBreaker(unittest.TestCase):
    """測試熔斷機制"""

    def test_initial_state(self):
        """初始狀態為 ACTIVE"""
        cb = CircuitBreaker()
        self.assertEqual(cb.state, CircuitState.ACTIVE)
        self.assertTrue(cb.can_trade)

    def test_daily_loss_halt(self):
        """每日虧損超限 → HALTED"""
        cb = CircuitBreaker(max_daily_loss=500)
        cb.on_trade(pnl=-300)
        self.assertTrue(cb.can_trade)
        cb.on_trade(pnl=-250)
        self.assertEqual(cb.state, CircuitState.HALTED)
        self.assertFalse(cb.can_trade)

    def test_consecutive_loss_cooldown(self):
        """連續虧損 → COOLDOWN"""
        cb = CircuitBreaker(max_consecutive_loss=3, max_daily_loss=10000)
        cb.on_trade(pnl=-50)
        cb.on_trade(pnl=-50)
        cb.on_trade(pnl=-50)
        self.assertEqual(cb.state, CircuitState.COOLDOWN)

    def test_win_resets_consecutive(self):
        """獲利重置連續虧損計數"""
        cb = CircuitBreaker(max_consecutive_loss=3, max_daily_loss=10000)
        cb.on_trade(pnl=-50)
        cb.on_trade(pnl=-50)
        cb.on_trade(pnl=100)  # 打斷連續虧損
        cb.on_trade(pnl=-50)
        self.assertTrue(cb.can_trade)

    def test_emergency_stop(self):
        """異常虧損 → EMERGENCY_STOP"""
        cb = CircuitBreaker(max_daily_loss=10000)
        cb.on_trade(pnl=-500, expected_max_loss=100)
        self.assertEqual(cb.state, CircuitState.EMERGENCY_STOP)

    def test_manual_resume(self):
        """手動恢復"""
        cb = CircuitBreaker(max_daily_loss=500)
        cb.on_trade(pnl=-600)
        self.assertFalse(cb.can_trade)
        cb.manual_resume()
        self.assertTrue(cb.can_trade)

    def test_connection_lost(self):
        """連線中斷"""
        cb = CircuitBreaker()
        cb.on_connection_lost()
        self.assertEqual(cb.state, CircuitState.EMERGENCY_STOP)
        cb.on_connection_restored()
        self.assertEqual(cb.state, CircuitState.ACTIVE)


class TestRiskManager(unittest.TestCase):
    """測試風控管理器"""

    def test_approve_valid_signal(self):
        """有效訊號通過風控"""
        rm = RiskManager("balanced")
        pm = PositionManager()
        account = AccountInfo(balance=100000, equity=100000, margin_available=100000)
        snap = MarketSnapshot(price=22000, atr=50)

        signal = Signal(
            direction=SignalDirection.BUY,
            strength=0.7,
            stop_loss=21900,
            take_profit=22200,
            reason="test",
        )

        decision = rm.evaluate(signal, pm, account, snap)
        self.assertTrue(decision.approved)
        self.assertGreater(decision.quantity, 0)

    def test_reject_when_has_position(self):
        """已有持倉 → 拒絕新進場"""
        from core.position import Side
        rm = RiskManager("balanced")
        pm = PositionManager()
        pm.open_position(Side.LONG, 22000, 1, 21900, 22200)
        account = AccountInfo(balance=100000, equity=100000, margin_available=95000)
        snap = MarketSnapshot(price=22050, atr=50)

        signal = Signal(
            direction=SignalDirection.BUY, strength=0.8,
            stop_loss=21950, take_profit=22200, reason="test",
        )

        decision = rm.evaluate(signal, pm, account, snap)
        self.assertFalse(decision.approved)
        self.assertIn("已有持倉", decision.rejection_reason)

    def test_approve_close_signal(self):
        """平倉訊號直接通過"""
        from core.position import Side
        rm = RiskManager("balanced")
        pm = PositionManager()
        pm.open_position(Side.LONG, 22000, 1, 21900, 22200)
        account = AccountInfo(balance=100000, equity=100000, margin_available=95000)
        snap = MarketSnapshot(price=22100, atr=50)

        signal = Signal(
            direction=SignalDirection.CLOSE, strength=1.0,
            stop_loss=0, take_profit=0, reason="停利",
        )

        decision = rm.evaluate(signal, pm, account, snap)
        self.assertTrue(decision.approved)

    def test_reject_low_balance(self):
        """餘額不足 → 拒絕"""
        rm = RiskManager("balanced")
        pm = PositionManager()
        account = AccountInfo(balance=3000, equity=3000, margin_available=3000)
        snap = MarketSnapshot(price=22000, atr=50)

        signal = Signal(
            direction=SignalDirection.BUY, strength=0.8,
            stop_loss=21900, take_profit=22200, reason="test",
        )

        decision = rm.evaluate(signal, pm, account, snap)
        self.assertFalse(decision.approved)
        self.assertIn("權益不足", decision.rejection_reason)


if __name__ == "__main__":
    unittest.main()
