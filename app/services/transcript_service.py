import logging

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.recording import Recording
from app.models.transcript_chunk import TranscriptChunk
from app.services.transcription import get_transcription_service
from app.services.video import get_video_service

logger = logging.getLogger(__name__)


def get_transcript_for_lesson(db: Session, lesson_id: int) -> list:
    return (
        db.query(TranscriptChunk)
        .filter(TranscriptChunk.lesson_id == lesson_id)
        .order_by(TranscriptChunk.start_offset_seconds)
        .all()
    )


def run_transcription_job(recording_id: int) -> None:
    """Runs off the request/response cycle via FastAPI's BackgroundTasks.
    A real deployment would hand this off to a proper task queue
    (Celery/RQ/etc.) instead — BackgroundTasks is a deliberate capstone-scale
    choice here, not a production pattern.

    Opens its own DB session since it outlives the request that triggered it.
    The except clause below covers in-process failures (a bad vendor
    response, a network error) and always resolves to "transcribed" or
    "failed" — but it can't cover a process crash/restart mid-job: if the
    app dies between the "transcribing" commit and the final commit, that
    recording is left stuck at "transcribing" with no code path to notice or
    retry it. Known capstone-scale gap; no reconciliation job exists for it."""
    db = SessionLocal()
    try:
        recording = db.get(Recording, recording_id)
        if recording is None:
            return

        recording.status = "transcribing"
        db.commit()

        access_link = get_video_service().get_recording_access_link(recording.provider_recording_id)
        segments = get_transcription_service().transcribe(access_link)

        for segment in segments:
            db.add(
                TranscriptChunk(
                    lesson_id=recording.lesson_id,
                    recording_id=recording.recording_id,
                    text=segment.text,
                    start_offset_seconds=segment.start_seconds,
                    end_offset_seconds=segment.end_seconds,
                )
            )
        recording.status = "transcribed"
        db.commit()
    except Exception:
        logger.exception("Transcription failed for recording %s", recording_id)
        db.rollback()
        recording = db.get(Recording, recording_id)
        if recording is not None:
            recording.status = "failed"
            db.commit()
    finally:
        db.close()
