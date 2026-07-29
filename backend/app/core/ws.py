import json
import logging
from collections import defaultdict
from uuid import UUID

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections per user for real-time events."""

    def __init__(self):
        self._connections: dict[UUID, list[WebSocket]] = defaultdict(list)

    async def connect(self, user_id: UUID, ws: WebSocket):
        await ws.accept()
        self._connections[user_id].append(ws)
        logger.debug("WS connected: user=%s total=%d", user_id, len(self._connections[user_id]))

    def disconnect(self, user_id: UUID, ws: WebSocket):
        conns = self._connections.get(user_id, [])
        if ws in conns:
            conns.remove(ws)
        if not conns:
            self._connections.pop(user_id, None)
        logger.debug("WS disconnected: user=%s", user_id)

    async def broadcast_to_user(self, user_id: UUID, event: str, data: dict | None = None):
        """Send a JSON event to all connections for a given user."""
        payload = json.dumps({"event": event, "data": data or {}})
        conns = self._connections.get(user_id, [])[:]
        for ws in conns:
            try:
                await ws.send_text(payload)
            except Exception:
                self.disconnect(user_id, ws)

    async def broadcast_to_users(self, user_map: dict[UUID, dict | None], event: str):
        """Send an event to multiple users concurrently."""
        for user_id in user_map:
            await self.broadcast_to_user(user_id, event, user_map[user_id])


ws_manager = WebSocketManager()
