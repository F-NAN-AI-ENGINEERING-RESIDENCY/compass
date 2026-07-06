from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CurrentSkill(Base):
    __tablename__ = "current_skills"
    __table_args__ = (
        CheckConstraint("mastery_level >= 0 AND mastery_level <= 1", name="ck_current_skills_mastery_range"),
        # Mastery is scoped per class: the same topic in two of a student's
        # classes is tracked independently, so a class dashboard's average
        # never shifts from that student's activity in an unrelated class.
        UniqueConstraint("student_id", "class_id", "topic_id", name="uq_current_skills_student_class_topic"),
        # Backs the dashboard's per-class, per-topic aggregation across a class roster.
        Index("ix_current_skills_class_topic", "class_id", "topic_id"),
    )

    skill_id: Mapped[int] = mapped_column(primary_key=True)
    # Nullable + SET NULL so a deleted student's mastery history still counts
    # toward past class aggregates instead of vanishing outright.
    student_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("students.student_id", ondelete="SET NULL"), nullable=True
    )
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.class_id", ondelete="CASCADE"), nullable=False)
    topic_id: Mapped[int] = mapped_column(ForeignKey("skill_topics.topic_id", ondelete="RESTRICT"), nullable=False)
    mastery_level: Mapped[Decimal] = mapped_column(Numeric(3, 2), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    student: Mapped[Optional["Student"]] = relationship(back_populates="current_skills")
    class_: Mapped["Class"] = relationship(back_populates="current_skills")
    topic: Mapped["SkillTopic"] = relationship(back_populates="current_skills")
