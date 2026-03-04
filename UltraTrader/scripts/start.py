"""
UltraTrader 一鍵啟動腳本

用法：
    python scripts/start.py
    python scripts/start.py --mode simulation
    python scripts/start.py --risk conservative
"""

import sys
import os
import argparse
import webbrowser
import time
from pathlib import Path

# 確保 UltraTrader 根目錄在 path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def check_environment():
    """檢查執行環境"""
    print("🔍 檢查環境...")

    # Python 版本
    version = sys.version_info
    if version < (3, 10):
        print(f"❌ 需要 Python 3.10+，你的版本是 {version.major}.{version.minor}")
        sys.exit(1)
    print(f"   ✅ Python {version.major}.{version.minor}.{version.micro}")

    # 檢查必要套件
    required = ["fastapi", "uvicorn", "pandas", "numpy", "loguru", "dotenv", "websockets"]
    missing = []
    for pkg in required:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)

    if missing:
        print(f"   ⚠️ 缺少套件: {', '.join(missing)}")
        print(f"   🔧 請執行: pip install -r {PROJECT_ROOT / 'requirements.txt'}")
        sys.exit(1)
    print("   ✅ 所有套件已安裝")

    # .env 檔案
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        example = PROJECT_ROOT / ".env.example"
        if example.exists():
            import shutil
            shutil.copy(example, env_path)
            print("   📝 已從 .env.example 建立 .env（請填入你的 API 金鑰）")
        else:
            print("   ⚠️ 找不到 .env，將使用預設設定（模擬模式）")

    # 建立必要目錄
    dirs = [
        PROJECT_ROOT / "data" / "logs",
        PROJECT_ROOT / "data" / "historical",
        PROJECT_ROOT / "data" / "backtest_results",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)

    print("   ✅ 資料目錄就緒")
    print()


def main():
    parser = argparse.ArgumentParser(description="UltraTrader 微台自動交易系統")
    parser.add_argument("--mode", choices=["simulation", "paper", "live"], default=None,
                        help="交易模式（預設從 .env 讀取）")
    parser.add_argument("--risk", choices=["conservative", "balanced", "aggressive"], default=None,
                        help="風險等級（預設從 .env 讀取）")
    parser.add_argument("--port", type=int, default=None,
                        help="Dashboard 端口（預設 8888）")
    parser.add_argument("--no-browser", action="store_true",
                        help="不自動開啟瀏覽器")
    args = parser.parse_args()

    print()
    print("  ⚡ UltraTrader — 微台自動交易系統")
    print("  ═══════════════════════════════════")
    print()

    # 環境檢查
    check_environment()

    # 覆蓋 .env 設定
    if args.mode:
        os.environ["TRADING_MODE"] = args.mode
    if args.risk:
        os.environ["RISK_PROFILE"] = args.risk
    if args.port:
        os.environ["DASHBOARD_PORT"] = str(args.port)

    # 初始化引擎
    from core.logger import setup_logger
    setup_logger()

    from core.engine import TradingEngine
    engine = TradingEngine()

    if not engine.initialize():
        print("❌ 引擎初始化失敗")
        sys.exit(1)

    # 啟動 Dashboard
    port = int(os.getenv("DASHBOARD_PORT", "8888"))
    host = os.getenv("DASHBOARD_HOST", "127.0.0.1")

    from dashboard.app import create_app
    app = create_app(engine)

    print(f"  📊 Dashboard: http://{host}:{port}")
    print(f"  📋 模式: {engine.trading_mode}")
    print(f"  🎚️ 風險: {engine.risk_profile}")
    print(f"  📡 合約: {engine.broker.get_contract_name()}")
    print()
    print("  按 Ctrl+C 停止")
    print()

    # 開啟瀏覽器
    if not args.no_browser:
        def open_browser():
            time.sleep(1.5)
            webbrowser.open(f"http://{host}:{port}")
        import threading
        threading.Thread(target=open_browser, daemon=True).start()

    # 啟動 uvicorn
    import uvicorn
    try:
        uvicorn.run(app, host=host, port=port, log_level="warning")
    except KeyboardInterrupt:
        print("\n⏹️ 正在停止...")
        engine.stop()
        print("👋 UltraTrader 已關閉")


if __name__ == "__main__":
    main()
