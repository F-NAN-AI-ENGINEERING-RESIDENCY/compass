import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

SIGNAL_STATUSES = ("open", "acknowledged", "resolved")


class ConfusionSignal(Base):
    __tablename__ = "confusion_signals"
    __table_args__ = (
        CheckConstraint(f"status IN {SIGNAL_STATUSES}", name="ck_confusion_signals_status"),
        # Backs the dashboard's per-lesson open-signal list/count and its ?since= resync filter.
        Index("ix_confusion_signals_lesson_status_created", "lesson_id", "status", "created_at"),
        # Backs abuse-handling lookups ("how many signals has this student sent").
        Index("ix_confusion_signals_student_id", "student_id"),
    )

    signal_id: Mapped[int] = mapped_column(primary_key=True)
    # Opaque id exposed to clients as `signalId`. Kept separate from the internal
    # serial PK so consecutive taps can't be diffed to infer platform-wide signal volume.
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4
    )
    # Required: the teacher always sees who sent a signal (anonymity is from
    # classmates only, enforced at the API layer, never from the teacher/DB).
    # RESTRICT rather than CASCADE/SET NULL — accounts are soft-delete only
    # (is_active flag, no hard-delete endpoint), so this is a defensive choice
    # protecting signal history from an out-of-band hard delete, not a path
    # the app itself ever exercises.
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.student_id", ondelete="RESTRICT"), nullable=False
    )
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.lesson_id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="open", server_default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    student: Mapped["Student"] = relationship(back_populates="confusion_signals")
    lesson: Mapped["Lesson"] = relationship(back_populates="confusion_signals")
