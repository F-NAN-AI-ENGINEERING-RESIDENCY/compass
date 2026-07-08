from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.services.video import VideoService
from app.websockets.broadcaster import broadcast

_VALID_TRANSITIONS = {
    "scheduled": {"live"},
    "live": {"ended"},
    "ended": set(),
}


class LessonNotFoundError(Exception):
    pass


class NotLessonOwnerError(Exception):
    pass


class NotEnrolledError(Exception):
    pass


class InvalidLessonTransitionError(Exception):
    pass


class LessonNotLiveError(Exception):
    pass


def create_lesson(
    db: Session, class_id: int, title: str, scheduled_at: Optional[datetime] = None
) -> Lesson:
    lesson = Lesson(class_id=class_id, title=title, scheduled_at=scheduled_at, status="scheduled")
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


def get_lesson_or_404(db: Session, lesson_id: int) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise LessonNotFoundError(f"Lesson {lesson_id} not found")
    return lesson


def assert_teacher_owns_lesson(lesson: Lesson, teacher_id: int) -> None:
    if lesson.class_.teacher_id != teacher_id:
        raise NotLessonOwnerError("You do not own this lesson")


def assert_student_enrolled(db: Session, lesson: Lesson, student_id: int) -> None:
    enrolled = (
        db.query(Enrollment)
        .filter(Enrollment.class_id == lesson.class_id, Enrollment.student_id == student_id)
        .first()
        is not None
    )
    if not enrolled:
        raise NotEnrolledError("You are not enrolled in this lesson's class")


def transition_lesson_status(db: Session, lesson: Lesson, new_status: str, video_service: VideoService) -> Lesson:
    if new_status not in _VALID_TRANSITIONS.get(lesson.status, set()):
        raise InvalidLessonTransitionError(f"Cannot transition lesson from '{lesson.status}' to '{new_status}'")

    if new_status == "live":
        room_id, provider = video_service.create_room(lesson)
        lesson.video_room_id = room_id
        lesson.video_provider = provider
        lesson.started_at = datetime.now(timezone.utc)
        lesson.status = new_status
        db.commit()
        db.refresh(lesson)
        broadcast(lesson.lesson_id, "lesson.started", {"lessonId": lesson.lesson_id, "status": lesson.status})
    elif new_status == "ended":
        if lesson.video_room_id:
            video_service.delete_room(lesson.video_room_id)
        lesson.ended_at = datetime.now(timezone.utc)
        lesson.status = new_status
        db.commit()
        db.refresh(lesson)
        broadcast(lesson.lesson_id, "lesson.ended", {"lessonId": lesson.lesson_id, "status": lesson.status})

    return lesson


def get_video_token_for_user(
    db: Session, lesson: Lesson, user_id: int, role: str, video_service: VideoService
) -> str:
    if role == "teacher":
        assert_teacher_owns_lesson(lesson, user_id)
    else:
        assert_student_enrolled(db, lesson, user_id)

    if lesson.status != "live" or not lesson.video_room_id:
        raise LessonNotLiveError("Lesson is not live")

    return video_service.create_join_token(lesson.video_room_id, user_id, role)
