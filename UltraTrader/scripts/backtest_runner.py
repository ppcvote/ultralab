"""
UltraTrader 回測執行腳本

用法：
    python scripts/backtest_runner.py
    python scripts/backtest_runner.py --days 60 --risk aggressive
    python scripts/backtest_runner.py --data data/historical/mxf_2025.csv
"""

import sys
import argparse
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def main():
    parser = argparse.ArgumentParser(description="UltraTrader 策略回測")
    parser.add_argument("--data", type=str, default=None, help="歷史資料 CSV 路徑")
    parser.add_argument("--days", type=int, default=30, help="合成資料天數（無 CSV 時使用）")
    parser.add_argument("--strategy", choices=["momentum", "mean_reversion"], default="momentum",
                        help="策略")
    parser.add_argument("--risk", choices=["conservative", "balanced", "aggressive"], default="balanced",
                        help="風險等級")
    parser.add_argument("--seed", type=int, default=42, help="隨機種子")
    parser.add_argument("--timeframe", type=int, default=1, help="K棒週期（分鐘）")
    args = parser.parse_args()

    print()
    print("  ⚡ UltraTrader 回測引擎")
    print("  ═══════════════════════")
    print()

    from core.logger import setup_logger
    setup_logger(console_level="WARNING")

    from backtest.data_loader import DataLoader
    from backtest.engine import BacktestEngine
    from backtest.report import BacktestReport
    from strategy.momentum import AdaptiveMomentumStrategy
    from strategy.mean_reversion import MeanReversionStrategy

    # 載入資料
    if args.data:
        print(f"  📁 載入資料: {args.data}")
        data = DataLoader.load_csv(args.data)
    else:
        print(f"  🎲 產生合成資料: {args.days} 天（seed={args.seed}）")
        data = DataLoader.generate_synthetic(
            days=args.days,
            timeframe_minutes=args.timeframe,
            seed=args.seed,
        )

    print(f"  📊 K棒數量: {len(data)}")
    print()

    # 選擇策略
    if args.strategy == "momentum":
        strategy = AdaptiveMomentumStrategy()
    else:
        strategy = MeanReversionStrategy()

    # 執行回測
    engine = BacktestEngine(
        initial_balance=100000.0,
        slippage=1,
        commission=18.0,
    )

    result = engine.run(data, strategy, args.risk)

    # 印出報告
    report = BacktestReport(result)
    report.print_report()


if __name__ == "__main__":
    main()
