from datetime import datetime, timedelta, timezone

import app.services.lesson_scheduler as lesson_scheduler_module
from app.services import lesson_scheduler
from app.services.video import FakeVideoService

NOW = datetime(2026, 7, 22, 12, 0, 0, tzinfo=timezone.utc)


class _NonClosingSession:
    """See tests/routers/test_webhooks.py's _NonClosingSession for why this
    is needed: check_for_inactive_lessons deliberately opens its own
    SessionLocal() (the real, production-correct pattern for code that runs
    outside a request), but the test's db_session fixture only makes its
    writes visible within one never-committed outer transaction — a real
    second connection wouldn't see them, and a real close() would expunge
    the fixture objects this test still holds."""

    def __init__(self, session):
        self._session = session

    def __getattr__(self, name):
        return getattr(self._session, name)

    def close(self):
        pass


def test_check_for_inactive_lessons_ends_stale_lesson(
    client, db_session, make_teacher, make_class, make_lesson, monkeypatch
):
    # `client` isn't called directly: entering it binds the WS manager's
    # event loop (app startup), which the "ended" transition's
    # broadcast_and_close needs even when reached via the scheduler instead
    # of an HTTP request.
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_, status="live")
    lesson.video_room_id = "room-stale"
    lesson.started_at = NOW - timedelta(minutes=30)
    lesson.last_activity_at = NOW - timedelta(minutes=30)
    db_session.commit()

    monkeypatch.setattr(lesson_scheduler_module, "SessionLocal", lambda: _NonClosingSession(db_session))
    monkeypatch.setattr(lesson_scheduler_module, "datetime", _FixedDatetime)
    monkeypatch.setattr(lesson_scheduler_module, "get_video_service", lambda: FakeVideoService())

    lesson_scheduler.check_for_inactive_lessons()

    db_session.refresh(lesson)
    assert lesson.status == "ended"


def test_check_for_inactive_lessons_leaves_fresh_lesson_live(
    db_session, make_teacher, make_class, make_lesson, monkeypatch
):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_, status="live")
    lesson.video_room_id = "room-fresh"
    lesson.started_at = NOW - timedelta(minutes=2)
    lesson.last_activity_at = NOW - timedelta(minutes=2)
    db_session.commit()

    monkeypatch.setattr(lesson_scheduler_module, "SessionLocal", lambda: _NonClosingSession(db_session))
    monkeypatch.setattr(lesson_scheduler_module, "datetime", _FixedDatetime)
    monkeypatch.setattr(lesson_scheduler_module, "get_video_service", lambda: FakeVideoService())

    lesson_scheduler.check_for_inactive_lessons()

    db_session.refresh(lesson)
    assert lesson.status == "live"


class _FixedDatetime(datetime):
    @classmethod
    def now(cls, tz=None):
        return NOW
