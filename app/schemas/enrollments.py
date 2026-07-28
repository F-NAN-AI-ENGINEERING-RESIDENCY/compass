from datetime import datetime

from app.schemas.base import CamelModel


class EnrollmentCreateRequest(CamelModel):
    join_code: str


class EnrollmentResponse(CamelModel):
    enrollment_id: int
    student_id: int
    class_id: int
    enrolled_at: datetime
