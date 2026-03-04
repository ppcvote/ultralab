"""
UltraTrader WebSocket 管理器
管理 Dashboard 的即時連線和訊息廣播
"""

import json
import asyncio
from typing import Set
from datetime import datetime

from loguru import logger
from fastapi import WebSocket


class DashboardWebSocket:
    """WebSocket 連線管理器"""

    def __init__(self):
        self._clients: Set[WebSocket] = set()
        self._lock = asyncio.Lock()
        self._message_queue: asyncio.Queue = asyncio.Queue(maxsize=1000)

    async def connect(self, ws: WebSocket):
        """接受新連線"""
        await ws.accept()
        async with self._lock:
            self._clients.add(ws)
        logger.info(f"📱 Dashboard 連線（共 {len(self._clients)} 個）")

    async def disconnect(self, ws: WebSocket):
        """移除連線"""
        async with self._lock:
            self._clients.discard(ws)
        logger.info(f"📱 Dashboard 斷線（剩 {len(self._clients)} 個）")

    async def broadcast(self, message: dict):
        """廣播訊息到所有連線"""
        if not self._clients:
            return

        data = json.dumps(message, ensure_ascii=False, default=str)
        dead_clients = set()

        async with self._lock:
            for ws in self._clients:
                try:
                    await ws.send_text(data)
                except Exception:
                    dead_clients.add(ws)

            # 清理斷線的客戶端
            self._clients -= dead_clients

    def broadcast_sync(self, message: dict):
        """
        同步版廣播（從非 async 環境呼叫）
        引擎執行緒透過此方法推送訊息
        """
        try:
            self._message_queue.put_nowait(message)
        except asyncio.QueueFull:
            pass  # 佇列滿了就丟棄

    async def process_queue(self):
        """處理同步佇列中的訊息（在 async 環境中執行）"""
        while True:
            try:
                message = self._message_queue.get_nowait()
                await self.broadcast(message)
            except asyncio.QueueEmpty:
                await asyncio.sleep(0.05)  # 50ms 輪詢
            except Exception:
                await asyncio.sleep(0.1)

    @property
    def client_count(self) -> int:
        return len(self._clients)
