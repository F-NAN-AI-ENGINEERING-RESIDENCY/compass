import uuid
from datetime import datetime
from enum import Enum
from typing import List

from app.schemas.base import CamelModel


class SignalStatusEnum(str, Enum):
    acknowledged = "acknowledged"
    resolved = "resolved"


class SignalStatusUpdateRequest(CamelModel):
    status: SignalStatusEnum


class SignalCreateResponse(CamelModel):
    """Returned to the student who just created the signal. Matches the
    original contract's documented shape exactly — no identity field, since a
    student never needs their own identity echoed back to them."""

    signal_id: uuid.UUID
    lesson_id: int
    created_at: datetime
    status: str


class SignalUpdateResponse(CamelModel):
    """Teacher-facing PATCH response. Extends the contract's originally
    documented { signalId, status, updatedAt } shape with identity fields per
    the 2026-07-07 decision that the teacher always sees who sent a signal."""

    signal_id: uuid.UUID
    status: str
    updated_at: datetime
    student_id: int
    student_name: str


class TeacherSignalSummary(CamelModel):
    """One entry in the dashboard's signal list — same identity extension as
    SignalUpdateResponse, for the same reason."""

    signal_id: uuid.UUID
    created_at: datetime
    status: str
    student_id: int
    student_name: str


class SkillSnapshotItem(CamelModel):
    skill_id: int
    skill_name: str
    class_average_level: float
    students_below_threshold: int


class DashboardResponse(CamelModel):
    lesson_id: int
    open_signal_count: int
    signals: List[TeacherSignalSummary]
    skill_snapshot: List[SkillSnapshotItem]
