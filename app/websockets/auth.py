from datetime import datetime, timezone

from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.auth.security import get_session_by_token
from app.schemas.auth import RoleEnum
from app.services import auth_service, lesson_service

POLICY_VIOLATION = 1008  # standard WS close code for auth/authz failures


class WebSocketAuthError(Exception):
    def __init__(self, code: int = POLICY_VIOLATION) -> None:
        self.code = code


def _authenticate(db: Session, token: str):
    session = get_session_by_token(db, token)
    if session is None or session.expires_at < datetime.now(timezone.utc):
        raise WebSocketAuthError()

    try:
        role = RoleEnum(session.role)
    except ValueError:
        raise WebSocketAuthError()

    principal = auth_service.get_principal(db, role, session.user_id)
    if principal is None or not principal.is_active:
        raise WebSocketAuthError()

    return principal, role


def _authorize_lesson_access(db: Session, lesson_id: int, principal, role: RoleEnum) -> None:
    user_id = auth_service.user_id_of(principal)
    try:
        lesson = lesson_service.get_lesson_or_404(db, lesson_id)
        if role == RoleEnum.teacher:
            lesson_service.assert_teacher_owns_lesson(lesson, user_id)
        else:
            lesson_service.assert_student_enrolled(db, lesson, user_id)
    except lesson_service.LessonNotFoundError:
        raise WebSocketAuthError(code=4404)
    except (lesson_service.NotLessonOwnerError, lesson_service.NotEnrolledError):
        raise WebSocketAuthError()


async def authenticate_lesson_socket(websocket: WebSocket, db: Session, lesson_id: int) -> None:
    """Runs before websocket.accept(). Same checks as get_current_user, but a WS
    handshake carries no Authorization header, so the token comes from a query
    param instead — this is deliberately synchronous DB work on the event loop,
    a one-time per-connection cost rather than the per-request threadpool the
    rest of the app uses."""
    token = websocket.query_params.get("token")
    if not token:
        raise WebSocketAuthError()
    principal, role = _authenticate(db, token)
    _authorize_lesson_access(db, lesson_id, principal, role)
