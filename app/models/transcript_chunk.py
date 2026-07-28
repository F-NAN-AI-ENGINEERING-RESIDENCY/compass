from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"
    __table_args__ = (
        # Backs GET .../transcript's ordered-by-offset read for a lesson.
        Index("ix_transcript_chunks_lesson_start", "lesson_id", "start_offset_seconds"),
    )

    chunk_id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.lesson_id", ondelete="CASCADE"), nullable=False)
    recording_id: Mapped[int] = mapped_column(
        ForeignKey("recordings.recording_id", ondelete="CASCADE"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    # Relative to the recording's start, not wall-clock time — this is what
    # Whisper's segments return, and it's what lets these line up cleanly
    # against confusion-signal timestamps later.
    start_offset_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    end_offset_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    lesson: Mapped["Lesson"] = relationship(back_populates="transcript_chunks")
    recording: Mapped["Recording"] = relationship(back_populates="transcript_chunks")
