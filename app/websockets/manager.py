import asyncio
from collections import defaultdict
from typing import Dict, Optional, Set

from fastapi import WebSocket


class ConnectionManager:
    """One process-wide instance. Tracks live sockets per lesson_id and is the
    only thing that touches them, so connect/disconnect/broadcast can't race."""

    def __init__(self) -> None:
        self._connections: Dict[int, Set[WebSocket]] = defaultdict(set)
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, lesson_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[lesson_id].add(websocket)

    def disconnect(self, lesson_id: int, websocket: WebSocket) -> None:
        self._connections[lesson_id].discard(websocket)
        if not self._connections[lesson_id]:
            del self._connections[lesson_id]

    async def _broadcast(self, lesson_id: int, message: dict) -> None:
        for websocket in list(self._connections.get(lesson_id, ())):
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect(lesson_id, websocket)

    async def _close_lesson(self, lesson_id: int, code: int) -> None:
        for websocket in list(self._connections.get(lesson_id, ())):
            try:
                await websocket.close(code=code)
            except Exception:
                pass
        self._connections.pop(lesson_id, None)

    async def _broadcast_and_close(self, lesson_id: int, message: dict, code: int) -> None:
        # One task, not two scheduled separately — guarantees the close can't
        # jump ahead of the send on the event loop.
        await self._broadcast(lesson_id, message)
        await self._close_lesson(lesson_id, code)

    def broadcast_threadsafe(self, lesson_id: int, message: dict) -> None:
        """Entry point for callers on FastAPI's sync threadpool (every service
        function that fires an event today runs there, not on the event loop).
        run_coroutine_threadsafe is the supported way to schedule real async
        work — the actual socket sends in _broadcast — from that thread onto
        the loop bound at startup."""
        if self._loop is None:
            return
        asyncio.run_coroutine_threadsafe(self._broadcast(lesson_id, message), self._loop)

    def broadcast_and_close_threadsafe(self, lesson_id: int, message: dict, code: int) -> None:
        if self._loop is None:
            return
        asyncio.run_coroutine_threadsafe(self._broadcast_and_close(lesson_id, message, code), self._loop)


manager = ConnectionManager()
