from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.websockets.auth import WebSocketAuthError, authenticate_lesson_socket
from app.websockets.manager import manager

router = APIRouter()


@router.websocket("/ws/lessons/{lesson_id}")
async def lesson_dashboard_socket(websocket: WebSocket, lesson_id: int, db: Session = Depends(get_db)) -> None:
    try:
        await authenticate_lesson_socket(websocket, db, lesson_id)
    except WebSocketAuthError as exc:
        await websocket.close(code=exc.code)
        return

    await manager.connect(lesson_id, websocket)
    try:
        while True:
            # Clients don't send anything meaningful here — this just blocks
            # until the socket closes so we notice the disconnect.
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(lesson_id, websocket)
