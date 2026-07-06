from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.security import create_access_token
from app.dependencies import CurrentUser, get_current_user, get_db
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    ProfileResponse,
    ProfileUpdateRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _to_profile_response(current_user: CurrentUser) -> ProfileResponse:
    principal = current_user.principal
    return ProfileResponse(
        id=auth_service.user_id_of(principal),
        role=current_user.role,
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
    return _to_profile_response(CurrentUser(principal=user, role=payload.role))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        user = auth_service.authenticate_user(db, payload.role, payload.username, payload.password)
    except auth_service.InvalidCredentialsError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    user_id = auth_service.user_id_of(user)
    token = create_access_token(user_id=user_id, role=payload.role.value)
    return TokenResponse(access_token=token, role=payload.role, user_id=user_id)


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: CurrentUser = Depends(get_current_user)) -> MessageResponse:
    # Stateless JWT: nothing to revoke server-side: the access token remains valid
    # until it expires (see ACCESS_TOKEN_EXPIRE_MINUTES). Good enough for this MVP;
    # a revocation store is the natural upgrade if early logout must be enforced.
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=ProfileResponse)
def get_me(current_user: CurrentUser = Depends(get_current_user)) -> ProfileResponse:
    return _to_profile_response(current_user)


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
    return _to_profile_response(CurrentUser(principal=updated, role=current_user.role))
