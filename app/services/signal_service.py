import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.confusion_signal import ConfusionSignal
from app.models.current_skill import CurrentSkill
from app.models.skill_topic import SkillTopic
from app.services.lesson_service import (  # noqa: F401 (re-exported for router use)
    LessonNotFoundError,
    LessonNotLiveError,
    NotEnrolledError,
    NotLessonOwnerError,
    assert_student_enrolled,
    assert_teacher_owns_lesson,
    get_lesson_or_404,
)
from app.websockets.broadcaster import broadcast


class SignalNotFoundError(Exception):
    pass


def _get_signal_or_404(db: Session, lesson_id: int, public_id: uuid.UUID) -> ConfusionSignal:
    signal = (
        db.query(ConfusionSignal)
        .filter(ConfusionSignal.lesson_id == lesson_id, ConfusionSignal.public_id == public_id)
        .first()
    )
    if signal is None:
        raise SignalNotFoundError(f"Signal {public_id} not found on lesson {lesson_id}")
    return signal


def create_signal(db: Session, lesson_id: int, student_id: int) -> ConfusionSignal:
    lesson = get_lesson_or_404(db, lesson_id)
    assert_student_enrolled(db, lesson, student_id)
    if lesson.status != "live":
        raise LessonNotLiveError("Lesson is not live")

    signal = ConfusionSignal(lesson_id=lesson_id, student_id=student_id)
    db.add(signal)
    db.commit()
    db.refresh(signal)

    signal_payload = {"signalId": str(signal.public_id), "lessonId": lesson_id, "createdAt": signal.created_at.isoformat(), "status": signal.status}
    broadcast(lesson_id, "signal.created", {**signal_payload, "studentId": student_id})
    broadcast(lesson_id, "signal.ack", {"signalId": str(signal.public_id), "status": signal.status})
    return signal


def update_signal_status(
    db: Session, lesson_id: int, public_id: uuid.UUID, new_status: str, teacher_id: int
) -> ConfusionSignal:
    lesson = get_lesson_or_404(db, lesson_id)
    assert_teacher_owns_lesson(lesson, teacher_id)
    signal = _get_signal_or_404(db, lesson_id, public_id)

    signal.status = new_status
    db.commit()
    db.refresh(signal)

    broadcast(
        lesson_id,
        "signal.updated",
        {"signalId": str(signal.public_id), "status": signal.status, "updatedAt": signal.updated_at.isoformat()},
    )
    return signal


def delete_signal(db: Session, lesson_id: int, public_id: uuid.UUID, teacher_id: int) -> None:
    lesson = get_lesson_or_404(db, lesson_id)
    assert_teacher_owns_lesson(lesson, teacher_id)
    signal = _get_signal_or_404(db, lesson_id, public_id)
    db.delete(signal)
    db.commit()


def get_dashboard(db: Session, lesson_id: int, teacher_id: int, since: Optional[datetime] = None) -> dict:
    lesson = get_lesson_or_404(db, lesson_id)
    assert_teacher_owns_lesson(lesson, teacher_id)

    open_signal_count = (
        db.query(func.count(ConfusionSignal.signal_id))
        .filter(ConfusionSignal.lesson_id == lesson_id, ConfusionSignal.status == "open")
        .scalar()
    )

    signals_query = db.query(ConfusionSignal).filter(ConfusionSignal.lesson_id == lesson_id)
    if since is not None:
        # Resync case: catch both newly created signals and status changes
        # made while the client was disconnected, not just new ones.
        signals_query = signals_query.filter(
            (ConfusionSignal.created_at > since) | (ConfusionSignal.updated_at > since)
        )
    else:
        signals_query = signals_query.filter(ConfusionSignal.status == "open")
    signals = signals_query.order_by(ConfusionSignal.created_at).all()

    skill_rows = (
        db.query(
            SkillTopic.topic_id,
            SkillTopic.name,
            func.avg(CurrentSkill.mastery_level),
            func.count(CurrentSkill.skill_id).filter(CurrentSkill.mastery_level < lesson.class_.alert_threshold),
        )
        .join(CurrentSkill, CurrentSkill.topic_id == SkillTopic.topic_id)
        .filter(CurrentSkill.class_id == lesson.class_id)
        .group_by(SkillTopic.topic_id, SkillTopic.name)
        .all()
    )

    return {
        "lesson_id": lesson_id,
        "open_signal_count": open_signal_count,
        "signals": signals,
        "skill_snapshot": skill_rows,
    }
