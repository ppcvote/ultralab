"""
UltraTrader 均值回歸策略（副策略）
盤整市場使用 — 布林通道 + RSI 超買超賣 + K棒型態
"""

from typing import Optional

from loguru import logger

from core.market_data import KBar, MarketSnapshot
from core.position import Position, Side
from strategy.base import BaseStrategy, Signal, SignalDirection
from strategy.filters import MarketRegime, MarketRegimeClassifier


class MeanReversionStrategy(BaseStrategy):
    """
    均值回歸策略

    僅在盤整市（RANGING）啟用
    進場：價格碰布林通道邊緣 + RSI 超買/超賣 + K棒確認
    出場：回到布林中軌 / 停損 / 時間停損
    """

    @property
    def name(self) -> str:
        return "均值回歸策略"

    def __init__(self):
        self.regime_classifier = MarketRegimeClassifier()
        self._last_signal_strength = 0.0

    def on_kbar(self, kbar: KBar, snapshot: MarketSnapshot) -> Optional[Signal]:
        """K 棒收盤決策"""
        regime = self.regime_classifier.classify(snapshot)

        # 只在盤整市啟用
        if regime != MarketRegime.RANGING:
            return None

        atr = snapshot.atr if snapshot.atr > 0 else 50.0

        # ---- 做多條件 ----
        if self._check_buy_conditions(kbar, snapshot):
            strength = self._calculate_buy_strength(kbar, snapshot)
            self._last_signal_strength = strength

            if strength >= 0.50:
                stop_loss = snapshot.bb_lower - atr * 1.0
                take_profit = snapshot.bb_middle  # 目標：回到中軌

                logger.info(f"📊 均值回歸做多 | 強度: {strength:.2f} | 目標: 中軌 {snapshot.bb_middle:.0f}")

                return Signal(
                    direction=SignalDirection.BUY,
                    strength=strength,
                    stop_loss=round(stop_loss),
                    take_profit=round(take_profit),
                    reason=f"均值回歸做多: 觸及下軌 RSI={snapshot.rsi:.0f}",
                    source=self.name,
                )

        # ---- 做空條件 ----
        if self._check_sell_conditions(kbar, snapshot):
            strength = self._calculate_sell_strength(kbar, snapshot)
            self._last_signal_strength = strength

            if strength >= 0.50:
                stop_loss = snapshot.bb_upper + atr * 1.0
                take_profit = snapshot.bb_middle

                logger.info(f"📊 均值回歸做空 | 強度: {strength:.2f} | 目標: 中軌 {snapshot.bb_middle:.0f}")

                return Signal(
                    direction=SignalDirection.SELL,
                    strength=strength,
                    stop_loss=round(stop_loss),
                    take_profit=round(take_profit),
                    reason=f"均值回歸做空: 觸及上軌 RSI={snapshot.rsi:.0f}",
                    source=self.name,
                )

        return None

    def check_exit(self, position: Position, snapshot: MarketSnapshot) -> Optional[Signal]:
        """檢查出場條件"""
        if position.is_flat:
            return None

        price = snapshot.price
        atr = snapshot.atr if snapshot.atr > 0 else 50.0

        # 停損
        if position.side == Side.LONG and price <= position.stop_loss:
            return Signal(
                direction=SignalDirection.CLOSE, strength=1.0,
                stop_loss=0, take_profit=0,
                reason=f"均值回歸停損 @ {price:.0f}", source=self.name,
            )
        if position.side == Side.SHORT and price >= position.stop_loss:
            return Signal(
                direction=SignalDirection.CLOSE, strength=1.0,
                stop_loss=0, take_profit=0,
                reason=f"均值回歸停損 @ {price:.0f}", source=self.name,
            )

        # 停利（回到中軌）
        if position.side == Side.LONG and price >= position.take_profit:
            return Signal(
                direction=SignalDirection.CLOSE, strength=1.0,
                stop_loss=0, take_profit=0,
                reason=f"均值回歸停利: 回到中軌 @ {price:.0f}", source=self.name,
            )
        if position.side == Side.SHORT and price <= position.take_profit:
            return Signal(
                direction=SignalDirection.CLOSE, strength=1.0,
                stop_loss=0, take_profit=0,
                reason=f"均值回歸停利: 回到中軌 @ {price:.0f}", source=self.name,
            )

        # 時間停損（20 根 K 棒）
        if position.bars_since_entry > 20:
            return Signal(
                direction=SignalDirection.CLOSE, strength=0.7,
                stop_loss=0, take_profit=0,
                reason=f"均值回歸時間停損: 持倉 {position.bars_since_entry} 根K棒", source=self.name,
            )

        return None

    def _check_buy_conditions(self, kbar: KBar, snap: MarketSnapshot) -> bool:
        """做多條件：觸及下軌 + RSI 超賣 + 多方K棒"""
        # 價格在下軌附近
        if snap.price > snap.bb_lower:
            margin = (snap.bb_middle - snap.bb_lower) * 0.15
            if snap.price > snap.bb_lower + margin:
                return False

        # RSI 超賣
        if snap.rsi > 35:
            return False

        # K 棒型態：收盤 > 開盤（陽線）且下影線明顯
        if kbar.close <= kbar.open:
            return False

        return True

    def _check_sell_conditions(self, kbar: KBar, snap: MarketSnapshot) -> bool:
        """做空條件：觸及上軌 + RSI 超買 + 空方K棒"""
        if snap.price < snap.bb_upper:
            margin = (snap.bb_upper - snap.bb_middle) * 0.15
            if snap.price < snap.bb_upper - margin:
                return False

        if snap.rsi < 65:
            return False

        if kbar.close >= kbar.open:
            return False

        return True

    def _calculate_buy_strength(self, kbar: KBar, snap: MarketSnapshot) -> float:
        """計算做多訊號強度"""
        score = 0.0

        # BB 下軌觸及程度（40%）
        bb_width = snap.bb_upper - snap.bb_lower
        if bb_width > 0:
            penetration = (snap.bb_lower - snap.price) / bb_width
            score += min(penetration + 0.5, 1.0) * 0.40

        # RSI 超賣程度（30%）
        if snap.rsi < 20:
            score += 1.0 * 0.30
        elif snap.rsi < 30:
            score += 0.7 * 0.30
        else:
            score += 0.3 * 0.30

        # K 棒型態（下影線長度）（30%）
        body = abs(kbar.close - kbar.open)
        lower_wick = min(kbar.open, kbar.close) - kbar.low
        if body > 0 and lower_wick > body * 1.5:
            score += 1.0 * 0.30  # 鎚子線
        elif kbar.close > kbar.open:
            score += 0.5 * 0.30  # 普通陽線

        return min(score, 1.0)

    def _calculate_sell_strength(self, kbar: KBar, snap: MarketSnapshot) -> float:
        """計算做空訊號強度"""
        score = 0.0

        bb_width = snap.bb_upper - snap.bb_lower
        if bb_width > 0:
            penetration = (snap.price - snap.bb_upper) / bb_width
            score += min(penetration + 0.5, 1.0) * 0.40

        if snap.rsi > 80:
            score += 1.0 * 0.30
        elif snap.rsi > 70:
            score += 0.7 * 0.30
        else:
            score += 0.3 * 0.30

        body = abs(kbar.close - kbar.open)
        upper_wick = kbar.high - max(kbar.open, kbar.close)
        if body > 0 and upper_wick > body * 1.5:
            score += 1.0 * 0.30  # 流星線
        elif kbar.close < kbar.open:
            score += 0.5 * 0.30

        return min(score, 1.0)

    def get_parameters(self) -> dict:
        return {
            "strategy": self.name,
            "signal_strength": round(self._last_signal_strength, 2),
        }

    def reset(self):
        self.regime_classifier.reset()
        self._last_signal_strength = 0.0
