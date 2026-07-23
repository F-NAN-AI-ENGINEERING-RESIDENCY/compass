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
