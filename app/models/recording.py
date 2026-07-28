from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

RECORDING_STATUSES = ("ready", "transcribing", "transcribed", "failed")


class Recording(Base):
    __tablename__ = "recordings"
    __table_args__ = (
        CheckConstraint(f"status IN {RECORDING_STATUSES}", name="ck_recordings_status"),
    )

    recording_id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(
        ForeignKey("lessons.lesson_id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Daily's recording id. Webhook deliveries can repeat, so this is unique
    # and is the key we upsert on.
    provider_recording_id: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="ready", server_default="ready")
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    lesson: Mapped["Lesson"] = relationship(back_populates="recordings")
    transcript_chunks: Mapped[list["TranscriptChunk"]] = relationship(
        back_populates="recording", cascade="all, delete-orphan", passive_deletes=True
    )
