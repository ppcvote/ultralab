"""
UltraTrader 券商測試
"""

import sys
import time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import unittest
from datetime import datetime

from core.broker import MockBroker, OrderResult
from core.market_data import Tick


class TestMockBroker(unittest.TestCase):
    """測試模擬券商"""

    def test_connect(self):
        """連線成功"""
        broker = MockBroker(initial_price=22000)
        self.assertTrue(broker.connect())

    def test_place_order_buy(self):
        """買入下單"""
        broker = MockBroker(initial_price=22000)
        broker.connect()
        result = broker.place_order("BUY", 1)
        self.assertTrue(result.success)
        self.assertGreater(result.fill_price, 0)
        self.assertEqual(result.fill_quantity, 1)

    def test_place_order_sell(self):
        """賣出下單"""
        broker = MockBroker(initial_price=22000)
        broker.connect()
        result = broker.place_order("SELL", 2)
        self.assertTrue(result.success)
        self.assertEqual(result.fill_quantity, 2)

    def test_slippage(self):
        """滑價在合理範圍"""
        broker = MockBroker(initial_price=22000)
        broker.connect()
        result = broker.place_order("BUY", 1)
        # 買入滑價：成交價 >= 原始價
        self.assertGreaterEqual(result.fill_price, 22000 - 1)
        self.assertLessEqual(result.fill_price, 22000 + 3)

    def test_commission_deducted(self):
        """手續費扣除"""
        broker = MockBroker(initial_price=22000, initial_balance=100000)
        broker.connect()
        balance_before = broker.get_account_info().balance
        broker.place_order("BUY", 1)
        balance_after = broker.get_account_info().balance
        self.assertLess(balance_after, balance_before)

    def test_tick_generation(self):
        """Tick 產生"""
        broker = MockBroker(initial_price=22000, tick_interval=0.05)
        broker.connect()

        ticks = []
        def on_tick(tick: Tick):
            ticks.append(tick)

        broker.subscribe_tick(on_tick)
        time.sleep(0.3)
        broker.disconnect()

        self.assertGreater(len(ticks), 0)
        for tick in ticks:
            self.assertIsInstance(tick, Tick)
            self.assertGreater(tick.price, 0)
            self.assertGreater(tick.volume, 0)

    def test_tick_price_range(self):
        """Tick 價格在合理範圍"""
        broker = MockBroker(initial_price=22000, tick_interval=0.02)
        broker.connect()

        ticks = []
        def on_tick(tick: Tick):
            ticks.append(tick)

        broker.subscribe_tick(on_tick)
        time.sleep(0.5)
        broker.disconnect()

        for tick in ticks:
            # 價格不應該偏離初始價太多（±10%）
            self.assertGreater(tick.price, 22000 * 0.9)
            self.assertLess(tick.price, 22000 * 1.1)

    def test_account_info(self):
        """帳戶資訊"""
        broker = MockBroker(initial_balance=50000)
        broker.connect()
        info = broker.get_account_info()
        self.assertEqual(info.balance, 50000)

    def test_contract_name(self):
        """合約名稱"""
        broker = MockBroker()
        self.assertEqual(broker.get_contract_name(), "MXF 模擬合約")

    def test_cancel_order(self):
        """取消委託"""
        broker = MockBroker()
        broker.connect()
        self.assertTrue(broker.cancel_order("MOCK-000001"))

    def test_disconnect(self):
        """斷線"""
        broker = MockBroker(tick_interval=0.05)
        broker.connect()
        broker.subscribe_tick(lambda t: None)
        time.sleep(0.1)
        broker.disconnect()
        # 斷線後不應該再產生 tick
        self.assertFalse(broker._running)


if __name__ == "__main__":
    unittest.main()
