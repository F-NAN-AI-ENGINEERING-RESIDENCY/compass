from datetime import datetime, timezone

from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.auth.security import get_session_by_token
from app.schemas.auth import RoleEnum
from app.services import auth_service, lesson_service

# Per the API contract's WS section.
NOT_AUTHENTICATED = 4401
NOT_AUTHORIZED = 4403
LESSON_NOT_LIVE = 4409


class WebSocketAuthError(Exception):
    def __init__(self, code: int) -> None:
        self.code = code


def _authenticate(db: Session, token: str):
    session = get_session_by_token(db, token)
    if session is None or session.expires_at < datetime.now(timezone.utc):
        raise WebSocketAuthError(NOT_AUTHENTICATED)

    try:
        role = RoleEnum(session.role)
    except ValueError:
        raise WebSocketAuthError(NOT_AUTHENTICATED)

    principal = auth_service.get_principal(db, role, session.user_id)
    if principal is None or not principal.is_active:
        raise WebSocketAuthError(NOT_AUTHENTICATED)

    return principal, role


def _authorize_lesson_access(db: Session, lesson_id: int, principal, role: RoleEnum) -> None:
    user_id = auth_service.user_id_of(principal)
    try:
        lesson = lesson_service.get_lesson_or_404(db, lesson_id)
    except lesson_service.LessonNotFoundError:
        # Not in the contract's documented code list; a missing lesson is
        # equally "not enrolled/not the assigned teacher" from the client's
        # perspective, so it folds into the same 4403 rather than a fourth code.
        raise WebSocketAuthError(NOT_AUTHORIZED)

    try:
        if role == RoleEnum.teacher:
            lesson_service.assert_teacher_owns_lesson(lesson, user_id)
        else:
            lesson_service.assert_student_enrolled(db, lesson, user_id)
    except (lesson_service.NotLessonOwnerError, lesson_service.NotEnrolledError):
        raise WebSocketAuthError(NOT_AUTHORIZED)

    if lesson.status != "live":
        raise WebSocketAuthError(LESSON_NOT_LIVE)


async def authenticate_lesson_socket(websocket: WebSocket, db: Session, lesson_id: int) -> None:
    """Runs before websocket.accept(). Same checks as get_current_user, but a WS
    handshake carries no Authorization header, so the token comes from a query
    param instead — this is deliberately synchronous DB work on the event loop,
    a one-time per-connection cost rather than the per-request threadpool the
    rest of the app uses."""
    token = websocket.query_params.get("token")
    if not token:
        raise WebSocketAuthError(NOT_AUTHENTICATED)
    principal, role = _authenticate(db, token)
    _authorize_lesson_access(db, lesson_id, principal, role)
