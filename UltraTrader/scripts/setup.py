"""
UltraTrader 環境安裝腳本

用法：
    python scripts/setup.py
"""

import sys
import os
import shutil
import subprocess
from pathlib import Path


def main():
    print()
    print("  ⚡ UltraTrader 環境設定")
    print("  ═══════════════════════")
    print()

    project_root = Path(__file__).parent.parent

    # 1. Python 版本
    v = sys.version_info
    print(f"  [1/4] Python 版本: {v.major}.{v.minor}.{v.micro}", end="")
    if v >= (3, 10):
        print(" ✅")
    else:
        print(" ❌（需要 3.10+）")
        sys.exit(1)

    # 2. 安裝套件
    print("  [2/4] 安裝 Python 套件...")
    req_file = project_root / "requirements.txt"
    if req_file.exists():
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", str(req_file)],
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            print("        ✅ 套件安裝完成")
        else:
            print(f"        ❌ 安裝失敗: {result.stderr[:200]}")
            sys.exit(1)
    else:
        print("        ❌ 找不到 requirements.txt")

    # 3. 建立目錄
    print("  [3/4] 建立資料目錄...")
    dirs = [
        project_root / "data" / "logs",
        project_root / "data" / "historical",
        project_root / "data" / "backtest_results",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
    print("        ✅ 目錄就緒")

    # 4. .env 檔案
    print("  [4/4] 環境變數設定...")
    env_file = project_root / ".env"
    example_file = project_root / ".env.example"

    if env_file.exists():
        print("        ✅ .env 已存在")
    elif example_file.exists():
        shutil.copy(example_file, env_file)
        print("        📝 已從 .env.example 建立 .env")
        print("        ⚠️ 請編輯 .env 填入你的 API 金鑰")
    else:
        print("        ⚠️ 找不到 .env.example")

    print()
    print("  ✅ 設定完成！")
    print()
    print("  接下來：")
    print(f"    1. 編輯 {env_file}")
    print("    2. 填入永豐 Shioaji API 金鑰（或保持 simulation 模式）")
    print("    3. python scripts/start.py")
    print()


if __name__ == "__main__":
    main()
