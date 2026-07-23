from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Student(Base):
    __tablename__ = "students"

    student_id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    # Nullable: accounts created via "Continue with Google" have no password.
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # "password" | "google". Doesn't gate login by itself (a google-created
    # account simply has no password_hash to verify against) — mainly a
    # readable record of how the account was created.
    auth_provider: Mapped[str] = mapped_column(String, nullable=False, default="password", server_default="password")
    # Google's stable per-account subject id. Unique, nullable (password
    # accounts never set it) — the lookup key for "Continue with Google".
    google_sub: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    # Hook for a future parental-consent flow (deferred — no flow/endpoints yet).
    # Intended values: not_required | pending | granted | revoked.
    consent_status: Mapped[str] = mapped_column(
        String, nullable=False, default="not_required", server_default="not_required"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # passive_deletes=True on all five: let the DB apply each FK's own ON DELETE
    # rule (CASCADE for enrollments, SET NULL for the four history tables) rather
    # than the ORM eagerly loading every child and nulling/deleting them in Python.
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="student", passive_deletes=True)
    confusion_signals: Mapped[list["ConfusionSignal"]] = relationship(back_populates="student", passive_deletes=True)
    current_skills: Mapped[list["CurrentSkill"]] = relationship(back_populates="student", passive_deletes=True)
    tutor_sessions: Mapped[list["TutorSession"]] = relationship(back_populates="student", passive_deletes=True)
    questions: Mapped[list["Question"]] = relationship(back_populates="student", passive_deletes=True)
