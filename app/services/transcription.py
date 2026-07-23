from abc import ABC, abstractmethod
from typing import NamedTuple

import httpx

from app.config import settings

OPENAI_API_BASE = "https://api.openai.com/v1"


class TranscriptSegment(NamedTuple):
    text: str
    start_seconds: float
    end_seconds: float


class TranscriptionService(ABC):
    @abstractmethod
    def transcribe(self, audio_url: str) -> list:
        """Downloads the audio at audio_url and returns segment-level transcript chunks."""


class OpenAITranscriptionService(TranscriptionService):
    """Calls OpenAI's Whisper (whisper-1) for segment-level timestamps. Field
    names follow OpenAI's documented audio/transcriptions API as of this
    writing — reverify against current docs before depending on this in
    production, since API shapes can drift."""

    def __init__(self, api_key: str):
        self._client = httpx.Client(
            base_url=OPENAI_API_BASE, headers={"Authorization": f"Bearer {api_key}"}, timeout=120.0
        )

    def transcribe(self, audio_url: str) -> list:
        audio_response = httpx.get(audio_url, timeout=60.0)
        audio_response.raise_for_status()

        response = self._client.post(
            "/audio/transcriptions",
            data={
                "model": "whisper-1",
                "response_format": "verbose_json",
                "timestamp_granularities[]": "segment",
            },
            files={"file": ("recording.mp4", audio_response.content, "application/octet-stream")},
        )
        response.raise_for_status()
        segments = response.json().get("segments", [])
        return [
            TranscriptSegment(
                text=segment["text"].strip(), start_seconds=segment["start"], end_seconds=segment["end"]
            )
            for segment in segments
        ]


class StubTranscriptionService(TranscriptionService):
    """Deterministic, network-free stand-in. Used whenever TRANSCRIPTION_PROVIDER
    is "stub" (the default), and used by all tests regardless of config."""

    def transcribe(self, audio_url: str) -> list:
        return [
            TranscriptSegment(text="Let's start today's lesson on fractions.", start_seconds=0.0, end_seconds=4.5),
            TranscriptSegment(text="Can anyone tell me what a numerator is?", start_seconds=4.5, end_seconds=9.0),
            TranscriptSegment(text="Great, let's look at an example together.", start_seconds=9.0, end_seconds=15.0),
        ]


_transcription_service = None


def get_transcription_service() -> TranscriptionService:
    global _transcription_service
    if _transcription_service is None:
        if settings.transcription_provider == "openai":
            if not settings.openai_api_key:
                raise RuntimeError("TRANSCRIPTION_PROVIDER=openai requires OPENAI_API_KEY to be set")
            _transcription_service = OpenAITranscriptionService(settings.openai_api_key)
        else:
            _transcription_service = StubTranscriptionService()
    return _transcription_service
