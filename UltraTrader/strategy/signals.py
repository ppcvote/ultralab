"""
UltraTrader 多因子訊號產生器
6 個因子加權評分，產生 0~1 的訊號強度
"""

from dataclasses import dataclass
from typing import Optional
import numpy as np

from core.market_data import MarketSnapshot
from strategy.base import Signal, SignalDirection
from strategy.filters import MarketRegime


@dataclass
class FactorScore:
    """單一因子的評分結果"""
    name: str
    score: float      # 0.0 ~ 1.0
    weight: float      # 權重
    detail: str = ""   # 說明


class AdaptiveParams:
    """自適應參數 — 根據近期波動率動態調整"""

    def __init__(self):
        self.stop_loss_multiplier = 2.0
        self.min_signal_strength = 0.55
        self.trailing_trigger = 1.5  # ATR 倍數
        self.trailing_distance = 1.0
        self.time_stop_bars = 30
        self.cooldown_bars = 5

    def update(self, atr_ratio: float, regime: MarketRegime):
        """根據市場狀態調整參數"""
        if atr_ratio > 1.5:
            # 高波動：放寬停損、提高訊號門檻
            self.stop_loss_multiplier = 2.5
            self.min_signal_strength = 0.70
            self.trailing_trigger = 2.0
            self.time_stop_bars = 40
        elif atr_ratio < 0.7:
            # 低波動：收緊停損
            self.stop_loss_multiplier = 1.5
            self.min_signal_strength = 0.45
            self.trailing_trigger = 1.0
            self.time_stop_bars = 20
        else:
            # 正常波動
            self.stop_loss_multiplier = 2.0
            self.min_signal_strength = 0.55
            self.trailing_trigger = 1.5
            self.time_stop_bars = 30

        # 強趨勢降低門檻（趨勢明確時更積極進場）
        if regime in (MarketRegime.STRONG_TREND_UP, MarketRegime.STRONG_TREND_DOWN):
            self.min_signal_strength *= 0.85
            self.cooldown_bars = 3

    def to_dict(self) -> dict:
        return {
            "stop_loss_multiplier": self.stop_loss_multiplier,
            "min_signal_strength": round(self.min_signal_strength, 2),
            "trailing_trigger": self.trailing_trigger,
            "trailing_distance": self.trailing_distance,
            "time_stop_bars": self.time_stop_bars,
            "cooldown_bars": self.cooldown_bars,
        }


class MultiFactorSignalGenerator:
    """
    多因子訊號產生器

    6 個因子：
    1. 趨勢方向（30%）— 均線排列 + 價格相對位置
    2. RSI 動量（20%）— RSI 值 + RSI 趨勢
    3. 突破確認（15%）— 價格突破近期高/低點
    4. 成交量確認（15%）— 量能放大
    5. ADX 趨勢強度（10%）— ADX 值
    6. 波動率環境（10%）— ATR 比率在合理範圍
    """

    DEFAULT_WEIGHTS = {
        "trend": 0.30,
        "rsi": 0.20,
        "breakout": 0.15,
        "volume": 0.15,
        "adx": 0.10,
        "volatility": 0.10,
    }

    def __init__(self, weights: dict = None):
        self.weights = weights or self.DEFAULT_WEIGHTS.copy()
        self.params = AdaptiveParams()

    def generate(
        self,
        snapshot: MarketSnapshot,
        regime: MarketRegime,
    ) -> Optional[Signal]:
        """
        產生交易訊號
        只在趨勢狀態下產生訊號（盤整和劇烈波動不進場）
        """
        # 更新自適應參數
        self.params.update(snapshot.atr_ratio, regime)

        # 不在趨勢狀態 → 不產生動量訊號
        if regime in (MarketRegime.RANGING, MarketRegime.VOLATILE):
            return None

        # 判斷方向
        is_bullish = regime in (MarketRegime.STRONG_TREND_UP, MarketRegime.WEAK_TREND_UP)

        # 計算各因子分數
        factors = self._score_factors(snapshot, is_bullish)

        # 加權總分
        total_score = sum(f.score * f.weight for f in factors)
        total_score = min(max(total_score, 0.0), 1.0)

        # 未達門檻 → 不進場
        if total_score < self.params.min_signal_strength:
            return None

        # 計算停損停利
        direction = SignalDirection.BUY if is_bullish else SignalDirection.SELL
        atr = snapshot.atr if snapshot.atr > 0 else 50.0  # 預設 ATR

        if is_bullish:
            stop_loss = snapshot.price - atr * self.params.stop_loss_multiplier
            take_profit = snapshot.price + atr * self.params.stop_loss_multiplier * 2
        else:
            stop_loss = snapshot.price + atr * self.params.stop_loss_multiplier
            take_profit = snapshot.price - atr * self.params.stop_loss_multiplier * 2

        # 組裝理由
        top_factors = sorted(factors, key=lambda f: f.score * f.weight, reverse=True)[:3]
        reason_parts = [f.detail for f in top_factors if f.score > 0.3]
        reason = " + ".join(reason_parts) if reason_parts else "多因子綜合訊號"

        return Signal(
            direction=direction,
            strength=total_score,
            stop_loss=round(stop_loss),
            take_profit=round(take_profit),
            reason=reason,
            source="AdaptiveMomentum",
        )

    def _score_factors(self, snap: MarketSnapshot, is_bullish: bool) -> list[FactorScore]:
        """計算 6 個因子的分數"""
        return [
            self._score_trend(snap, is_bullish),
            self._score_rsi(snap, is_bullish),
            self._score_breakout(snap, is_bullish),
            self._score_volume(snap),
            self._score_adx(snap),
            self._score_volatility(snap),
        ]

    def _score_trend(self, snap: MarketSnapshot, is_bullish: bool) -> FactorScore:
        """因子 1：趨勢方向（均線排列 + 價格位置）"""
        score = 0.0
        details = []

        if is_bullish:
            # 做多：價格在均線之上
            if snap.price > snap.ema20:
                score += 0.4
                details.append("價格>EMA20")
            if snap.ema5 > snap.ema10:
                score += 0.2
            if snap.ema10 > snap.ema20:
                score += 0.2
            if snap.ema20 > snap.ema60:
                score += 0.2
                details.append("多頭排列")
        else:
            # 做空：價格在均線之下
            if snap.price < snap.ema20:
                score += 0.4
                details.append("價格<EMA20")
            if snap.ema5 < snap.ema10:
                score += 0.2
            if snap.ema10 < snap.ema20:
                score += 0.2
            if snap.ema20 < snap.ema60:
                score += 0.2
                details.append("空頭排列")

        return FactorScore(
            name="trend",
            score=min(score, 1.0),
            weight=self.weights["trend"],
            detail=" ".join(details) if details else "趨勢中性",
        )

    def _score_rsi(self, snap: MarketSnapshot, is_bullish: bool) -> FactorScore:
        """因子 2：RSI 動量"""
        rsi = snap.rsi
        score = 0.0
        detail = f"RSI={rsi:.0f}"

        if is_bullish:
            # 做多：RSI 在 50~70 之間最理想，且 RSI MA5 > MA10
            if 50 < rsi < 70:
                score = 0.5 + (rsi - 50) / 40  # 50→0.5, 70→1.0
            elif 40 < rsi <= 50:
                score = 0.3
            if snap.rsi_ma5 > snap.rsi_ma10:
                score += 0.2
                detail += " 動量上升"
        else:
            # 做空：RSI 在 30~50 之間
            if 30 < rsi < 50:
                score = 0.5 + (50 - rsi) / 40
            elif 50 <= rsi < 60:
                score = 0.3
            if snap.rsi_ma5 < snap.rsi_ma10:
                score += 0.2
                detail += " 動量下降"

        return FactorScore(
            name="rsi",
            score=min(score, 1.0),
            weight=self.weights["rsi"],
            detail=detail,
        )

    def _score_breakout(self, snap: MarketSnapshot, is_bullish: bool) -> FactorScore:
        """因子 3：突破確認"""
        score = 0.0
        atr = snap.atr if snap.atr > 0 else 1.0

        if is_bullish:
            # 做多：價格突破近期高點
            if snap.price > snap.recent_high:
                breakout_strength = (snap.price - snap.recent_high) / atr
                score = min(breakout_strength + 0.3, 1.0)
                detail = f"突破高點{snap.recent_high:.0f}"
            elif snap.price > snap.recent_high - atr * 0.3:
                score = 0.4
                detail = "接近高點"
            else:
                detail = "未突破"
        else:
            # 做空：價格跌破近期低點
            if snap.price < snap.recent_low:
                breakout_strength = (snap.recent_low - snap.price) / atr
                score = min(breakout_strength + 0.3, 1.0)
                detail = f"跌破低點{snap.recent_low:.0f}"
            elif snap.price < snap.recent_low + atr * 0.3:
                score = 0.4
                detail = "接近低點"
            else:
                detail = "未跌破"

        return FactorScore(
            name="breakout",
            score=min(score, 1.0),
            weight=self.weights["breakout"],
            detail=detail,
        )

    def _score_volume(self, snap: MarketSnapshot) -> FactorScore:
        """因子 4：成交量確認"""
        ratio = snap.volume_ratio
        if ratio >= 2.0:
            score = 1.0
            detail = f"量能爆發({ratio:.1f}x)"
        elif ratio >= 1.2:
            score = 0.5 + (ratio - 1.2) / 1.6  # 1.2→0.5, 2.0→1.0
            detail = f"量能放大({ratio:.1f}x)"
        elif ratio >= 0.8:
            score = 0.3
            detail = "量能正常"
        else:
            score = 0.1
            detail = "量能萎縮"

        return FactorScore(
            name="volume",
            score=min(score, 1.0),
            weight=self.weights["volume"],
            detail=detail,
        )

    def _score_adx(self, snap: MarketSnapshot) -> FactorScore:
        """因子 5：ADX 趨勢強度"""
        adx = snap.adx
        if adx >= 40:
            score = 1.0
            detail = f"ADX={adx:.0f} 強趨勢"
        elif adx >= 25:
            score = 0.5 + (adx - 25) / 30
            detail = f"ADX={adx:.0f} 有趨勢"
        elif adx >= 20:
            score = 0.3
            detail = f"ADX={adx:.0f} 弱趨勢"
        else:
            score = 0.1
            detail = f"ADX={adx:.0f} 無趨勢"

        return FactorScore(
            name="adx",
            score=min(score, 1.0),
            weight=self.weights["adx"],
            detail=detail,
        )

    def _score_volatility(self, snap: MarketSnapshot) -> FactorScore:
        """因子 6：波動率環境"""
        ratio = snap.atr_ratio
        if 0.8 <= ratio <= 1.3:
            score = 1.0
            detail = "波動率適中"
        elif 0.5 <= ratio < 0.8:
            score = 0.6
            detail = "波動率偏低"
        elif 1.3 < ratio <= 1.8:
            score = 0.4
            detail = "波動率偏高"
        else:
            score = 0.1
            detail = "波動率異常"

        return FactorScore(
            name="volatility",
            score=min(score, 1.0),
            weight=self.weights["volatility"],
            detail=detail,
        )

    def get_last_factors(self, snapshot: MarketSnapshot, is_bullish: bool) -> list[dict]:
        """取得因子評分明細（供 Dashboard 顯示）"""
        factors = self._score_factors(snapshot, is_bullish)
        return [
            {
                "name": f.name,
                "score": round(f.score, 2),
                "weight": f.weight,
                "weighted": round(f.score * f.weight, 3),
                "detail": f.detail,
            }
            for f in factors
        ]
