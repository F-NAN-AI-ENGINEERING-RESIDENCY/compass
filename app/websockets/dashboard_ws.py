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
            try:
                message = await websocket.receive_json()
            except ValueError:
                # Malformed frame — the only documented client message is a
                # ping, so ignore anything else rather than dropping the
                # connection over a stray frame from an idle proxy/client bug.
                continue
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(lesson_id, websocket)
