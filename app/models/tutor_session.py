from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TutorSession(Base):
    __tablename__ = "tutor_sessions"

    session_id: Mapped[int] = mapped_column(primary_key=True)
    # Nullable + SET NULL so a deleted student's tutoring history survives for
    # aggregate progress tracking, consistent with the other history tables.
    student_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("students.student_id", ondelete="SET NULL"), nullable=True
    )
    # Optional link to the lesson it grew out of; SET NULL rather than blocking
    # (or silently cascading) a lesson delete when a tutor session references it.
    lesson_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("lessons.lesson_id", ondelete="SET NULL"), nullable=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    student: Mapped[Optional["Student"]] = relationship(back_populates="tutor_sessions")
    lesson: Mapped[Optional["Lesson"]] = relationship(back_populates="tutor_sessions")
    messages: Mapped[list["TutorMessage"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", passive_deletes=True
    )
