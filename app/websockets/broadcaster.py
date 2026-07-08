"""No WebSocket infrastructure exists yet (see WS /ws/lessons/:lessonId in the
API contract). This is the single wiring point lesson/signal lifecycle code
calls into — once a real connection manager exists, replace the body below
with an actual fan-out to that lesson's connected clients. Until then it's a
deliberate no-op so calling code doesn't need to change when WS lands."""


def broadcast(lesson_id: int, event_type: str, data: dict) -> None:
    pass
