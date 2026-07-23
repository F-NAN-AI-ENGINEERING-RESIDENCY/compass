from datetime import datetime, timedelta, timezone

from app.services import lesson_service
from app.services.video import FakeVideoService

NOW = datetime(2026, 7, 22, 12, 0, 0, tzinfo=timezone.utc)


def _make_live(db_session, make_class, make_teacher, make_lesson, last_activity_at, room_id="room-1"):
    teacher = make_teacher(username=f"teacher-{room_id}", email=f"{room_id}@example.com")
    class_ = make_class(teacher)
    lesson = make_lesson(class_, status="live")
    lesson.video_room_id = room_id
    lesson.video_provider = "fake"
    lesson.started_at = last_activity_at
    lesson.last_activity_at = last_activity_at
    db_session.commit()
    return lesson


def test_find_inactive_live_lessons_returns_lessons_past_timeout(
    db_session, make_teacher, make_class, make_lesson
):
    stale = _make_live(db_session, make_class, make_teacher, make_lesson, NOW - timedelta(minutes=20), "room-stale")
    fresh = _make_live(db_session, make_class, make_teacher, make_lesson, NOW - timedelta(minutes=5), "room-fresh")

    inactive = lesson_service.find_inactive_live_lessons(db_session, NOW, timeout_minutes=15)

    inactive_ids = {lesson.lesson_id for lesson in inactive}
    assert stale.lesson_id in inactive_ids
    assert fresh.lesson_id not in inactive_ids


def test_find_inactive_live_lessons_ignores_non_live_lessons(db_session, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    scheduled = make_lesson(class_, status="scheduled")
    scheduled.last_activity_at = NOW - timedelta(hours=1)
    db_session.commit()

    inactive = lesson_service.find_inactive_live_lessons(db_session, NOW, timeout_minutes=15)
    assert scheduled.lesson_id not in {lesson.lesson_id for lesson in inactive}


def test_end_inactive_lessons_reuses_transition_lesson_status(
    client, db_session, make_teacher, make_class, make_lesson
):
    # `client` isn't called directly: entering it binds the WS manager's
    # event loop (app startup), which the "ended" transition's
    # broadcast_and_close needs even when reached via the service layer
    # instead of an HTTP request.
    stale = _make_live(db_session, make_class, make_teacher, make_lesson, NOW - timedelta(minutes=30))

    ended = lesson_service.end_inactive_lessons(db_session, FakeVideoService(), NOW, timeout_minutes=15)

    assert [lesson.lesson_id for lesson in ended] == [stale.lesson_id]
    db_session.refresh(stale)
    assert stale.status == "ended"
    assert stale.ended_at is not None


def test_end_inactive_lessons_leaves_active_lessons_untouched(db_session, make_teacher, make_class, make_lesson):
    fresh = _make_live(db_session, make_class, make_teacher, make_lesson, NOW - timedelta(minutes=2))

    ended = lesson_service.end_inactive_lessons(db_session, FakeVideoService(), NOW, timeout_minutes=15)

    assert ended == []
    db_session.refresh(fresh)
    assert fresh.status == "live"


def test_record_participant_activity_bumps_last_activity_at(db_session, make_teacher, make_class, make_lesson):
    lesson = _make_live(db_session, make_class, make_teacher, make_lesson, NOW - timedelta(minutes=10))

    later = NOW - timedelta(minutes=1)
    updated = lesson_service.record_participant_activity(db_session, "room-1", later)

    assert updated.lesson_id == lesson.lesson_id
    db_session.refresh(lesson)
    assert lesson.last_activity_at == later


def test_record_participant_activity_ignores_unknown_room(db_session):
    result = lesson_service.record_participant_activity(db_session, "no-such-room", NOW)
    assert result is None


def test_record_participant_activity_ignores_ended_lesson(db_session, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_, status="ended")
    lesson.video_room_id = "room-ended"
    lesson.last_activity_at = NOW - timedelta(hours=1)
    db_session.commit()

    result = lesson_service.record_participant_activity(db_session, "room-ended", NOW)

    assert result is None
    db_session.refresh(lesson)
    assert lesson.last_activity_at == NOW - timedelta(hours=1)
