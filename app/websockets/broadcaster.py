from app.websockets.manager import manager


def broadcast(lesson_id: int, event_type: str, data: dict) -> None:
    manager.broadcast_threadsafe(lesson_id, {"type": event_type, "data": data})


def broadcast_and_close(lesson_id: int, event_type: str, data: dict, close_code: int = 1000) -> None:
    manager.broadcast_and_close_threadsafe(lesson_id, {"type": event_type, "data": data}, close_code)
