from collections.abc import Generator
from datetime import datetime, timezone
from typing import NamedTuple, Optional, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session as DbSession

from app.auth.security import get_session_by_token
from app.database import SessionLocal
from app.models.session import Session
from app.models.student import Student
from app.models.teacher import Teacher
from app.schemas.auth import RoleEnum
from app.services import auth_service

# auto_error=False so a *missing* Authorization header falls through to our own
# 401 below, instead of HTTPBearer's default of raising 403 for that case — the
# API contract treats "not authenticated" (401) and "wrong role/owner" (403) as
# distinct, so the not-authenticated path must consistently be 401.
_bearer_scheme = HTTPBearer(auto_error=False)


def get_db() -> Generator[DbSession, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CurrentUser(NamedTuple):
    principal: Union[Student, Teacher]
    role: RoleEnum
    session: Session


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: DbSession = Depends(get_db),
) -> CurrentUser:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials"
    )
    if credentials is None:
        raise credentials_error

    session = get_session_by_token(db, credentials.credentials)
    if session is None or session.expires_at < datetime.now(timezone.utc):
        raise credentials_error

    try:
        role = RoleEnum(session.role)
    except ValueError:
        raise credentials_error

    principal = auth_service.get_principal(db, role, session.user_id)
    if principal is None or not principal.is_active:
        raise credentials_error

    return CurrentUser(principal=principal, role=role, session=session)


def require_student(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.role != RoleEnum.student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student role required")
    return current_user


def require_teacher(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.role != RoleEnum.teacher:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher role required")
    return current_user
