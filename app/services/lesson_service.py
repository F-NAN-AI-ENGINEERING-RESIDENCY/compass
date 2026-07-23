import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.services.video import VideoService
from app.websockets.broadcaster import broadcast, broadcast_and_close

logger = logging.getLogger(__name__)

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


def transition_lesson_status(
    db: Session, lesson: Lesson, new_status: str, video_service: VideoService, ended_by: str = "teacher"
) -> Lesson:
    """ended_by distinguishes a teacher's PATCH request from the inactivity
    scheduler's auto-end, for logging only — it has no effect on behavior and
    isn't broadcast to clients."""
    if new_status not in _VALID_TRANSITIONS.get(lesson.status, set()):
        raise InvalidLessonTransitionError(f"Cannot transition lesson from '{lesson.status}' to '{new_status}'")

    if new_status == "live":
        room_id, provider = video_service.create_room(lesson)
        lesson.video_room_id = room_id
        lesson.video_provider = provider
        lesson.started_at = datetime.now(timezone.utc)
        # Baselined here rather than left null: a room that never receives a
        # participant webhook (e.g. no one ever actually joined) still has an
        # activity timestamp for the inactivity checker to measure against.
        lesson.last_activity_at = lesson.started_at
        lesson.status = new_status
        db.commit()
        db.refresh(lesson)
        broadcast(lesson.lesson_id, "lesson.started", {"lessonId": lesson.lesson_id, "status": lesson.status})
    elif new_status == "ended":
        if lesson.video_room_id:
            try:
                video_service.delete_room(lesson.video_room_id)
            except Exception:
                logger.exception(
                    "Failed to tear down video room %s for lesson %s; continuing to end the lesson",
                    lesson.video_room_id,
                    lesson.lesson_id,
                )
        lesson.ended_at = datetime.now(timezone.utc)
        lesson.status = new_status
        db.commit()
        db.refresh(lesson)
        logger.info(
            "Lesson %s ended by %s (last_activity_at=%s)", lesson.lesson_id, ended_by, lesson.last_activity_at
        )
        broadcast_and_close(
            lesson.lesson_id, "lesson.ended", {"lessonId": lesson.lesson_id, "status": lesson.status}
        )

    return lesson


def record_participant_activity(db: Session, room_name: str, now: datetime) -> Optional[Lesson]:
    """Bumps last_activity_at for the live lesson owning room_name, called from
    the Daily participant-joined/participant-left webhook. Returns the lesson
    if one was found and live, else None (unrecognized room, or a stray event
    for a lesson that already ended)."""
    lesson = (
        db.query(Lesson).filter(Lesson.video_room_id == room_name, Lesson.status == "live").first()
    )
    if lesson is None:
        return None
    lesson.last_activity_at = now
    db.commit()
    return lesson


def find_inactive_live_lessons(db: Session, now: datetime, timeout_minutes: int) -> List[Lesson]:
    cutoff = now - timedelta(minutes=timeout_minutes)
    return (
        db.query(Lesson)
        .filter(Lesson.status == "live", Lesson.last_activity_at < cutoff)
        .all()
    )


def end_inactive_lessons(
    db: Session, video_service: VideoService, now: datetime, timeout_minutes: int
) -> List[Lesson]:
    """Auto-ends every live lesson that's been inactive past timeout_minutes,
    reusing transition_lesson_status so teardown never diverges from the
    teacher-initiated end-lesson path."""
    ended = []
    for lesson in find_inactive_live_lessons(db, now, timeout_minutes):
        ended.append(transition_lesson_status(db, lesson, "ended", video_service, ended_by="system"))
    return ended


def get_video_token_for_user(
    db: Session, lesson: Lesson, user_id: int, role: str, video_service: VideoService
) -> tuple:
    """Returns (token, room_url) for a user joining a live lesson's room."""
    if role == "teacher":
        assert_teacher_owns_lesson(lesson, user_id)
    else:
        assert_student_enrolled(db, lesson, user_id)

    if lesson.status != "live" or not lesson.video_room_id:
        raise LessonNotLiveError("Lesson is not live")

    token = video_service.create_join_token(lesson.video_room_id, user_id, role)
    room_url = video_service.get_room_url(lesson.video_room_id)
    return token, room_url
