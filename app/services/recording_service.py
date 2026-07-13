import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.lesson import Lesson
from app.models.recording import Recording

logger = logging.getLogger(__name__)


class RecordingNotFoundError(Exception):
    pass


def upsert_recording_from_webhook(db: Session, payload: dict) -> Optional[Recording]:
    """Persists a Daily "recording.ready-to-download" event. Idempotent: a
    repeat delivery for a provider_recording_id we've already stored is a
    no-op, so it never regresses a recording whose transcription has since
    progressed past "ready"."""
    room_name = payload.get("room_name")
    provider_recording_id = payload.get("recording_id")

    existing = (
        db.query(Recording).filter(Recording.provider_recording_id == provider_recording_id).first()
    )
    if existing is not None:
        return existing

    lesson = db.query(Lesson).filter(Lesson.video_room_id == room_name).first()
    if lesson is None:
        logger.info("Daily webhook for unrecognized room %r; ignoring", room_name)
        return None

    recording = Recording(
        lesson_id=lesson.lesson_id,
        provider_recording_id=provider_recording_id,
        status="ready",
        duration_seconds=payload.get("duration"),
    )
    db.add(recording)
    db.commit()
    db.refresh(recording)
    return recording


def list_recordings_for_lesson(db: Session, lesson_id: int) -> list:
    return (
        db.query(Recording)
        .filter(Recording.lesson_id == lesson_id, Recording.is_active.is_(True))
        .order_by(Recording.created_at)
        .all()
    )


def get_recording_or_404(db: Session, recording_id: int) -> Recording:
    recording = (
        db.query(Recording)
        .filter(Recording.recording_id == recording_id, Recording.is_active.is_(True))
        .first()
    )
    if recording is None:
        raise RecordingNotFoundError(f"Recording {recording_id} not found")
    return recording
