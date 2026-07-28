from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser, get_db, require_teacher
from app.schemas.recordings import RecordingAccessLinkResponse, RecordingResponse
from app.services import auth_service, lesson_service, recording_service
from app.services.video import VideoService, get_video_service

router = APIRouter(prefix="/api", tags=["recordings"])


def _to_response(recording) -> RecordingResponse:
    return RecordingResponse(
        recording_id=recording.recording_id,
        lesson_id=recording.lesson_id,
        status=recording.status,
        duration_seconds=recording.duration_seconds,
        created_at=recording.created_at,
    )


@router.get("/lessons/{lesson_id}/recordings", response_model=list[RecordingResponse])
def list_recordings(
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
    recordings = recording_service.list_recordings_for_lesson(db, lesson_id)
    return [_to_response(recording) for recording in recordings]


@router.get("/recordings/{recording_id}/access-link", response_model=RecordingAccessLinkResponse)
def get_access_link(
    recording_id: int,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
    video_service: VideoService = Depends(get_video_service),
) -> RecordingAccessLinkResponse:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        recording = recording_service.get_recording_or_404(db, recording_id)
        lesson = lesson_service.get_lesson_or_404(db, recording.lesson_id)
        lesson_service.assert_teacher_owns_lesson(lesson, teacher_id)
    except recording_service.RecordingNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except lesson_service.NotLessonOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    link = video_service.get_recording_access_link(recording.provider_recording_id)
    return RecordingAccessLinkResponse(access_link=link)
