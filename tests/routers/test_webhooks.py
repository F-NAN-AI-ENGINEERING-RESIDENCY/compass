import base64
import hashlib
import hmac
import json

import pytest

import app.services.transcript_service as transcript_service_module
from app.config import settings
from app.models.recording import Recording
from app.models.transcript_chunk import TranscriptChunk
from tests.conftest import auth_header

WEBHOOK_SECRET_B64 = base64.b64encode(b"test-daily-webhook-secret-000000").decode()


@pytest.fixture(autouse=True)
def _daily_webhook_secret(monkeypatch):
    monkeypatch.setattr(settings, "daily_webhook_secret", WEBHOOK_SECRET_B64)


class _NonClosingSession:
    """Forwards everything to the wrapped Session except close(). The job
    under test always calls db.close() in its finally block (correct in
    production); here it wraps the shared test db_session, and a real
    close() would expunge() every fixture object the rest of the test still
    holds a reference to (make_teacher's teacher, make_lesson's lesson,
    ...), detaching them mid-test."""

    def __init__(self, session):
        self._session = session

    def __getattr__(self, name):
        return getattr(self._session, name)

    def close(self):
        pass


@pytest.fixture(autouse=True)
def _background_job_uses_test_session(monkeypatch, db_session):
    """run_transcription_job() deliberately opens its own SessionLocal() —
    the request-scoped `db` dependency is already torn down by FastAPI's
    exit-stack before BackgroundTasks execute, so that's the only correct
    production pattern. But this test suite's db_session fixture (see
    conftest.py) keeps every write inside one never-committed OUTER
    transaction on a single connection; a real second connection could
    never see it. Point the job at the test's own session instead.

    Why this is safe: conftest's db_session fixture is SQLAlchemy's standard
    "join a session into an external transaction" recipe — it opens one
    Connection, begins the outer transaction that's rolled back at test
    teardown (never committed), and begins a SAVEPOINT (`begin_nested()`) on
    top of it. Every `db.commit()` the app code calls (including this job's)
    only commits/releases that SAVEPOINT; a `session.after_transaction_end`
    listener immediately opens a fresh SAVEPOINT so the next commit has one
    to land on. The outer transaction itself is never touched by application
    code, so nothing the job commits or rolls back can escape the test.
    (The failure-path test's rollback()+commit() sequence exercises exactly
    this — it lands on/releases SAVEPOINTs, never the outer transaction.)

    The one thing this recipe does NOT make safe on its own is close(): a
    real Session.close() calls expunge_all(), detaching every fixture
    object the rest of the test still holds (make_teacher's teacher,
    make_lesson's lesson, ...) even though the connection/transaction is
    untouched. Hence _NonClosingSession above — it wraps the shared
    db_session and no-ops close() so TestClient's synchronous background-task
    execution can be observed without detaching those objects mid-test."""
    monkeypatch.setattr(transcript_service_module, "SessionLocal", lambda: _NonClosingSession(db_session))


def _sign(body: bytes, timestamp: str, secret_b64: str = WEBHOOK_SECRET_B64) -> str:
    secret = base64.b64decode(secret_b64)
    signed_content = f"{timestamp}.{body.decode('utf-8')}".encode("utf-8")
    return base64.b64encode(hmac.new(secret, signed_content, hashlib.sha256).digest()).decode("utf-8")


def _recording_ready_event(room_name: str, recording_id: str = "rec-1", duration: int = 300) -> bytes:
    return json.dumps(
        {
            "version": "1",
            "type": "recording.ready-to-download",
            "id": "evt-1",
            "event_ts": 1234567890,
            "payload": {
                "recording_id": recording_id,
                "room_name": room_name,
                "start_ts": 1234567000,
                "status": "finished",
                "max_participants": 2,
                "duration": duration,
                "s3_key": "some/key.mp4",
            },
        }
    ).encode("utf-8")


def _post_webhook(client, body: bytes, timestamp: str = "1234567999", signature: str = None, secret: str = None):
    sig = signature if signature is not None else _sign(body, timestamp, secret or WEBHOOK_SECRET_B64)
    return client.post(
        "/api/webhooks/daily",
        content=body,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Timestamp": timestamp,
            "X-Webhook-Signature": sig,
        },
    )


def test_valid_signature_upserts_recording(client, db_session, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    lesson.video_room_id = "room-abc"
    lesson.video_provider = "daily"
    db_session.commit()

    body = _recording_ready_event("room-abc")
    response = _post_webhook(client, body)

    assert response.status_code == 200, response.text
    recording = db_session.query(Recording).filter(Recording.provider_recording_id == "rec-1").first()
    assert recording is not None
    assert recording.lesson_id == lesson.lesson_id
    # TestClient runs the BackgroundTask synchronously before returning, so
    # the stub transcription pipeline has already run to completion here.
    assert recording.status == "transcribed"
    assert recording.duration_seconds == 300


def test_invalid_signature_is_rejected(client):
    body = _recording_ready_event("room-abc")
    response = _post_webhook(client, body, signature="not-the-right-signature")
    assert response.status_code == 401


def test_missing_signature_headers_is_rejected(client):
    body = _recording_ready_event("room-abc")
    response = client.post("/api/webhooks/daily", content=body, headers={"Content-Type": "application/json"})
    assert response.status_code == 401


def test_signature_computed_with_wrong_secret_is_rejected(client):
    other_secret = base64.b64encode(b"a-completely-different-secret!!!").decode()
    body = _recording_ready_event("room-abc")
    response = _post_webhook(client, body, secret=other_secret)
    assert response.status_code == 401


def test_duplicate_webhook_delivery_is_idempotent(client, db_session, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    lesson.video_room_id = "room-abc"
    db_session.commit()

    body = _recording_ready_event("room-abc")
    first = _post_webhook(client, body)
    second = _post_webhook(client, body)

    assert first.status_code == 200
    assert second.status_code == 200
    count = db_session.query(Recording).filter(Recording.provider_recording_id == "rec-1").count()
    assert count == 1


def test_unknown_room_is_ignored_with_200(client, db_session):
    body = _recording_ready_event("room-that-does-not-exist")
    response = _post_webhook(client, body)

    assert response.status_code == 200
    assert db_session.query(Recording).filter(Recording.provider_recording_id == "rec-1").first() is None


def test_unknown_event_type_is_ignored_with_200(client):
    body = json.dumps({"type": "recording.started", "payload": {}}).encode("utf-8")
    response = _post_webhook(client, body)
    assert response.status_code == 200


def test_stub_transcription_runs_end_to_end_and_persists_ordered_chunks(
    client, db_session, make_teacher, make_class, make_lesson
):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    lesson.video_room_id = "room-tx"
    db_session.commit()
    headers = auth_header(client, "teacher", teacher.username)

    body = _recording_ready_event("room-tx", recording_id="rec-tx")
    response = _post_webhook(client, body)
    assert response.status_code == 200

    recording = db_session.query(Recording).filter(Recording.provider_recording_id == "rec-tx").first()
    db_session.refresh(recording)
    assert recording.status == "transcribed"

    transcript_response = client.get(f"/api/lessons/{lesson.lesson_id}/transcript", headers=headers)
    assert transcript_response.status_code == 200
    chunks = transcript_response.json()
    assert len(chunks) == 3
    offsets = [chunk["startOffsetSeconds"] for chunk in chunks]
    assert offsets == sorted(offsets)
    assert chunks[0]["text"] == "Let's start today's lesson on fractions."


def test_transcription_failure_sets_recording_status_failed(
    client, db_session, make_teacher, make_class, make_lesson, monkeypatch
):
    class _FailingTranscriptionService:
        def transcribe(self, audio_url):
            raise RuntimeError("openai is down")

    monkeypatch.setattr(
        transcript_service_module, "get_transcription_service", lambda: _FailingTranscriptionService()
    )

    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    lesson.video_room_id = "room-fail"
    db_session.commit()

    body = _recording_ready_event("room-fail", recording_id="rec-fail")
    response = _post_webhook(client, body)
    assert response.status_code == 200

    recording = db_session.query(Recording).filter(Recording.provider_recording_id == "rec-fail").first()
    db_session.refresh(recording)
    assert recording.status == "failed"
    assert (
        db_session.query(TranscriptChunk).filter(TranscriptChunk.recording_id == recording.recording_id).count()
        == 0
    )


def test_duplicate_webhook_does_not_retrigger_transcription_job(
    client, db_session, make_teacher, make_class, make_lesson
):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    lesson.video_room_id = "room-dup-tx"
    db_session.commit()

    body = _recording_ready_event("room-dup-tx", recording_id="rec-dup-tx")
    first = _post_webhook(client, body)
    second = _post_webhook(client, body)

    assert first.status_code == 200
    assert second.status_code == 200
    recording = db_session.query(Recording).filter(Recording.provider_recording_id == "rec-dup-tx").first()
    chunk_count = (
        db_session.query(TranscriptChunk).filter(TranscriptChunk.recording_id == recording.recording_id).count()
    )
    # If the duplicate delivery had re-triggered the job, this would be 6.
    assert chunk_count == 3
