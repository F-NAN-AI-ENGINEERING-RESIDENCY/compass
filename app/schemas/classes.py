from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from app.schemas.base import CamelModel


class ClassCreateRequest(CamelModel):
    name: str


class EnrolledStudent(CamelModel):
    student_id: int
    student_name: str
    enrolled_at: datetime


class ClassResponse(CamelModel):
    class_id: int
    teacher_id: int
    name: str
    join_code: str
    alert_threshold: Decimal
    created_at: datetime
    enrollments: Optional[List[EnrolledStudent]] = None
