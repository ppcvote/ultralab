"""
UltraTrader 四層風控管理器
整合部位大小、每日限制、帳戶安全、系統熔斷
"""

from dataclasses import dataclass
from datetime import datetime, time
from typing import Optional

from loguru import logger

from core.market_data import MarketSnapshot
from core.position import PositionManager
from core.broker import AccountInfo
from strategy.base import Signal, SignalDirection
from risk.position_sizing import PositionSizer, RISK_PRESETS
from risk.circuit_breaker import CircuitBreaker


@dataclass
class RiskDecision:
    """風控判定結果"""
    approved: bool
    quantity: int = 0
    adjusted_stop: float = 0.0
    rejection_reason: str = ""


class RiskManager:
    """
    四層風控管理器

    第 1 層：單筆風控 — 部位大小 + 停損合理性
    第 2 層：日內風控 — 每日虧損/交易次數上限
    第 3 層：帳戶風控 — 保證金水位 + 最大回撤
    第 4 層：系統風控 — 熔斷 + 交易時段
    """

    # 微台保證金
    MARGIN_PER_CONTRACT = 4600  # 原始保證金（約）
    MAINTENANCE_MARGIN = 3500   # 維持保證金（約）

    def __init__(self, profile: str = "balanced"):
        self.position_sizer = PositionSizer(profile)
        self.circuit_breaker = CircuitBreaker(
            max_daily_loss=self.position_sizer.preset.max_daily_loss,
            max_consecutive_loss=self.position_sizer.preset.max_consecutive_loss,
            cooldown_minutes=self.position_sizer.preset.cooldown_minutes,
        )
        self._profile = profile
        self._peak_equity = 0.0

    def set_profile(self, profile: str):
        """切換風險等級"""
        if profile not in RISK_PRESETS:
            return

        self._profile = profile
        self.position_sizer.set_profile(profile)
        preset = self.position_sizer.preset
        self.circuit_breaker.update_settings(
            max_daily_loss=preset.max_daily_loss,
            max_consecutive_loss=preset.max_consecutive_loss,
            cooldown_minutes=preset.cooldown_minutes,
        )
        logger.info(f"🎚️ 風險等級切換: {preset.label}")

    def evaluate(
        self,
        signal: Signal,
        position_manager: PositionManager,
        account: AccountInfo,
        snapshot: MarketSnapshot,
    ) -> RiskDecision:
        """
        評估訊號是否通過風控

        四層依序檢查，任一層不通過就拒絕
        """

        # ---- 第 4 層：系統風控（最先檢查）----
        # 熔斷檢查
        if not self.circuit_breaker.can_trade:
            return RiskDecision(
                approved=False,
                rejection_reason=f"熔斷中: {self.circuit_breaker.to_dict()['halt_reason']}",
            )

        # 交易時段檢查
        if not self._in_trading_session():
            return RiskDecision(
                approved=False,
                rejection_reason="非交易時段",
            )

        # ---- 第 3 層：帳戶風控 ----
        equity = account.equity if account.equity > 0 else account.balance
        self._peak_equity = max(self._peak_equity, equity)

        # 帳戶餘額過低
        min_balance = self.MARGIN_PER_CONTRACT * 1.5
        if equity < min_balance:
            return RiskDecision(
                approved=False,
                rejection_reason=f"帳戶權益不足: {equity:,.0f} < {min_balance:,.0f}",
            )

        # 最大回撤檢查
        if self._peak_equity > 0:
            drawdown_pct = (self._peak_equity - equity) / self._peak_equity
            max_dd = self.position_sizer.preset.max_drawdown_pct
            if drawdown_pct > max_dd:
                return RiskDecision(
                    approved=False,
                    rejection_reason=f"回撤超限: {drawdown_pct:.1%} > {max_dd:.1%}",
                )

        # ---- 第 2 層：日內風控 ----
        preset = self.position_sizer.preset

        # 每日交易次數
        daily_count = position_manager.get_daily_trade_count()
        if daily_count >= preset.max_daily_trades:
            return RiskDecision(
                approved=False,
                rejection_reason=f"每日交易次數已達上限: {daily_count}/{preset.max_daily_trades}",
            )

        # 每日虧損檢查（由 circuit_breaker 處理，這裡做預警）
        daily_pnl = position_manager.get_daily_pnl()
        if daily_pnl < -(preset.max_daily_loss * 0.8):
            logger.warning(f"⚠️ 每日虧損接近上限: {daily_pnl:,.0f} / -{preset.max_daily_loss:,.0f}")

        # ---- 第 1 層：單筆風控 ----
        # 已有持倉不開新倉
        if not position_manager.position.is_flat and signal.direction != SignalDirection.CLOSE:
            return RiskDecision(
                approved=False,
                rejection_reason="已有持倉",
            )

        # 平倉訊號直接通過
        if signal.direction == SignalDirection.CLOSE:
            return RiskDecision(
                approved=True,
                quantity=position_manager.position.quantity,
            )

        # 計算停損距離
        stop_distance = abs(snapshot.price - signal.stop_loss)
        if stop_distance <= 0:
            stop_distance = snapshot.atr * 2 if snapshot.atr > 0 else 100

        # 停損距離合理性檢查
        atr = snapshot.atr if snapshot.atr > 0 else 50
        if stop_distance > atr * 5:
            return RiskDecision(
                approved=False,
                rejection_reason=f"停損距離過大: {stop_distance:.0f} 點 > {atr * 5:.0f} 點",
            )

        if stop_distance < atr * 0.3:
            # 停損太小，調整到至少 1 ATR
            signal.stop_loss = (
                snapshot.price - atr if signal.is_buy else snapshot.price + atr
            )
            stop_distance = atr
            logger.info(f"📐 停損距離太小，自動調整到 {stop_distance:.0f} 點")

        # 計算部位大小
        quantity = self.position_sizer.calculate(equity, stop_distance)

        # 保證金檢查
        required_margin = quantity * self.MARGIN_PER_CONTRACT
        if required_margin > account.margin_available and account.margin_available > 0:
            quantity = max(1, int(account.margin_available / self.MARGIN_PER_CONTRACT))

        return RiskDecision(
            approved=True,
            quantity=quantity,
            adjusted_stop=signal.stop_loss,
        )

    def on_trade_closed(self, pnl: float, expected_max_loss: float = 0):
        """交易關閉時通知風控"""
        self.circuit_breaker.on_trade(pnl, expected_max_loss)

    @staticmethod
    def _in_trading_session() -> bool:
        """檢查是否在交易時段"""
        now = datetime.now().time()

        # 日盤 08:45 ~ 13:45
        if time(8, 44) <= now <= time(13, 45):
            return True

        # 夜盤 15:00 ~ 隔日 05:00
        if now >= time(15, 0) or now <= time(5, 0):
            return True

        return False

    def to_dict(self) -> dict:
        """序列化（供 Dashboard 顯示）"""
        return {
            "profile": self._profile,
            "preset": self.position_sizer.get_preset_info(),
            "circuit_breaker": self.circuit_breaker.to_dict(),
            "peak_equity": self._peak_equity,
            "in_trading_session": self._in_trading_session(),
        }
