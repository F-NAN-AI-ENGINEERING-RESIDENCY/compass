from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

import httpx

from app.config import settings

if TYPE_CHECKING:
    from app.models.lesson import Lesson

DAILY_API_BASE = "https://api.daily.co/v1"


class VideoService(ABC):
    @abstractmethod
    def create_room(self, lesson: "Lesson") -> tuple:
        """Creates a room for a lesson going live. Returns (room_id, provider)."""

    @abstractmethod
    def delete_room(self, room_id: str) -> None:
        """Tears down a room. Called once when a lesson ends."""

    @abstractmethod
    def create_join_token(self, room_id: str, user_id: int, role: str) -> str:
        """Returns a join token/URL for a specific user connecting to room_id."""


class DailyVideoService(VideoService):
    """Talks to Daily.co's REST API. Field names follow Daily's documented
    rooms/meeting-tokens API as of this writing — reverify against current
    Daily docs before depending on this in production, since third-party API
    shapes can drift and this wasn't validated against a live account."""

    def __init__(self, api_key: str):
        self._client = httpx.Client(
            base_url=DAILY_API_BASE,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10.0,
        )

    def create_room(self, lesson: "Lesson") -> tuple:
        response = self._client.post("/rooms", json={"properties": {"enable_chat": False}})
        response.raise_for_status()
        room_id = response.json()["name"]
        return room_id, "daily"

    def delete_room(self, room_id: str) -> None:
        response = self._client.delete(f"/rooms/{room_id}")
        # A room that's already gone shouldn't block the lesson's end-transition.
        if response.status_code != 404:
            response.raise_for_status()

    def create_join_token(self, room_id: str, user_id: int, role: str) -> str:
        response = self._client.post(
            "/meeting-tokens",
            json={
                "properties": {
                    "room_name": room_id,
                    "user_id": str(user_id),
                    "is_owner": role == "teacher",
                }
            },
        )
        response.raise_for_status()
        return response.json()["token"]


class FakeVideoService(VideoService):
    """Deterministic, network-free stand-in. Used automatically whenever
    DAILY_API_KEY is unset, and forced in tests regardless of config."""

    def create_room(self, lesson: "Lesson") -> tuple:
        return f"fake-room-{lesson.lesson_id}", "fake"

    def delete_room(self, room_id: str) -> None:
        return None

    def create_join_token(self, room_id: str, user_id: int, role: str) -> str:
        return f"fake-token-{room_id}-{user_id}-{role}"


_video_service = None


def get_video_service() -> VideoService:
    """FastAPI dependency. Override with `app.dependency_overrides[get_video_service]`
    in tests for an extra guarantee against network calls, on top of the
    DAILY_API_KEY-unset default below."""
    global _video_service
    if _video_service is None:
        _video_service = DailyVideoService(settings.daily_api_key) if settings.daily_api_key else FakeVideoService()
    return _video_service
