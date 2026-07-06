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
    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        raise InvalidCredentialsError("Incorrect username or password")
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
