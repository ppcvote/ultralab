"""
UltraTrader 回測報告
計算績效指標 + 格式化輸出
"""

import math
from datetime import datetime
from typing import Optional

import numpy as np

from backtest.engine import BacktestResult


class BacktestReport:
    """回測績效報告"""

    RISK_FREE_RATE = 0.015  # 台灣無風險利率 1.5%
    TRADING_DAYS_PER_YEAR = 252

    def __init__(self, result: BacktestResult):
        self.result = result
        self.metrics = self._calculate_metrics()

    def _calculate_metrics(self) -> dict:
        """計算所有績效指標"""
        trades = self.result.trades
        equity = self.result.equity_curve
        initial = self.result.initial_balance
        final = self.result.final_balance

        if not trades:
            return {"total_trades": 0, "message": "沒有交易紀錄"}

        # 基礎統計
        pnls = [t["pnl"] for t in trades]
        winners = [p for p in pnls if p > 0]
        losers = [p for p in pnls if p <= 0]

        total_win = sum(winners) if winners else 0
        total_loss = abs(sum(losers)) if losers else 0

        # 最大回撤
        max_dd, max_dd_pct, max_dd_duration = self._max_drawdown(equity)

        # 夏普比率
        sharpe = self._sharpe_ratio(equity)

        # Sortino 比率
        sortino = self._sortino_ratio(equity)

        # 交易天數
        if self.result.daily_pnl:
            trading_days = len(self.result.daily_pnl)
        else:
            trading_days = max(1, self.result.total_bars // 300)  # 估算

        # 年化報酬
        total_return = (final - initial) / initial
        annualized = (1 + total_return) ** (self.TRADING_DAYS_PER_YEAR / max(trading_days, 1)) - 1

        return {
            "期間": f"{self.result.start_date} ~ {self.result.end_date}",
            "交易天數": trading_days,
            "K棒總數": self.result.total_bars,
            "初始資金": f"{initial:,.0f} 元",
            "最終資金": f"{final:,.0f} 元",
            "總損益": f"{final - initial:+,.0f} 元",
            "總報酬率": f"{total_return:+.2%}",
            "年化報酬": f"{annualized:+.2%}",
            "",
            "總交易次數": len(trades),
            "獲利次數": len(winners),
            "虧損次數": len(losers),
            "勝率": f"{len(winners) / len(trades) * 100:.1f}%",
            "平均獲利": f"{total_win / len(winners):+,.0f} 元" if winners else "N/A",
            "平均虧損": f"{-total_loss / len(losers):,.0f} 元" if losers else "N/A",
            "盈虧比": f"{(total_win / len(winners)) / (total_loss / len(losers)):.2f}" if winners and losers else "N/A",
            "獲利因子": f"{total_win / total_loss:.2f}" if total_loss > 0 else "∞",
            " ": "",
            "最大回撤": f"{max_dd:,.0f} 元（{max_dd_pct:.1%}）",
            "最大回撤期間": f"{max_dd_duration} 根K棒",
            "夏普比率": f"{sharpe:.2f}",
            "Sortino比率": f"{sortino:.2f}",
            "每日平均損益": f"{(final - initial) / max(trading_days, 1):+,.0f} 元",
            "最大連續虧損": f"{self._max_consecutive_losses(trades)} 筆",
            "平均持倉時間": f"{sum(t['bars_held'] for t in trades) / len(trades):.1f} 根K棒",
        }

    def print_report(self):
        """終端機格式化輸出"""
        print()
        print("  ╔═══════════════════════════════════════╗")
        print("  ║     UltraTrader 策略回測報告          ║")
        print("  ╚═══════════════════════════════════════╝")
        print()

        for key, value in self.metrics.items():
            if key == "" or key == " ":
                print("  ─────────────────────────────────────")
            elif isinstance(value, str):
                print(f"  {key:　<12s}  {value}")
            else:
                print(f"  {key:　<12s}  {value}")

        print()
        print("  ─────────────────────────────────────")

        # 前 10 筆交易
        trades = self.result.trades
        if trades:
            print()
            print("  最近交易紀錄（前 10 筆）:")
            print(f"  {'方向':>4s} {'進場':>8s} {'出場':>8s} {'損益':>8s} {'原因'}")
            print("  " + "─" * 50)
            for t in trades[:10]:
                side = "多" if t["side"] == "long" else "空"
                pnl_str = f"{t['pnl']:+,.0f}"
                print(f"  {side:>4s} {t['entry_price']:>8.0f} {t['exit_price']:>8.0f} {pnl_str:>8s} {t['reason'][:20]}")

        print()

    def to_dict(self) -> dict:
        """轉為 dict（供 JSON 輸出）"""
        return {
            "metrics": {k: v for k, v in self.metrics.items() if k.strip()},
            "trades": self.result.trades,
            "equity_curve": self.result.equity_curve[::max(1, len(self.result.equity_curve) // 500)],
            "daily_pnl": self.result.daily_pnl,
        }

    # ---- 內部計算 ----

    @staticmethod
    def _max_drawdown(equity: list[float]) -> tuple[float, float, int]:
        """計算最大回撤（金額、比例、持續期間）"""
        if not equity:
            return 0.0, 0.0, 0

        peak = equity[0]
        max_dd = 0.0
        max_dd_pct = 0.0
        dd_start = 0
        max_dd_duration = 0

        current_dd_start = 0

        for i, eq in enumerate(equity):
            if eq > peak:
                peak = eq
                current_dd_start = i

            dd = peak - eq
            if dd > max_dd:
                max_dd = dd
                max_dd_pct = dd / peak if peak > 0 else 0
                max_dd_duration = i - current_dd_start

        return max_dd, max_dd_pct, max_dd_duration

    def _sharpe_ratio(self, equity: list[float]) -> float:
        """年化夏普比率"""
        if len(equity) < 10:
            return 0.0

        returns = np.diff(equity) / np.array(equity[:-1])
        if np.std(returns) == 0:
            return 0.0

        excess_return = np.mean(returns) - self.RISK_FREE_RATE / self.TRADING_DAYS_PER_YEAR
        return float(excess_return / np.std(returns) * math.sqrt(self.TRADING_DAYS_PER_YEAR))

    def _sortino_ratio(self, equity: list[float]) -> float:
        """Sortino 比率（只看下行風險）"""
        if len(equity) < 10:
            return 0.0

        returns = np.diff(equity) / np.array(equity[:-1])
        downside = returns[returns < 0]

        if len(downside) == 0 or np.std(downside) == 0:
            return 0.0

        excess_return = np.mean(returns) - self.RISK_FREE_RATE / self.TRADING_DAYS_PER_YEAR
        return float(excess_return / np.std(downside) * math.sqrt(self.TRADING_DAYS_PER_YEAR))

    @staticmethod
    def _max_consecutive_losses(trades: list[dict]) -> int:
        """最大連續虧損筆數"""
        max_streak = 0
        current = 0
        for t in trades:
            if t["pnl"] < 0:
                current += 1
                max_streak = max(max_streak, current)
            else:
                current = 0
        return max_streak
