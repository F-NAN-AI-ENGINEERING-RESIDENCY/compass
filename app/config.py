from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str

    # Auth
    session_expire_hours: int = 24

    # Video (Daily.co) + transcription (OpenAI Whisper). Provider selection is
    # config-driven and defaults to the network-free stub so no one needs real
    # vendor credentials to run the app or the test suite.
    video_provider: str = "stub"
    transcription_provider: str = "stub"
    daily_api_key: Optional[str] = None
    daily_webhook_secret: Optional[str] = None
    openai_api_key: Optional[str] = None

    # "Continue with Google": the OAuth client id ID tokens must be issued
    # for (verified as the `aud` claim) — required before POST /api/auth/google
    # can accept a real token; unset by default so tests/local dev never
    # silently accept a token meant for someone else's client.
    google_oauth_client_id: Optional[str] = None

    # How long a "live" lesson may sit with no Daily participant activity
    # before the background scheduler auto-ends it.
    lesson_inactivity_timeout_minutes: int = 15
    # Off in tests (see conftest.py): a real interval-based scheduler thread
    # starting/stopping around every single TestClient-using test would be
    # both wasteful and a source of flakiness, and tests exercise the
    # inactivity check directly via lesson_service instead.
    enable_lesson_scheduler: bool = True

    # App
    environment: str = "development"
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
