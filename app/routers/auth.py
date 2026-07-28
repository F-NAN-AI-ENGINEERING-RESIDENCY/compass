from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.google_oauth import GoogleTokenError, verify_google_id_token
from app.auth.security import create_session
from app.dependencies import CurrentUser, get_current_user, get_db
from app.schemas.auth import (
    GoogleAuthRequest,
    LoginRequest,
    MessageResponse,
    ProfileResponse,
    ProfileUpdateRequest,
    RegisterRequest,
    RoleEnum,
    TokenResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _to_profile_response(principal, role: RoleEnum) -> ProfileResponse:
    return ProfileResponse(
        id=auth_service.user_id_of(principal),
        role=role,
        username=principal.username,
        name=principal.name,
        email=principal.email,
        is_active=principal.is_active,
        created_at=principal.created_at,
    )


@router.post("/register", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> ProfileResponse:
    try:
        user = auth_service.register_user(db, payload)
    except auth_service.DuplicateAccountError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return _to_profile_response(user, payload.role)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        user = auth_service.authenticate_user(db, payload.role, payload.username, payload.password)
    except auth_service.InvalidCredentialsError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    user_id = auth_service.user_id_of(user)
    session = create_session(db, user_id=user_id, role=payload.role.value)
    return TokenResponse(access_token=session.token, role=payload.role, user_id=user_id)


@router.post("/google", response_model=TokenResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        identity = verify_google_id_token(payload.id_token)
    except GoogleTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    try:
        user = auth_service.authenticate_or_register_with_google(
            db, payload.role, identity.sub, identity.email, identity.name
        )
    except auth_service.DuplicateAccountError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    user_id = auth_service.user_id_of(user)
    session = create_session(db, user_id=user_id, role=payload.role.value)
    return TokenResponse(access_token=session.token, role=payload.role, user_id=user_id)


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    # Deletes exactly the session tied to this token — not every session this
    # user has (e.g. on another device) — so the token used here dies
    # immediately on next use instead of surviving until its natural expiry.
    db.delete(current_user.session)
    db.commit()
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=ProfileResponse)
def get_me(current_user: CurrentUser = Depends(get_current_user)) -> ProfileResponse:
    return _to_profile_response(current_user.principal, current_user.role)


@router.patch("/me", response_model=ProfileResponse)
def update_me(
    payload: ProfileUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    try:
        updated = auth_service.update_profile(db, current_user.principal, payload)
    except auth_service.DuplicateAccountError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return _to_profile_response(updated, current_user.role)
