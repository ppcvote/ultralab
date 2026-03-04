"""
UltraTrader 策略測試
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import unittest
from datetime import datetime

from core.market_data import KBar, MarketSnapshot, IndicatorEngine
from strategy.filters import MarketRegime, MarketRegimeClassifier
from strategy.signals import MultiFactorSignalGenerator
from strategy.momentum import AdaptiveMomentumStrategy
from strategy.base import SignalDirection


class TestMarketRegimeClassifier(unittest.TestCase):
    """測試市場狀態分類器"""

    def setUp(self):
        self.classifier = MarketRegimeClassifier()

    def test_strong_trend_up(self):
        """ADX 高 + 多頭排列 → 強勢上漲"""
        snap = MarketSnapshot(
            adx=40, plus_di=30, minus_di=15,
            ema5=22100, ema10=22050, ema20=22000, ema60=21900,
            atr_ratio=1.0,
        )
        # 需要連續 2 根確認（hysteresis）
        self.classifier.classify(snap)
        regime = self.classifier.classify(snap)
        self.assertEqual(regime, MarketRegime.STRONG_TREND_UP)

    def test_strong_trend_down(self):
        """ADX 高 + 空頭排列 → 強勢下跌"""
        snap = MarketSnapshot(
            adx=38, plus_di=12, minus_di=28,
            ema5=21800, ema10=21850, ema20=21900, ema60=22000,
            atr_ratio=1.0,
        )
        self.classifier.classify(snap)
        regime = self.classifier.classify(snap)
        self.assertEqual(regime, MarketRegime.STRONG_TREND_DOWN)

    def test_ranging(self):
        """ADX 低 → 盤整"""
        snap = MarketSnapshot(
            adx=15, plus_di=20, minus_di=18,
            ema5=22000, ema10=22010, ema20=22005, ema60=22008,
            atr_ratio=0.8,
        )
        # 初始狀態就是 RANGING，所以不需要遲滯
        regime = self.classifier.classify(snap)
        self.assertEqual(regime, MarketRegime.RANGING)

    def test_volatile(self):
        """ATR 比率過高 → 劇烈波動"""
        snap = MarketSnapshot(
            adx=30, atr_ratio=2.0,
            ema5=22000, ema20=22000, ema60=22000,
        )
        self.classifier.classify(snap)
        regime = self.classifier.classify(snap)
        self.assertEqual(regime, MarketRegime.VOLATILE)

    def test_hysteresis(self):
        """遲滯測試：需要連續 2 根 K 棒才切換"""
        snap_trend = MarketSnapshot(
            adx=35, plus_di=25, minus_di=12,
            ema5=22100, ema20=22000, ema60=21900,
            atr_ratio=1.0,
        )
        snap_range = MarketSnapshot(
            adx=15, plus_di=20, minus_di=18,
            ema5=22000, ema20=22000, ema60=22000,
            atr_ratio=0.8,
        )

        # 初始是 RANGING
        # 1 根趨勢 K 棒 → 還是 RANGING
        regime = self.classifier.classify(snap_trend)
        self.assertEqual(regime, MarketRegime.RANGING)

        # 第 2 根趨勢 → 切換
        regime = self.classifier.classify(snap_trend)
        self.assertNotEqual(regime, MarketRegime.RANGING)


class TestMultiFactorSignalGenerator(unittest.TestCase):
    """測試多因子訊號產生器"""

    def setUp(self):
        self.generator = MultiFactorSignalGenerator()

    def test_strong_buy_signal(self):
        """所有因子利多 → 產生強買入訊號"""
        snap = MarketSnapshot(
            price=22100,
            ema5=22080, ema10=22060, ema20=22000, ema60=21900,
            rsi=62, rsi_ma5=60, rsi_ma10=55,
            adx=35, plus_di=28, minus_di=15,
            atr=50, atr_ratio=1.0, atr_ma20=50,
            volume=100, volume_ma20=60, volume_ratio=1.67,
            recent_high=22090, recent_low=21950,
        )
        signal = self.generator.generate(snap, MarketRegime.STRONG_TREND_UP)
        self.assertIsNotNone(signal)
        self.assertEqual(signal.direction, SignalDirection.BUY)
        self.assertGreater(signal.strength, 0.5)

    def test_no_signal_in_ranging(self):
        """盤整市 → 不產生動量訊號"""
        snap = MarketSnapshot(price=22000, adx=15, atr_ratio=0.8)
        signal = self.generator.generate(snap, MarketRegime.RANGING)
        self.assertIsNone(signal)

    def test_no_signal_in_volatile(self):
        """劇烈波動 → 不交易"""
        snap = MarketSnapshot(price=22000, atr_ratio=2.5)
        signal = self.generator.generate(snap, MarketRegime.VOLATILE)
        self.assertIsNone(signal)


class TestAdaptiveMomentumStrategy(unittest.TestCase):
    """測試自適應動量策略"""

    def setUp(self):
        self.strategy = AdaptiveMomentumStrategy()

    def test_exit_stop_loss_long(self):
        """做多停損觸發"""
        from core.position import Position, Side

        position = Position(
            side=Side.LONG,
            entry_price=22000,
            quantity=1,
            stop_loss=21900,
            take_profit=22200,
            entry_time=datetime.now(),
        )

        snap = MarketSnapshot(price=21890, atr=50)
        signal = self.strategy.check_exit(position, snap)
        self.assertIsNotNone(signal)
        self.assertEqual(signal.direction, SignalDirection.CLOSE)
        self.assertIn("停損", signal.reason)

    def test_exit_take_profit_short(self):
        """做空停利觸發"""
        from core.position import Position, Side

        position = Position(
            side=Side.SHORT,
            entry_price=22000,
            quantity=1,
            stop_loss=22100,
            take_profit=21800,
            entry_time=datetime.now(),
        )

        snap = MarketSnapshot(price=21790, atr=50)
        signal = self.strategy.check_exit(position, snap)
        self.assertIsNotNone(signal)
        self.assertEqual(signal.direction, SignalDirection.CLOSE)
        self.assertIn("停利", signal.reason)

    def test_no_exit_when_flat(self):
        """空倉不觸發出場"""
        from core.position import Position
        position = Position()
        snap = MarketSnapshot(price=22000)
        signal = self.strategy.check_exit(position, snap)
        self.assertIsNone(signal)


if __name__ == "__main__":
    unittest.main()
