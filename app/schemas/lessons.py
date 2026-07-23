from datetime import datetime
from enum import Enum
from typing import Optional

from app.schemas.base import CamelModel


class LessonStatusUpdate(str, Enum):
    live = "live"
    ended = "ended"


class LessonStatusUpdateRequest(CamelModel):
    status: LessonStatusUpdate


class LessonCreateRequest(CamelModel):
    class_id: int
    title: str
    scheduled_at: Optional[datetime] = None


class LessonResponse(CamelModel):
    lesson_id: int
    class_id: int
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None


class VideoTokenResponse(CamelModel):
    room_id: str
    room_url: str
    provider: str
    token: str
