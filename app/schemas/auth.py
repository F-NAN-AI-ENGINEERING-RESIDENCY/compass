from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import EmailStr, Field

from app.schemas.base import CamelModel


class RoleEnum(str, Enum):
    student = "student"
    teacher = "teacher"


class RegisterRequest(CamelModel):
    role: RoleEnum
    username: str = Field(min_length=3, max_length=50)
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class GoogleAuthRequest(CamelModel):
    id_token: str
    # Required on every call, not just first-time signup: mirrors
    # LoginRequest's explicit role, and lets the same google_sub exist as a
    # separate student and teacher account (identical to how username/email
    # are scoped per-role today, not deduplicated across the two tables).
    role: RoleEnum


class LoginRequest(CamelModel):
    role: RoleEnum
    username: str
    password: str


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    role: RoleEnum
    user_id: int


class ProfileResponse(CamelModel):
    id: int
    role: RoleEnum
    username: str
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime


class ProfileUpdateRequest(CamelModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None


class MessageResponse(CamelModel):
    message: str
