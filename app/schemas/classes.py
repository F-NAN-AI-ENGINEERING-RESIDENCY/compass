from datetime import datetime
from decimal import Decimal

from app.schemas.base import CamelModel


class ClassCreateRequest(CamelModel):
    name: str


class ClassResponse(CamelModel):
    class_id: int
    teacher_id: int
    name: str
    join_code: str
    alert_threshold: Decimal
    created_at: datetime
