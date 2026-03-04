"""
UltraTrader Dashboard — FastAPI 伺服器
提供 REST API + WebSocket 即時推送 + 靜態檔案
"""

import asyncio
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from dashboard.websocket import DashboardWebSocket

# 全域引用
_engine = None
_ws_manager = DashboardWebSocket()

STATIC_DIR = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """應用生命週期"""
    # 啟動：開始處理 WebSocket 佇列 + 啟動引擎
    queue_task = asyncio.create_task(_ws_manager.process_queue())

    if _engine:
        _engine.set_ws_broadcast(_ws_manager.broadcast_sync)
        _engine.start()

    yield

    # 關閉
    queue_task.cancel()
    if _engine:
        _engine.stop()


def create_app(engine=None) -> FastAPI:
    """建立 FastAPI 應用"""
    global _engine
    _engine = engine

    app = FastAPI(title="UltraTrader Dashboard", lifespan=lifespan)

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- 靜態檔案 ----
    @app.get("/")
    async def index():
        return FileResponse(STATIC_DIR / "index.html")

    # ---- REST API ----

    @app.get("/api/state")
    async def get_state():
        """取得引擎完整狀態"""
        if not _engine:
            return JSONResponse({"error": "引擎未初始化"}, status_code=503)
        return _engine.get_state()

    @app.get("/api/trades")
    async def get_trades():
        """取得交易紀錄"""
        if not _engine:
            return []
        return _engine.get_trade_history()

    @app.get("/api/kbars")
    async def get_kbars(timeframe: int = 1, count: int = 200):
        """取得 K 棒資料"""
        if not _engine:
            return []
        return _engine.get_kbars(timeframe, count)

    @app.get("/api/stats")
    async def get_stats():
        """取得績效統計"""
        if not _engine:
            return {}
        return _engine.get_stats()

    @app.post("/api/engine/{action}")
    async def engine_action(action: str):
        """引擎控制"""
        if not _engine:
            return JSONResponse({"error": "引擎未初始化"}, status_code=503)

        if action == "start":
            _engine.start()
        elif action == "stop":
            _engine.stop()
        elif action == "pause":
            _engine.pause()
        elif action == "resume":
            _engine.resume()
        elif action == "close":
            _engine.manual_close()
        else:
            return JSONResponse({"error": f"未知操作: {action}"}, status_code=400)

        return {"status": "ok", "state": _engine.state.value}

    @app.post("/api/settings")
    async def update_settings(settings: dict):
        """更新設定"""
        if not _engine:
            return JSONResponse({"error": "引擎未初始化"}, status_code=503)

        if "risk_profile" in settings:
            _engine.set_risk_profile(settings["risk_profile"])

        return {"status": "ok"}

    # ---- WebSocket ----

    @app.websocket("/ws")
    async def websocket_endpoint(ws: WebSocket):
        await _ws_manager.connect(ws)

        # 連線後立即推送完整狀態
        if _engine:
            try:
                await ws.send_json({"type": "state", "data": _engine.get_state()})
            except Exception:
                pass

        try:
            while True:
                # 保持連線，接收客戶端訊息（如果有的話）
                data = await ws.receive_text()
                # 可以處理客戶端命令
        except WebSocketDisconnect:
            await _ws_manager.disconnect(ws)
        except Exception:
            await _ws_manager.disconnect(ws)

    return app
