"""
UltraTrader 市場狀態分類器
在做任何交易決策前，先判斷市場處於什麼狀態
"""

from enum import Enum
from typing import Optional

from core.market_data import MarketSnapshot


class MarketRegime(Enum):
    STRONG_TREND_UP = "強勢上漲"       # → 積極做多
    WEAK_TREND_UP = "溫和上漲"         # → 保守做多
    RANGING = "盤整"                   # → 均值回歸或不交易
    WEAK_TREND_DOWN = "溫和下跌"       # → 保守做空
    STRONG_TREND_DOWN = "強勢下跌"     # → 積極做空
    VOLATILE = "劇烈波動"              # → 不交易，等待


# 各狀態的 emoji 和顏色
REGIME_META = {
    MarketRegime.STRONG_TREND_UP:   {"emoji": "🟢", "color": "#10B981"},
    MarketRegime.WEAK_TREND_UP:     {"emoji": "🟡", "color": "#F59E0B"},
    MarketRegime.RANGING:           {"emoji": "⚪", "color": "#6B7280"},
    MarketRegime.WEAK_TREND_DOWN:   {"emoji": "🟠", "color": "#F97316"},
    MarketRegime.STRONG_TREND_DOWN: {"emoji": "🔴", "color": "#EF4444"},
    MarketRegime.VOLATILE:          {"emoji": "⚡", "color": "#8B5CF6"},
}


class MarketRegimeClassifier:
    """
    多因子市場狀態分類器

    判斷方法（4 個因子）：
    1. ADX（趨勢強度）
    2. 均線排列（EMA5/10/20/60）
    3. 波動率比（ATR ratio）
    4. 方向性指標（DI+/DI-）

    內建遲滯（hysteresis）：需連續 2 根 K 棒確認才切換狀態
    """

    def __init__(self):
        self._current_regime = MarketRegime.RANGING
        self._pending_regime: Optional[MarketRegime] = None
        self._pending_count = 0
        self._hysteresis = 2  # 需要連續 N 根 K 棒確認

    def classify(self, snapshot: MarketSnapshot) -> MarketRegime:
        """分類當前市場狀態"""

        # 因子 1：波動率過濾（最高優先）
        if snapshot.atr_ratio > 1.8:
            raw = MarketRegime.VOLATILE
            return self._apply_hysteresis(raw)

        # 因子 2：ADX 趨勢強度
        has_trend = snapshot.adx > 22
        strong_trend = snapshot.adx > 35

        # 因子 3：均線排列方向
        bullish_ema = (snapshot.ema5 > snapshot.ema20 and snapshot.ema20 > snapshot.ema60)
        bearish_ema = (snapshot.ema5 < snapshot.ema20 and snapshot.ema20 < snapshot.ema60)

        # 因子 4：DI 方向
        bullish_di = snapshot.plus_di > snapshot.minus_di
        bearish_di = snapshot.minus_di > snapshot.plus_di

        # 綜合判斷
        if has_trend:
            if bullish_ema or bullish_di:
                raw = MarketRegime.STRONG_TREND_UP if strong_trend else MarketRegime.WEAK_TREND_UP
            elif bearish_ema or bearish_di:
                raw = MarketRegime.STRONG_TREND_DOWN if strong_trend else MarketRegime.WEAK_TREND_DOWN
            else:
                raw = MarketRegime.RANGING
        else:
            # ADX 低 → 盤整
            raw = MarketRegime.RANGING

        return self._apply_hysteresis(raw)

    def _apply_hysteresis(self, raw: MarketRegime) -> MarketRegime:
        """遲滯處理：避免狀態頻繁切換"""
        if raw == self._current_regime:
            self._pending_regime = None
            self._pending_count = 0
            return self._current_regime

        if raw == self._pending_regime:
            self._pending_count += 1
            if self._pending_count >= self._hysteresis:
                self._current_regime = raw
                self._pending_regime = None
                self._pending_count = 0
        else:
            self._pending_regime = raw
            self._pending_count = 1

        return self._current_regime

    def get_regime(self) -> MarketRegime:
        """取得當前狀態"""
        return self._current_regime

    def get_regime_info(self) -> dict:
        """取得狀態資訊（供 Dashboard 顯示）"""
        regime = self._current_regime
        meta = REGIME_META[regime]
        return {
            "regime": regime.value,
            "regime_key": regime.name,
            "emoji": meta["emoji"],
            "color": meta["color"],
        }

    def reset(self):
        """重置狀態"""
        self._current_regime = MarketRegime.RANGING
        self._pending_regime = None
        self._pending_count = 0
