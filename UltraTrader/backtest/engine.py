"""
UltraTrader 回測引擎
用歷史資料模擬策略運行，評估績效
"""

from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field

import pandas as pd
import numpy as np
from loguru import logger

from core.market_data import KBar, IndicatorEngine
from core.position import PositionManager, Position, Side
from strategy.base import BaseStrategy, Signal, SignalDirection
from strategy.momentum import AdaptiveMomentumStrategy
from strategy.mean_reversion import MeanReversionStrategy
from risk.manager import RiskManager
from core.broker import AccountInfo


@dataclass
class BacktestResult:
    """回測結果"""
    trades: list
    equity_curve: list[float]
    daily_pnl: dict  # date -> pnl
    total_bars: int = 0
    start_date: str = ""
    end_date: str = ""
    initial_balance: float = 100000.0
    final_balance: float = 100000.0


class BacktestEngine:
    """
    回測引擎

    將歷史 K 棒資料逐根餵入策略 + 風控管道
    模擬真實交易流程，包含滑價和手續費
    """

    def __init__(
        self,
        initial_balance: float = 100000.0,
        slippage: int = 1,        # 滑價（點）
        commission: float = 18.0,  # 單邊手續費
    ):
        self.initial_balance = initial_balance
        self.slippage = slippage
        self.commission = commission

    def run(
        self,
        data: pd.DataFrame,
        strategy: Optional[BaseStrategy] = None,
        risk_profile: str = "balanced",
    ) -> BacktestResult:
        """
        執行回測

        data: K 棒 DataFrame（columns: datetime, open, high, low, close, volume）
        strategy: 策略實例（預設用動量策略）
        risk_profile: 風險預設
        """
        if strategy is None:
            strategy = AdaptiveMomentumStrategy()

        # 初始化元件
        indicator_engine = IndicatorEngine(lookback_period=200)
        position_manager = PositionManager(point_value=1.0, commission=self.commission)
        risk_manager = RiskManager(profile=risk_profile)
        risk_manager._peak_equity = self.initial_balance

        balance = self.initial_balance
        equity_curve = [balance]
        daily_pnl = {}

        logger.info(f"📊 回測開始 | 資料: {len(data)} 根K棒 | 策略: {strategy.name}")
        logger.info(f"💰 初始資金: {balance:,.0f} 元 | 風險: {risk_profile}")

        # 逐根 K 棒跑
        for i in range(len(data)):
            # 取到目前為止的資料計算指標
            window = data.iloc[max(0, i - 199):i + 1].copy()
            if len(window) < 10:
                continue

            snapshot = indicator_engine.update(window)
            kbar = KBar(
                datetime=data.iloc[i]["datetime"],
                open=float(data.iloc[i]["open"]),
                high=float(data.iloc[i]["high"]),
                low=float(data.iloc[i]["low"]),
                close=float(data.iloc[i]["close"]),
                volume=int(data.iloc[i]["volume"]),
            )

            # 更新部位追蹤
            position_manager.update_price(kbar.close)
            position_manager.increment_bars()

            # ---- 出場檢查 ----
            if not position_manager.position.is_flat:
                exit_signal = strategy.check_exit(position_manager.position, snapshot)
                if exit_signal:
                    # 用下一根開盤價模擬成交（避免未來偷看）
                    exit_price = kbar.close  # 回測中用收盤價近似
                    if self.slippage > 0:
                        if position_manager.position.side == Side.LONG:
                            exit_price -= self.slippage
                        else:
                            exit_price += self.slippage

                    trade = position_manager.close_position(exit_price, exit_signal.reason, kbar.datetime)
                    if trade:
                        balance += trade.net_pnl
                        risk_manager.on_trade_closed(trade.net_pnl)

                        # 記錄每日損益
                        day = trade.exit_time.strftime("%Y-%m-%d")
                        daily_pnl[day] = daily_pnl.get(day, 0) + trade.net_pnl

            # ---- 進場檢查 ----
            if position_manager.position.is_flat:
                entry_signal = strategy.on_kbar(kbar, snapshot)
                if entry_signal:
                    # 風控評估
                    account = AccountInfo(
                        balance=balance,
                        equity=balance,
                        margin_available=balance,
                    )
                    decision = risk_manager.evaluate(
                        entry_signal, position_manager, account, snapshot
                    )

                    if decision.approved:
                        entry_price = kbar.close
                        if self.slippage > 0:
                            if entry_signal.is_buy:
                                entry_price += self.slippage
                            else:
                                entry_price -= self.slippage

                        side = Side.LONG if entry_signal.is_buy else Side.SHORT
                        position_manager.open_position(
                            side=side,
                            price=entry_price,
                            quantity=decision.quantity,
                            stop_loss=entry_signal.stop_loss,
                            take_profit=entry_signal.take_profit,
                            timestamp=kbar.datetime,
                        )

            # 記錄權益曲線
            unrealized = position_manager.position.unrealized_pnl(kbar.close)
            equity_curve.append(balance + unrealized)

        # 收尾：強制平倉
        if not position_manager.position.is_flat:
            last_price = float(data.iloc[-1]["close"])
            trade = position_manager.close_position(last_price, "回測結束平倉", data.iloc[-1]["datetime"])
            if trade:
                balance += trade.net_pnl

        result = BacktestResult(
            trades=[
                {
                    "entry_time": t.entry_time.isoformat() if isinstance(t.entry_time, datetime) else str(t.entry_time),
                    "exit_time": t.exit_time.isoformat() if isinstance(t.exit_time, datetime) else str(t.exit_time),
                    "side": t.side,
                    "entry_price": t.entry_price,
                    "exit_price": t.exit_price,
                    "quantity": t.quantity,
                    "pnl": round(t.net_pnl, 0),
                    "pnl_points": round(t.pnl_points, 0),
                    "reason": t.reason,
                    "bars_held": t.bars_held,
                }
                for t in position_manager.trades
            ],
            equity_curve=equity_curve,
            daily_pnl=daily_pnl,
            total_bars=len(data),
            start_date=str(data.iloc[0]["datetime"]),
            end_date=str(data.iloc[-1]["datetime"]),
            initial_balance=self.initial_balance,
            final_balance=balance,
        )

        logger.info(f"📊 回測完成 | 交易 {len(result.trades)} 筆 | 最終餘額: {balance:,.0f} 元")
        return result
