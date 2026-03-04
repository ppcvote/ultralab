"""
UltraTrader 自適應動量策略（主策略）
多因子進場 + 三層出場系統
"""

from datetime import datetime
from typing import Optional

from loguru import logger

from core.market_data import KBar, MarketSnapshot
from core.position import Position, Side
from strategy.base import BaseStrategy, Signal, SignalDirection
from strategy.filters import MarketRegime, MarketRegimeClassifier
from strategy.signals import MultiFactorSignalGenerator, AdaptiveParams


class AdaptiveMomentumStrategy(BaseStrategy):
    """
    自適應動量策略

    進場：多因子評分系統（6 因子加權）
    出場：三層保護（ATR 動態停損 + 移動停利 + 時間停損）
    狀態感知：根據市場狀態自動調整參數
    """

    @property
    def name(self) -> str:
        return "自適應動量策略"

    def __init__(self):
        self.regime_classifier = MarketRegimeClassifier()
        self.signal_generator = MultiFactorSignalGenerator()
        self._cooldown_remaining = 0  # 冷卻倒數（K 棒數）
        self._last_regime = MarketRegime.RANGING
        self._last_signal_strength = 0.0

    def on_kbar(self, kbar: KBar, snapshot: MarketSnapshot) -> Optional[Signal]:
        """K 棒收盤時的決策邏輯"""

        # 1. 分類市場狀態
        regime = self.regime_classifier.classify(snapshot)
        if regime != self._last_regime:
            logger.info(f"🔄 市場狀態切換: {self._last_regime.value} → {regime.value}")
            self._last_regime = regime

        # 2. 冷卻期中 → 不交易
        if self._cooldown_remaining > 0:
            self._cooldown_remaining -= 1
            return None

        # 3. 劇烈波動 → 不交易
        if regime == MarketRegime.VOLATILE:
            return None

        # 4. 盤整市 → 動量策略不進場（留給均值回歸策略）
        if regime == MarketRegime.RANGING:
            return None

        # 5. 產生進場訊號
        signal = self.signal_generator.generate(snapshot, regime)

        if signal:
            self._last_signal_strength = signal.strength
            logger.info(
                f"📊 動量訊號 | {signal.direction.value} | "
                f"強度: {signal.strength:.2f} | {signal.reason}"
            )

        return signal

    def check_exit(self, position: Position, snapshot: MarketSnapshot) -> Optional[Signal]:
        """
        檢查出場條件（三層保護）
        每根 K 棒和每個 Tick 都會呼叫

        第一層：ATR 動態停損
        第二層：移動停利（Trailing Stop）
        第三層：時間停損
        """
        if position.is_flat:
            return None

        price = snapshot.price
        atr = snapshot.atr if snapshot.atr > 0 else 50.0
        params = self.signal_generator.params

        # ---- 第一層：固定停損 ----
        if position.side == Side.LONG and price <= position.stop_loss:
            self._cooldown_remaining = params.cooldown_bars
            return Signal(
                direction=SignalDirection.CLOSE,
                strength=1.0,
                stop_loss=0,
                take_profit=0,
                reason=f"停損觸發 @ {price:.0f}（停損價 {position.stop_loss:.0f}）",
                source=self.name,
            )

        if position.side == Side.SHORT and price >= position.stop_loss:
            self._cooldown_remaining = params.cooldown_bars
            return Signal(
                direction=SignalDirection.CLOSE,
                strength=1.0,
                stop_loss=0,
                take_profit=0,
                reason=f"停損觸發 @ {price:.0f}（停損價 {position.stop_loss:.0f}）",
                source=self.name,
            )

        # ---- 第二層：移動停利 ----
        if position.side == Side.LONG:
            profit = price - position.entry_price

            # 啟動移動停利條件：獲利超過 trigger 倍 ATR
            if profit > atr * params.trailing_trigger:
                if not position.trailing_activated:
                    position.trailing_activated = True
                    logger.info(f"📈 移動停利啟動（獲利 {profit:.0f} 點 > {atr * params.trailing_trigger:.0f}）")

                # 移動停利價 = 最高價 - trailing_distance × ATR
                new_trailing = position.highest_since_entry - atr * params.trailing_distance
                if new_trailing > position.trailing_stop:
                    position.trailing_stop = new_trailing

                # 觸發移動停利
                if price <= position.trailing_stop:
                    return Signal(
                        direction=SignalDirection.CLOSE,
                        strength=1.0,
                        stop_loss=0,
                        take_profit=0,
                        reason=f"移動停利 @ {price:.0f}（追蹤價 {position.trailing_stop:.0f}）",
                        source=self.name,
                    )

        elif position.side == Side.SHORT:
            profit = position.entry_price - price

            if profit > atr * params.trailing_trigger:
                if not position.trailing_activated:
                    position.trailing_activated = True
                    logger.info(f"📉 移動停利啟動（獲利 {profit:.0f} 點 > {atr * params.trailing_trigger:.0f}）")

                new_trailing = position.lowest_since_entry + atr * params.trailing_distance
                if new_trailing < position.trailing_stop or position.trailing_stop == 0:
                    position.trailing_stop = new_trailing

                if price >= position.trailing_stop:
                    return Signal(
                        direction=SignalDirection.CLOSE,
                        strength=1.0,
                        stop_loss=0,
                        take_profit=0,
                        reason=f"移動停利 @ {price:.0f}（追蹤價 {position.trailing_stop:.0f}）",
                        source=self.name,
                    )

        # ---- 第三層：時間停損 ----
        if position.bars_since_entry > params.time_stop_bars:
            # 持倉太久但獲利不足
            if position.side == Side.LONG:
                profit = price - position.entry_price
            else:
                profit = position.entry_price - price

            if profit < atr * 0.5:
                return Signal(
                    direction=SignalDirection.CLOSE,
                    strength=0.8,
                    stop_loss=0,
                    take_profit=0,
                    reason=f"時間停損: 持倉 {position.bars_since_entry} 根K棒，獲利不足",
                    source=self.name,
                )

        # ---- 固定停利 ----
        if position.side == Side.LONG and price >= position.take_profit:
            return Signal(
                direction=SignalDirection.CLOSE,
                strength=1.0,
                stop_loss=0,
                take_profit=0,
                reason=f"停利觸發 @ {price:.0f}",
                source=self.name,
            )

        if position.side == Side.SHORT and price <= position.take_profit:
            return Signal(
                direction=SignalDirection.CLOSE,
                strength=1.0,
                stop_loss=0,
                take_profit=0,
                reason=f"停利觸發 @ {price:.0f}",
                source=self.name,
            )

        return None

    def get_parameters(self) -> dict:
        """取得當前參數"""
        return {
            "strategy": self.name,
            "regime": self._last_regime.value,
            "signal_strength": round(self._last_signal_strength, 2),
            "cooldown_remaining": self._cooldown_remaining,
            "adaptive_params": self.signal_generator.params.to_dict(),
        }

    def reset(self):
        """重置策略狀態"""
        self.regime_classifier.reset()
        self._cooldown_remaining = 0
        self._last_regime = MarketRegime.RANGING
        self._last_signal_strength = 0.0
