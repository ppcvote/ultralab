"""
UltraTrader 歷史資料載入
CSV 載入 + 合成資料產生（供回測和測試用）
"""

import random
import math
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd


class DataLoader:
    """歷史 K 棒資料載入器"""

    DATA_DIR = Path(__file__).parent.parent / "data" / "historical"

    @classmethod
    def load_csv(cls, path: str) -> pd.DataFrame:
        """
        從 CSV 載入 K 棒資料

        預期格式：datetime, open, high, low, close, volume
        """
        df = pd.read_csv(path, parse_dates=["datetime"])
        required = {"datetime", "open", "high", "low", "close", "volume"}
        if not required.issubset(df.columns):
            raise ValueError(f"CSV 缺少必要欄位: {required - set(df.columns)}")

        df = df.sort_values("datetime").reset_index(drop=True)
        return df

    @classmethod
    def generate_synthetic(
        cls,
        days: int = 30,
        timeframe_minutes: int = 1,
        base_price: float = 22000.0,
        volatility: float = 0.3,
        trend_strength: float = 0.0,
        seed: int = None,
    ) -> pd.DataFrame:
        """
        產生合成 K 棒資料

        days: 交易日數
        timeframe_minutes: K 棒週期（分鐘）
        base_price: 起始價格
        volatility: 波動率
        trend_strength: 趨勢強度（正=偏多，負=偏空，0=中性）
        seed: 隨機種子（可重複實驗）
        """
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

        bars = []
        price = base_price

        for day in range(days):
            # 跳過假日
            current_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - day)
            if current_date.weekday() >= 5:  # 週六日
                continue

            # 日盤 08:45 ~ 13:45 (300 分鐘)
            session_start = current_date.replace(hour=8, minute=45)
            bars_per_session = 300 // timeframe_minutes

            # 日內特徵
            daily_trend = random.gauss(trend_strength, 0.5)  # 每日隨機趨勢

            for i in range(bars_per_session):
                bar_time = session_start + timedelta(minutes=i * timeframe_minutes)
                hour = bar_time.hour + bar_time.minute / 60.0

                # 波動率曲線（開盤收盤大，午盤小）
                time_vol = cls._time_volatility(hour) * volatility

                # 價格變化
                change = random.gauss(daily_trend * 0.01, time_vol)

                # 均值回歸
                mean_reversion = (base_price - price) * 0.0005
                change += mean_reversion

                # 產生 OHLCV
                open_price = price
                intra_changes = [random.gauss(0, time_vol * 0.5) for _ in range(4)]
                prices = [open_price + c for c in intra_changes]
                prices.append(open_price + change)

                high = max(open_price, max(prices))
                low = min(open_price, min(prices))
                close = open_price + change
                price = close

                # 成交量（開盤收盤量大）
                base_volume = max(1, int(random.gauss(50, 20) * cls._time_volatility(hour)))

                bars.append({
                    "datetime": bar_time,
                    "open": round(open_price),
                    "high": round(high),
                    "low": round(low),
                    "close": round(close),
                    "volume": base_volume,
                })

        df = pd.DataFrame(bars)
        return df

    @classmethod
    def generate_trending(cls, days: int = 30, direction: str = "up", **kwargs) -> pd.DataFrame:
        """產生趨勢行情資料"""
        trend = 0.3 if direction == "up" else -0.3
        return cls.generate_synthetic(days=days, trend_strength=trend, **kwargs)

    @classmethod
    def generate_ranging(cls, days: int = 30, **kwargs) -> pd.DataFrame:
        """產生盤整行情資料"""
        return cls.generate_synthetic(days=days, trend_strength=0.0, volatility=0.15, **kwargs)

    @classmethod
    def generate_volatile(cls, days: int = 30, **kwargs) -> pd.DataFrame:
        """產生高波動行情資料"""
        return cls.generate_synthetic(days=days, volatility=0.8, **kwargs)

    @classmethod
    def save_csv(cls, df: pd.DataFrame, filename: str):
        """儲存為 CSV"""
        cls.DATA_DIR.mkdir(parents=True, exist_ok=True)
        path = cls.DATA_DIR / filename
        df.to_csv(path, index=False)
        return str(path)

    @staticmethod
    def _time_volatility(hour: float) -> float:
        """日內波動率曲線"""
        if 8.75 <= hour <= 9.5:
            return 2.0
        elif 9.5 <= hour <= 11.0:
            return 1.0
        elif 11.0 <= hour <= 12.5:
            return 0.6
        elif 12.5 <= hour <= 13.75:
            return 1.8
        return 1.0
