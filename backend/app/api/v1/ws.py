from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status

from app.db.session import async_session_factory
from app.models.user import User
from app.core.security import decode_token
from app.core.ws import ws_manager

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    """Authenticate via ?token=<jwt> then subscribe to real-time events."""
    try:
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        if user_id_str is None:
            await ws.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = UUID(user_id_str)

        async with async_session_factory() as db:
            user = await db.get(User, user_id)
            if user is None:
                await ws.close(code=status.WS_1008_POLICY_VIOLATION)
                return
    except Exception:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect(user_id, ws)
    try:
        while True:
            # Keep connection alive — client sends pings, or we could use ping/pong
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_text('{"event":"pong"}')
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(user_id, ws)
