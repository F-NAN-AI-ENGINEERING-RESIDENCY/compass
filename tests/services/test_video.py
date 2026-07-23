import httpx
import pytest
import respx

import app.services.video as video_module
from app.services.video import DailyVideoService, FakeVideoService, VideoProvisioningError


@pytest.fixture(autouse=True)
def _reset_video_service_singleton():
    """get_video_service() memoizes into a module global; each test that
    touches provider selection needs a clean slate, and must not leak its
    choice into unrelated tests running after it."""
    original = video_module._video_service
    video_module._video_service = None
    yield
    video_module._video_service = original


def test_get_video_service_defaults_to_fake(monkeypatch):
    monkeypatch.setattr(video_module.settings, "video_provider", "stub")

    assert isinstance(video_module.get_video_service(), FakeVideoService)


def test_get_video_service_uses_daily_when_configured(monkeypatch):
    monkeypatch.setattr(video_module.settings, "video_provider", "daily")
    monkeypatch.setattr(video_module.settings, "daily_api_key", "test-key")

    assert isinstance(video_module.get_video_service(), DailyVideoService)


def test_get_video_service_requires_api_key_for_daily(monkeypatch):
    monkeypatch.setattr(video_module.settings, "video_provider", "daily")
    monkeypatch.setattr(video_module.settings, "daily_api_key", None)

    with pytest.raises(RuntimeError):
        video_module.get_video_service()


class _FakeLesson:
    def __init__(self, lesson_id=1):
        self.lesson_id = lesson_id


@respx.mock
def test_create_room_requests_private_recording_enabled_room():
    route = respx.post("https://api.daily.co/v1/rooms").mock(
        return_value=httpx.Response(200, json={"name": "abc123", "url": "https://fake.daily.co/abc123"})
    )
    service = DailyVideoService(api_key="test-key")

    room_id, provider = service.create_room(_FakeLesson())

    assert room_id == "abc123"
    assert provider == "daily"
    sent_body = route.calls.last.request.content
    import json

    payload = json.loads(sent_body)
    assert payload["privacy"] == "private"
    assert payload["properties"]["enable_recording"] == "cloud"
    assert payload["properties"]["exp"] > 0


@respx.mock
def test_create_room_raises_video_provisioning_error_on_daily_failure():
    respx.post("https://api.daily.co/v1/rooms").mock(return_value=httpx.Response(500, json={"error": "boom"}))
    service = DailyVideoService(api_key="test-key")

    with pytest.raises(VideoProvisioningError):
        service.create_room(_FakeLesson())


@respx.mock
def test_delete_room_calls_daily_delete():
    route = respx.delete("https://api.daily.co/v1/rooms/abc123").mock(return_value=httpx.Response(200, json={}))
    service = DailyVideoService(api_key="test-key")

    service.delete_room("abc123")

    assert route.called


@respx.mock
def test_delete_room_ignores_already_gone_room():
    respx.delete("https://api.daily.co/v1/rooms/abc123").mock(return_value=httpx.Response(404, json={}))
    service = DailyVideoService(api_key="test-key")

    service.delete_room("abc123")  # should not raise


@respx.mock
def test_delete_room_raises_on_other_daily_errors():
    respx.delete("https://api.daily.co/v1/rooms/abc123").mock(return_value=httpx.Response(500, json={}))
    service = DailyVideoService(api_key="test-key")

    with pytest.raises(httpx.HTTPStatusError):
        service.delete_room("abc123")


@respx.mock
def test_create_join_token_marks_teacher_as_owner():
    route = respx.post("https://api.daily.co/v1/meeting-tokens").mock(
        return_value=httpx.Response(200, json={"token": "tok-123"})
    )
    service = DailyVideoService(api_key="test-key")

    token = service.create_join_token("abc123", user_id=5, role="teacher")

    assert token == "tok-123"
    import json

    payload = json.loads(route.calls.last.request.content)
    assert payload["properties"]["is_owner"] is True
    assert payload["properties"]["user_id"] == "5"


@respx.mock
def test_create_join_token_does_not_mark_student_as_owner():
    route = respx.post("https://api.daily.co/v1/meeting-tokens").mock(
        return_value=httpx.Response(200, json={"token": "tok-456"})
    )
    service = DailyVideoService(api_key="test-key")

    service.create_join_token("abc123", user_id=9, role="student")

    import json

    payload = json.loads(route.calls.last.request.content)
    assert payload["properties"]["is_owner"] is False


@respx.mock
def test_get_room_url_returns_daily_url():
    respx.get("https://api.daily.co/v1/rooms/abc123").mock(
        return_value=httpx.Response(200, json={"name": "abc123", "url": "https://fake.daily.co/abc123"})
    )
    service = DailyVideoService(api_key="test-key")

    url = service.get_room_url("abc123")

    assert url == "https://fake.daily.co/abc123"
