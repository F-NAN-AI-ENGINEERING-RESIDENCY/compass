import re
from typing import Optional, Union

from sqlalchemy import inspect as sa_inspect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.security import hash_password, verify_password
from app.models.student import Student
from app.models.teacher import Teacher
from app.schemas.auth import ProfileUpdateRequest, RegisterRequest, RoleEnum

Principal = Union[Student, Teacher]

_MODEL_BY_ROLE = {RoleEnum.student: Student, RoleEnum.teacher: Teacher}


class DuplicateAccountError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


def _model_for_role(role: RoleEnum):
    return _MODEL_BY_ROLE[role]


def _pk_value(principal: Principal):
    pk_name = sa_inspect(type(principal)).primary_key[0].name
    return getattr(principal, pk_name)


def user_id_of(principal: Principal) -> int:
    """The role-agnostic external id (student_id or teacher_id) of a principal."""
    return _pk_value(principal)


def register_user(db: Session, payload: RegisterRequest) -> Principal:
    model = _model_for_role(payload.role)
    exists = (
        db.query(model)
        .filter((model.username == payload.username) | (model.email == payload.email))
        .first()
    )
    if exists is not None:
        raise DuplicateAccountError("Username or email already registered")

    user = model(
        username=payload.username,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateAccountError("Username or email already registered")
    db.refresh(user)
    return user


def authenticate_user(db: Session, role: RoleEnum, username: str, password: str) -> Principal:
    model = _model_for_role(role)
    user = db.query(model).filter(model.username == username).first()
    # password_hash is null for Google-only accounts — check presence before
    # verify_password, which needs a real hash string to compare against.
    if user is None or not user.is_active or not user.password_hash or not verify_password(
        password, user.password_hash
    ):
        raise InvalidCredentialsError("Incorrect username or password")
    return user


def _generate_username_from_email(db: Session, model, email: str) -> str:
    base = re.sub(r"[^a-z0-9_]", "", email.split("@")[0].lower()) or "user"
    candidate = base
    suffix = 1
    while db.query(model).filter(model.username == candidate).first() is not None:
        suffix += 1
        candidate = f"{base}{suffix}"
    return candidate


def authenticate_or_register_with_google(
    db: Session, role: RoleEnum, google_sub: str, email: str, name: str
) -> Principal:
    """Looks up an account by google_sub (returning role's table only — a
    google_sub is not deduplicated across the student/teacher tables, same
    as username/email today). Three cases:
    1. google_sub already on file: log in.
    2. No google_sub match, but the verified email matches an existing
       password account: link this Google identity to it (first time that
       account uses "Continue with Google") and log in.
    3. Neither: create a new account, auth_provider="google", no password.
    """
    model = _model_for_role(role)

    existing_by_sub = db.query(model).filter(model.google_sub == google_sub).first()
    if existing_by_sub is not None:
        return existing_by_sub

    existing_by_email = db.query(model).filter(model.email == email).first()
    if existing_by_email is not None:
        existing_by_email.google_sub = google_sub
        db.commit()
        db.refresh(existing_by_email)
        return existing_by_email

    user = model(
        username=_generate_username_from_email(db, model, email),
        name=name,
        email=email,
        password_hash=None,
        auth_provider="google",
        google_sub=google_sub,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateAccountError("Username or email already registered")
    db.refresh(user)
    return user


def get_principal(db: Session, role: RoleEnum, user_id: int) -> Optional[Principal]:
    model = _model_for_role(role)
    return db.get(model, user_id)


def update_profile(db: Session, principal: Principal, payload: ProfileUpdateRequest) -> Principal:
    model = type(principal)

    if payload.email is not None and payload.email != principal.email:
        pk_name = sa_inspect(model).primary_key[0].name
        exists = (
            db.query(model)
            .filter(model.email == payload.email)
            .filter(getattr(model, pk_name) != _pk_value(principal))
            .first()
        )
        if exists is not None:
            raise DuplicateAccountError("Email already registered")
        principal.email = payload.email

    if payload.name is not None:
        principal.name = payload.name

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateAccountError("Email already registered")
    db.refresh(principal)
    return principal
