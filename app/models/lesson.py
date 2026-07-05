from datetime import datetime
from typing import Optional

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

LESSON_STATUSES = ("scheduled", "live", "ended")


class Lesson(Base):
    __tablename__ = "lessons"
    __table_args__ = (
        CheckConstraint(f"status IN {LESSON_STATUSES}", name="ck_lessons_status"),
    )

    lesson_id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.class_id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    # Set when status transitions to "live" (via the Zoom widget's start action
    # or its meeting-started event) — distinct from scheduled_at, the planned time.
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    # Set when status transitions to "ended" (explicit end action, the Zoom SDK's
    # meeting-ended/host-left event, or the server-side max-duration backstop).
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String, nullable=False, default="scheduled", server_default="scheduled")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    class_: Mapped["Class"] = relationship(back_populates="lessons")
    confusion_signals: Mapped[list["ConfusionSignal"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan", passive_deletes=True
    )
    # No delete-orphan: tutor_sessions.lesson_id is SET NULL on lesson delete,
    # sessions are never deleted just because their lesson link is dropped.
    tutor_sessions: Mapped[list["TutorSession"]] = relationship(back_populates="lesson", passive_deletes=True)
    questions: Mapped[list["Question"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan", passive_deletes=True
    )
    question_clusters: Mapped[list["QuestionCluster"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan", passive_deletes=True
    )
