"""
UltraTrader 日誌系統
使用 loguru 提供彩色終端輸出 + 檔案日誌
"""

import sys
from pathlib import Path
from loguru import logger

# 移除預設 handler
logger.remove()

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
LOG_DIR = PROJECT_ROOT / "data" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


def setup_logger(console_level: str = "INFO", file_level: str = "DEBUG"):
    """初始化日誌系統"""
    logger.remove()

    # 終端機輸出（彩色）
    logger.add(
        sys.stdout,
        level=console_level,
        format=(
            "<green>{time:HH:mm:ss}</green> | "
            "<level>{level: <7}</level> | "
            "<level>{message}</level>"
        ),
        colorize=True,
    )

    # 主日誌檔案（每日輪替）
    logger.add(
        str(LOG_DIR / "ultratrader_{time:YYYYMMDD}.log"),
        level=file_level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <7} | {module}:{function}:{line} | {message}",
        rotation="00:00",
        retention="30 days",
        compression="gz",
        encoding="utf-8",
    )

    # 交易專用日誌
    logger.add(
        str(LOG_DIR / "trades_{time:YYYYMMDD}.log"),
        level="INFO",
        format="{time:YYYY-MM-DD HH:mm:ss} | {message}",
        rotation="00:00",
        retention="90 days",
        encoding="utf-8",
        filter=lambda record: record["extra"].get("trade_log", False),
    )

    logger.info("日誌系統初始化完成")
    return logger


# 快捷函數
def log_trade(message: str):
    """記錄交易相關日誌（同時寫入交易專用日誌檔）"""
    logger.bind(trade_log=True).info(message)


def log_signal(direction: str, strength: float, reason: str):
    """記錄訊號資訊"""
    emoji = "📈" if direction == "BUY" else "📉" if direction == "SELL" else "⏸️"
    logger.info(f"{emoji} 訊號: {direction} | 強度: {strength:.2f} | {reason}")


def log_order(action: str, price: float, quantity: int, order_type: str):
    """記錄下單資訊"""
    emoji = "🟢" if action == "BUY" else "🔴"
    log_trade(f"{emoji} 下單: {action} {quantity}口 @ {price} ({order_type})")


def log_fill(action: str, price: float, quantity: int):
    """記錄成交資訊"""
    log_trade(f"✅ 成交: {action} {quantity}口 @ {price}")


def log_pnl(pnl: float, reason: str):
    """記錄損益"""
    emoji = "🎯" if pnl > 0 else "🛑"
    log_trade(f"{emoji} 平倉: {reason} | 損益: {pnl:+.0f} 元")
