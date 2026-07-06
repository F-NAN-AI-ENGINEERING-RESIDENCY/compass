from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class QuestionCluster(Base):
    __tablename__ = "question_clusters"

    cluster_id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.lesson_id", ondelete="CASCADE"), nullable=False)
    representative_text: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    lesson: Mapped["Lesson"] = relationship(back_populates="question_clusters")
    questions: Mapped[list["Question"]] = relationship(back_populates="cluster", passive_deletes=True)
