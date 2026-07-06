from datetime import datetime
from typing import Optional

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

QUESTION_STATUSES = ("pending", "sent_individually", "addressed_to_class")


class Question(Base):
    __tablename__ = "questions"
    __table_args__ = (
        CheckConstraint(f"status IN {QUESTION_STATUSES}", name="ck_questions_status"),
    )

    question_id: Mapped[int] = mapped_column(primary_key=True)
    # Nullable + SET NULL so a deleted student's question history survives for
    # class-level "what caused confusion" trend analysis.
    student_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("students.student_id", ondelete="SET NULL"), nullable=True
    )
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.lesson_id", ondelete="CASCADE"), nullable=False)
    cluster_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("question_clusters.cluster_id", ondelete="SET NULL"), nullable=True
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    ai_drafted_response: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending", server_default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    student: Mapped[Optional["Student"]] = relationship(back_populates="questions")
    lesson: Mapped["Lesson"] = relationship(back_populates="questions")
    cluster: Mapped[Optional["QuestionCluster"]] = relationship(back_populates="questions")
