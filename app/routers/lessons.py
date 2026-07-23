from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser, get_current_user, get_db, require_teacher
from app.schemas.lessons import LessonCreateRequest, LessonResponse, LessonStatusUpdateRequest, VideoTokenResponse
from app.services import auth_service, class_service, lesson_service
from app.services.video import VideoProvisioningError, VideoService, get_video_service

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


def _to_lesson_response(lesson) -> LessonResponse:
    return LessonResponse(
        lesson_id=lesson.lesson_id,
        class_id=lesson.class_id,
        status=lesson.status,
        started_at=lesson.started_at,
        ended_at=lesson.ended_at,
    )


@router.post("", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_lesson(
    payload: LessonCreateRequest,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> LessonResponse:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        class_ = class_service.get_class_or_404(db, payload.class_id)
        class_service.assert_teacher_owns_class(class_, teacher_id)
    except class_service.ClassNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except class_service.NotClassOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    lesson = lesson_service.create_lesson(db, payload.class_id, payload.title, payload.scheduled_at)
    return _to_lesson_response(lesson)


@router.get("/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    lesson_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LessonResponse:
    # No ownership/enrollment check: the contract documents only 401/404 for
    # this endpoint — it's a low-sensitivity read used to confirm a lesson is
    # live before opening a socket, not gated like the dashboard is.
    try:
        lesson = lesson_service.get_lesson_or_404(db, lesson_id)
    except lesson_service.LessonNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return _to_lesson_response(lesson)


@router.patch("/{lesson_id}", response_model=LessonResponse)
def update_lesson_status(
    lesson_id: int,
    payload: LessonStatusUpdateRequest,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
    video_service: VideoService = Depends(get_video_service),
) -> LessonResponse:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        lesson = lesson_service.get_lesson_or_404(db, lesson_id)
        lesson_service.assert_teacher_owns_lesson(lesson, teacher_id)
        lesson = lesson_service.transition_lesson_status(db, lesson, payload.status.value, video_service)
    except lesson_service.LessonNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except lesson_service.NotLessonOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except lesson_service.InvalidLessonTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except VideoProvisioningError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    return _to_lesson_response(lesson)


@router.get("/{lesson_id}/video-token", response_model=VideoTokenResponse)
def get_video_token(
    lesson_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    video_service: VideoService = Depends(get_video_service),
) -> VideoTokenResponse:
    user_id = auth_service.user_id_of(current_user.principal)
    try:
        lesson = lesson_service.get_lesson_or_404(db, lesson_id)
        token, room_url = lesson_service.get_video_token_for_user(
            db, lesson, user_id, current_user.role.value, video_service
        )
    except lesson_service.LessonNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (lesson_service.NotLessonOwnerError, lesson_service.NotEnrolledError) as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except lesson_service.LessonNotLiveError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return VideoTokenResponse(
        room_id=lesson.video_room_id, room_url=room_url, provider=lesson.video_provider, token=token
    )
