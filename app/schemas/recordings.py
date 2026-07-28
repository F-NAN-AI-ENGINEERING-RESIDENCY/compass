from datetime import datetime
from typing import Optional

from app.schemas.base import CamelModel


class RecordingResponse(CamelModel):
    recording_id: int
    lesson_id: int
    status: str
    duration_seconds: Optional[int] = None
    created_at: datetime


class RecordingAccessLinkResponse(CamelModel):
    access_link: str
