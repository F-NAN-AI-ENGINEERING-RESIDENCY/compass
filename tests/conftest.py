import os

# Must happen before any `app.*` import: app.config.Settings reads DATABASE_URL
# at import time, and a real env var here takes priority over .env — this is
# what keeps the test suite off the dev database.
os.environ["DATABASE_URL"] = "postgresql+psycopg2://compass_user:compass_password@localhost:5432/compass_test_db"

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session as SQLASession

from app.auth.security import hash_password
from app.dependencies import get_db
from app.main import app
from app.models.class_ import Class
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.recording import Recording
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.transcript_chunk import TranscriptChunk
from app.services.video import FakeVideoService, get_video_service

TEST_DATABASE_URL = os.environ["DATABASE_URL"]
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

engine = create_engine(TEST_DATABASE_URL)


@pytest.fixture(scope="session", autouse=True)
def _migrated_test_db():
    """Rebuilds the test DB from a clean base via the real Alembic chain, once
    per test session — this is also what verifies `alembic upgrade head` runs
    clean on a fresh database, since that's exactly what this does."""
    cfg = Config(os.path.join(_PROJECT_ROOT, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(_PROJECT_ROOT, "alembic"))
    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")
    yield


@pytest.fixture
def db_session(_migrated_test_db):
    """One test = one outer transaction, rolled back at teardown, with a
    SAVEPOINT restarted after every inner commit — so service-layer code that
    calls db.commit() still leaves no trace once the test ends."""
    connection = engine.connect()
    outer_transaction = connection.begin()
    session = SQLASession(bind=connection)

    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, trans):
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()

    yield session

    session.close()
    outer_transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    # Belt-and-suspenders on top of DAILY_API_KEY being unset: tests never hit
    # the network even if a developer's local .env happens to set a real key.
    app.dependency_overrides[get_video_service] = lambda: FakeVideoService()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def make_teacher(db_session):
    def _make(username="teacher1", name="Teacher One", email=None, password="password123"):
        teacher = Teacher(
            username=username,
            name=name,
            email=email or f"{username}@example.com",
            password_hash=hash_password(password),
        )
        db_session.add(teacher)
        db_session.commit()
        db_session.refresh(teacher)
        return teacher

    return _make


@pytest.fixture
def make_student(db_session):
    def _make(username="student1", name="Student One", email=None, password="password123"):
        student = Student(
            username=username,
            name=name,
            email=email or f"{username}@example.com",
            password_hash=hash_password(password),
        )
        db_session.add(student)
        db_session.commit()
        db_session.refresh(student)
        return student

    return _make


@pytest.fixture
def make_class(db_session):
    def _make(teacher, name="Algebra I"):
        class_ = Class(teacher_id=teacher.teacher_id, name=name)
        db_session.add(class_)
        db_session.commit()
        db_session.refresh(class_)
        return class_

    return _make


@pytest.fixture
def make_enrollment(db_session):
    def _make(student, class_):
        enrollment = Enrollment(student_id=student.student_id, class_id=class_.class_id)
        db_session.add(enrollment)
        db_session.commit()
        db_session.refresh(enrollment)
        return enrollment

    return _make


@pytest.fixture
def make_lesson(db_session):
    def _make(class_, title="Fractions", status="scheduled"):
        lesson = Lesson(class_id=class_.class_id, title=title, status=status)
        db_session.add(lesson)
        db_session.commit()
        db_session.refresh(lesson)
        return lesson

    return _make


@pytest.fixture
def make_recording(db_session):
    def _make(lesson, provider_recording_id="rec-1", status="ready", duration_seconds=300):
        recording = Recording(
            lesson_id=lesson.lesson_id,
            provider_recording_id=provider_recording_id,
            status=status,
            duration_seconds=duration_seconds,
        )
        db_session.add(recording)
        db_session.commit()
        db_session.refresh(recording)
        return recording

    return _make


@pytest.fixture
def make_transcript_chunk(db_session):
    def _make(lesson, recording, text="Hello class", start_offset_seconds=0.0, end_offset_seconds=5.0):
        chunk = TranscriptChunk(
            lesson_id=lesson.lesson_id,
            recording_id=recording.recording_id,
            text=text,
            start_offset_seconds=start_offset_seconds,
            end_offset_seconds=end_offset_seconds,
        )
        db_session.add(chunk)
        db_session.commit()
        db_session.refresh(chunk)
        return chunk

    return _make


def auth_header(client: TestClient, role: str, username: str, password: str = "password123") -> dict:
    """Logs in through the real endpoint rather than hand-building a token, so
    tests don't care whether auth is JWT-based or session-based underneath."""
    response = client.post("/api/auth/login", json={"role": role, "username": username, "password": password})
    assert response.status_code == 200, response.text
    token = response.json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}
