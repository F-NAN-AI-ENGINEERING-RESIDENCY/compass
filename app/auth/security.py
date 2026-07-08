import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from passlib.context import CryptContext
from sqlalchemy.orm import Session as DbSession

from app.config import settings
from app.models.session import Session

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return _pwd_context.verify(plain_password, password_hash)


def create_session(db: DbSession, user_id: int, role: str) -> Session:
    # token_urlsafe, never derived from user data or sequential — a session
    # token doubles as the sole credential, so it must be unguessable outright.
    session = Session(
        token=secrets.token_urlsafe(32),
        user_id=user_id,
        role=role,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=settings.session_expire_hours),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session_by_token(db: DbSession, token: str) -> Optional[Session]:
    return db.query(Session).filter(Session.token == token).first()
