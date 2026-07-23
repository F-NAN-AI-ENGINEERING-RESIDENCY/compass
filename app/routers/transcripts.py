from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser, get_db, require_teacher
from app.schemas.transcripts import TranscriptChunkResponse
from app.services import auth_service, lesson_service, transcript_service

router = APIRouter(prefix="/api/lessons", tags=["transcripts"])


def _to_response(chunk) -> TranscriptChunkResponse:
    return TranscriptChunkResponse(
        chunk_id=chunk.chunk_id,
        text=chunk.text,
        start_offset_seconds=chunk.start_offset_seconds,
        end_offset_seconds=chunk.end_offset_seconds,
    )


@router.get("/{lesson_id}/transcript", response_model=list[TranscriptChunkResponse])
def get_transcript(
    lesson_id: int,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> list:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        lesson = lesson_service.get_lesson_or_404(db, lesson_id)
        lesson_service.assert_teacher_owns_lesson(lesson, teacher_id)
    except lesson_service.LessonNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except lesson_service.NotLessonOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    chunks = transcript_service.get_transcript_for_lesson(db, lesson_id)
    return [_to_response(chunk) for chunk in chunks]
