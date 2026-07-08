import secrets
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Excludes 0/O, 1/I/L — codes get read aloud/typed by students joining a class.
_JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
_JOIN_CODE_LENGTH = 7


def generate_join_code() -> str:
    return "".join(secrets.choice(_JOIN_CODE_ALPHABET) for _ in range(_JOIN_CODE_LENGTH))


class Class(Base):
    __tablename__ = "classes"
    __table_args__ = (
        CheckConstraint("alert_threshold >= 0 AND alert_threshold <= 1", name="ck_classes_alert_threshold_range"),
    )

    class_id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(
        ForeignKey("teachers.teacher_id", ondelete="RESTRICT"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    # Shareable code (also usable as a join-link slug) students use to
    # self-enroll. This default covers any code path that creates a Class;
    # app.services.class_service.generate_unique_join_code layers an explicit
    # DB collision check on top of the same alphabet for a future real
    # class-creation endpoint (none exists yet — see contract gaps).
    join_code: Mapped[str] = mapped_column(
        String(_JOIN_CODE_LENGTH), unique=True, nullable=False, index=True, default=generate_join_code
    )
    # Per-class mastery cutoff behind the dashboard's studentsBelowThreshold count.
    alert_threshold: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), nullable=False, default=Decimal("0.50"), server_default="0.50"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    teacher: Mapped["Teacher"] = relationship(back_populates="classes")
    # passive_deletes=True alongside delete-orphan: the DB's own ON DELETE CASCADE
    # does the actual row removal in bulk; the ORM cascade only governs in-Python
    # orphan handling (e.g. removing a lesson from class_.lessons).
    enrollments: Mapped[list["Enrollment"]] = relationship(
        back_populates="class_", cascade="all, delete-orphan", passive_deletes=True
    )
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="class_", cascade="all, delete-orphan", passive_deletes=True
    )
    current_skills: Mapped[list["CurrentSkill"]] = relationship(
        back_populates="class_", cascade="all, delete-orphan", passive_deletes=True
    )
