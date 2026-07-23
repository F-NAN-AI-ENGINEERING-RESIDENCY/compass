import base64
import hashlib
import hmac
import json

import pytest

from app.config import settings
from app.models.recording import Recording

WEBHOOK_SECRET_B64 = base64.b64encode(b"test-daily-webhook-secret-000000").decode()


@pytest.fixture(autouse=True)
def _daily_webhook_secret(monkeypatch):
    monkeypatch.setattr(settings, "daily_webhook_secret", WEBHOOK_SECRET_B64)


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
    assert recording.status == "ready"
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
