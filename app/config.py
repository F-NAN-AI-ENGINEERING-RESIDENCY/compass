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

    # Video (Daily.co). Unset in local dev/tests on purpose: app.services.video
    # falls back to FakeVideoService whenever this is blank, so no one needs a
    # real Daily account to run the app or the test suite.
    daily_api_key: Optional[str] = None

    # AI Tutor (Gemini, temporary — swapping to Anthropic once API tokens are
    # approved). Same pattern as daily_api_key: app.services.tutor falls back
    # to FakeTutorService whenever this is blank, so no one needs a real
    # Gemini account to run the app or the test suite.
    gemini_api_key: Optional[str] = None

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
