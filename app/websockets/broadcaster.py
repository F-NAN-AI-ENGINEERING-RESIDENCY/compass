from app.websockets.manager import manager


def broadcast(lesson_id: int, event_type: str, data: dict) -> None:
    manager.broadcast_threadsafe(lesson_id, {"eventType": event_type, **data})
