from typing import Optional

from app.schemas.base import CamelModel


class TutorMessageRequest(CamelModel):
    message: str
    lesson_id: Optional[int] = None


class TutorMessageResponse(CamelModel):
    session_id: int
    reply: str
