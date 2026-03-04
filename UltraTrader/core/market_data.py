"""
UltraTrader 行情資料管理
Tick → K棒轉換 + 技術指標計算（全部用 numpy/pandas，零外部 TA 庫依賴）
"""

from dataclasses import dataclass, field
from datetime import datetime, time
from typing import Callable, Optional
import numpy as np
import pandas as pd


# ============================================================
# 資料結構
# ============================================================

@dataclass
class Tick:
    """即時 Tick 資料"""
    datetime: datetime
    price: float
    volume: int
    bid_price: float = 0.0
    ask_price: float = 0.0


@dataclass
class KBar:
    """K 棒資料"""
    datetime: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    interval: int = 1  # 分鐘


@dataclass
class MarketSnapshot:
    """市場快照 — 所有指標的當前值"""
    price: float = 0.0
    timestamp: datetime = field(default_factory=datetime.now)

    # 均線
    ema5: float = 0.0
    ema10: float = 0.0
    ema20: float = 0.0
    ema60: float = 0.0

    # 動量
    rsi: float = 50.0
    rsi_ma5: float = 50.0
    rsi_ma10: float = 50.0

    # 波動率
    atr: float = 0.0
    atr_ma20: float = 0.0
    atr_ratio: float = 1.0  # 當前 ATR / 平均 ATR

    # 趨勢強度
    adx: float = 0.0
    plus_di: float = 0.0
    minus_di: float = 0.0

    # 布林通道
    bb_upper: float = 0.0
    bb_middle: float = 0.0
    bb_lower: float = 0.0

    # 成交量
    volume: int = 0
    volume_ma20: float = 0.0
    volume_ratio: float = 1.0

    # 近期高低點
    recent_high: float = 0.0
    recent_low: float = 999999.0

    # K 棒數量（策略判斷用）
    bar_count: int = 0


# ============================================================
# Tick → K 棒聚合器
# ============================================================

class TickAggregator:
    """將即時 Tick 聚合成多週期 K 棒"""

    # 微台日盤 / 夜盤時段
    DAY_SESSION_START = time(8, 45)
    DAY_SESSION_END = time(13, 45)
    NIGHT_SESSION_START = time(15, 0)
    NIGHT_SESSION_END = time(5, 0)  # 隔日凌晨

    def __init__(self, intervals: list[int] = None):
        """
        intervals: 要建構的 K 棒週期（分鐘），預設 [1, 5, 15]
        """
        self.intervals = intervals or [1, 5, 15]
        self._current_bars: dict[int, Optional[KBar]] = {i: None for i in self.intervals}
        self._completed_bars: dict[int, list[KBar]] = {i: [] for i in self.intervals}
        self._callbacks: dict[int, list[Callable]] = {i: [] for i in self.intervals}
        self.current_price: float = 0.0
        self.tick_count: int = 0

    def on_kbar_complete(self, interval: int, callback: Callable[[KBar], None]):
        """註冊 K 棒完成回調"""
        if interval in self._callbacks:
            self._callbacks[interval].append(callback)

    def on_tick(self, tick: Tick):
        """收到 Tick，更新所有週期的 K 棒"""
        self.current_price = tick.price
        self.tick_count += 1

        for interval in self.intervals:
            self._update_bar(tick, interval)

    def _update_bar(self, tick: Tick, interval: int):
        """更新指定週期的 K 棒"""
        bar_time = self._get_bar_time(tick.datetime, interval)
        current = self._current_bars[interval]

        if current is None or current.datetime != bar_time:
            # 前一根 K 棒完成
            if current is not None:
                self._completed_bars[interval].append(current)
                for cb in self._callbacks[interval]:
                    cb(current)

            # 開始新 K 棒
            self._current_bars[interval] = KBar(
                datetime=bar_time,
                open=tick.price,
                high=tick.price,
                low=tick.price,
                close=tick.price,
                volume=tick.volume,
                interval=interval,
            )
        else:
            # 更新當前 K 棒
            current.high = max(current.high, tick.price)
            current.low = min(current.low, tick.price)
            current.close = tick.price
            current.volume += tick.volume

    def _get_bar_time(self, dt: datetime, interval: int) -> datetime:
        """計算 K 棒所屬的時間戳（取整到 interval 分鐘）"""
        minutes = dt.hour * 60 + dt.minute
        bar_minutes = (minutes // interval) * interval
        return dt.replace(
            hour=bar_minutes // 60,
            minute=bar_minutes % 60,
            second=0,
            microsecond=0,
        )

    def get_bars(self, interval: int, count: int = 100) -> list[KBar]:
        """取得最近 N 根已完成的 K 棒"""
        bars = self._completed_bars.get(interval, [])
        return bars[-count:]

    def get_current_bar(self, interval: int) -> Optional[KBar]:
        """取得當前未完成的 K 棒"""
        return self._current_bars.get(interval)

    def get_bars_dataframe(self, interval: int, count: int = 200) -> pd.DataFrame:
        """取得 K 棒 DataFrame（供指標計算用）"""
        bars = self.get_bars(interval, count)
        if not bars:
            return pd.DataFrame(columns=["datetime", "open", "high", "low", "close", "volume"])

        return pd.DataFrame([
            {
                "datetime": b.datetime,
                "open": b.open,
                "high": b.high,
                "low": b.low,
                "close": b.close,
                "volume": b.volume,
            }
            for b in bars
        ])


# ============================================================
# 技術指標引擎（純 numpy/pandas 實作）
# ============================================================

class IndicatorEngine:
    """計算所有技術指標，每根 K 棒更新一次"""

    def __init__(self, lookback_period: int = 200):
        self.lookback = lookback_period
        self._snapshot = MarketSnapshot()
        self._bar_count = 0

    def update(self, df: pd.DataFrame) -> MarketSnapshot:
        """輸入 K 棒 DataFrame，計算所有指標並回傳快照"""
        if len(df) < 2:
            return self._snapshot

        close = df["close"].values.astype(float)
        high = df["high"].values.astype(float)
        low = df["low"].values.astype(float)
        volume = df["volume"].values.astype(float)

        self._bar_count += 1
        snap = MarketSnapshot()
        snap.price = close[-1]
        snap.timestamp = df["datetime"].iloc[-1]
        snap.bar_count = self._bar_count

        # 均線
        snap.ema5 = self._ema(close, 5)
        snap.ema10 = self._ema(close, 10)
        snap.ema20 = self._ema(close, 20)
        snap.ema60 = self._ema(close, 60) if len(close) >= 60 else snap.ema20

        # RSI
        rsi_values = self._rsi_series(close, 14)
        snap.rsi = rsi_values[-1] if len(rsi_values) > 0 else 50.0
        if len(rsi_values) >= 10:
            snap.rsi_ma5 = float(np.mean(rsi_values[-5:]))
            snap.rsi_ma10 = float(np.mean(rsi_values[-10:]))
        else:
            snap.rsi_ma5 = snap.rsi
            snap.rsi_ma10 = snap.rsi

        # ATR
        atr_values = self._atr_series(high, low, close, 14)
        snap.atr = atr_values[-1] if len(atr_values) > 0 else 0.0
        if len(atr_values) >= 20:
            snap.atr_ma20 = float(np.mean(atr_values[-20:]))
            snap.atr_ratio = snap.atr / snap.atr_ma20 if snap.atr_ma20 > 0 else 1.0
        else:
            snap.atr_ma20 = snap.atr
            snap.atr_ratio = 1.0

        # ADX
        adx_val, plus_di, minus_di = self._adx(high, low, close, 14)
        snap.adx = adx_val
        snap.plus_di = plus_di
        snap.minus_di = minus_di

        # 布林通道
        snap.bb_upper, snap.bb_middle, snap.bb_lower = self._bollinger(close, 20, 2.0)

        # 成交量
        snap.volume = int(volume[-1])
        if len(volume) >= 20:
            snap.volume_ma20 = float(np.mean(volume[-20:]))
            snap.volume_ratio = snap.volume / snap.volume_ma20 if snap.volume_ma20 > 0 else 1.0
        else:
            snap.volume_ma20 = float(np.mean(volume))
            snap.volume_ratio = 1.0

        # 近期高低點（20 根 K 棒）
        lookback = min(20, len(high))
        snap.recent_high = float(np.max(high[-lookback:]))
        snap.recent_low = float(np.min(low[-lookback:]))

        self._snapshot = snap
        return snap

    def get_snapshot(self) -> MarketSnapshot:
        """取得最新快照"""
        return self._snapshot

    # ---- 指標計算函數 ----

    @staticmethod
    def _ema(data: np.ndarray, period: int) -> float:
        """指數移動平均（最新值）"""
        if len(data) < period:
            return float(np.mean(data))
        alpha = 2.0 / (period + 1)
        ema = data[0]
        for price in data[1:]:
            ema = alpha * price + (1 - alpha) * ema
        return float(ema)

    @staticmethod
    def _ema_series(data: np.ndarray, period: int) -> np.ndarray:
        """指數移動平均（完整序列）"""
        if len(data) < 2:
            return data.copy()
        alpha = 2.0 / (period + 1)
        result = np.empty_like(data, dtype=float)
        result[0] = data[0]
        for i in range(1, len(data)):
            result[i] = alpha * data[i] + (1 - alpha) * result[i - 1]
        return result

    @staticmethod
    def _rsi_series(close: np.ndarray, period: int = 14) -> np.ndarray:
        """RSI 序列"""
        if len(close) < period + 1:
            return np.array([50.0])

        deltas = np.diff(close)
        gains = np.where(deltas > 0, deltas, 0.0)
        losses = np.where(deltas < 0, -deltas, 0.0)

        avg_gain = np.mean(gains[:period])
        avg_loss = np.mean(losses[:period])

        rsi_values = []
        for i in range(period, len(deltas)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

            if avg_loss == 0:
                rsi_values.append(100.0)
            else:
                rs = avg_gain / avg_loss
                rsi_values.append(100.0 - (100.0 / (1.0 + rs)))

        return np.array(rsi_values) if rsi_values else np.array([50.0])

    @staticmethod
    def _atr_series(high: np.ndarray, low: np.ndarray, close: np.ndarray, period: int = 14) -> np.ndarray:
        """ATR 序列"""
        if len(high) < 2:
            return np.array([0.0])

        # True Range
        tr = np.empty(len(high))
        tr[0] = high[0] - low[0]
        for i in range(1, len(high)):
            tr[i] = max(
                high[i] - low[i],
                abs(high[i] - close[i - 1]),
                abs(low[i] - close[i - 1]),
            )

        # ATR = EMA of True Range
        if len(tr) < period:
            return np.array([float(np.mean(tr))])

        atr = np.empty(len(tr))
        atr[:period] = np.mean(tr[:period])
        for i in range(period, len(tr)):
            atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period

        return atr[period - 1:]

    @staticmethod
    def _adx(high: np.ndarray, low: np.ndarray, close: np.ndarray, period: int = 14) -> tuple[float, float, float]:
        """ADX + DI+/DI-（回傳最新值）"""
        n = len(high)
        if n < period + 1:
            return 0.0, 0.0, 0.0

        # +DM / -DM
        plus_dm = np.zeros(n)
        minus_dm = np.zeros(n)
        tr = np.zeros(n)

        for i in range(1, n):
            up = high[i] - high[i - 1]
            down = low[i - 1] - low[i]

            plus_dm[i] = up if (up > down and up > 0) else 0.0
            minus_dm[i] = down if (down > up and down > 0) else 0.0

            tr[i] = max(
                high[i] - low[i],
                abs(high[i] - close[i - 1]),
                abs(low[i] - close[i - 1]),
            )

        # 平滑
        smoothed_tr = np.mean(tr[1:period + 1]) * period
        smoothed_plus = np.mean(plus_dm[1:period + 1]) * period
        smoothed_minus = np.mean(minus_dm[1:period + 1]) * period

        dx_values = []
        for i in range(period + 1, n):
            smoothed_tr = smoothed_tr - (smoothed_tr / period) + tr[i]
            smoothed_plus = smoothed_plus - (smoothed_plus / period) + plus_dm[i]
            smoothed_minus = smoothed_minus - (smoothed_minus / period) + minus_dm[i]

            if smoothed_tr == 0:
                continue

            plus_di = 100.0 * smoothed_plus / smoothed_tr
            minus_di = 100.0 * smoothed_minus / smoothed_tr

            di_sum = plus_di + minus_di
            if di_sum == 0:
                dx_values.append(0.0)
            else:
                dx_values.append(100.0 * abs(plus_di - minus_di) / di_sum)

        if not dx_values:
            return 0.0, 0.0, 0.0

        # ADX = EMA of DX
        adx = dx_values[0]
        for dx in dx_values[1:]:
            adx = (adx * (period - 1) + dx) / period

        # 最終 DI 值
        if smoothed_tr > 0:
            final_plus_di = 100.0 * smoothed_plus / smoothed_tr
            final_minus_di = 100.0 * smoothed_minus / smoothed_tr
        else:
            final_plus_di = 0.0
            final_minus_di = 0.0

        return float(adx), float(final_plus_di), float(final_minus_di)

    @staticmethod
    def _bollinger(close: np.ndarray, period: int = 20, std_dev: float = 2.0) -> tuple[float, float, float]:
        """布林通道（回傳最新的 upper, middle, lower）"""
        if len(close) < period:
            mean = float(np.mean(close))
            std = float(np.std(close)) if len(close) > 1 else 0.0
            return mean + std_dev * std, mean, mean - std_dev * std

        recent = close[-period:]
        middle = float(np.mean(recent))
        std = float(np.std(recent))
        return middle + std_dev * std, middle, middle - std_dev * std
