import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser, get_db, require_student, require_teacher
from app.schemas.signals import (
    DashboardResponse,
    SignalCreateResponse,
    SignalStatusUpdateRequest,
    SignalUpdateResponse,
    SkillSnapshotItem,
    TeacherSignalSummary,
)
from app.services import auth_service, signal_service

router = APIRouter(prefix="/api/lessons/{lesson_id}", tags=["signals"])


@router.post("/signals", response_model=SignalCreateResponse, status_code=status.HTTP_201_CREATED)
def create_signal(
    lesson_id: int,
    current_user: CurrentUser = Depends(require_student),
    db: Session = Depends(get_db),
) -> SignalCreateResponse:
    student_id = auth_service.user_id_of(current_user.principal)
    try:
        signal = signal_service.create_signal(db, lesson_id, student_id)
    except signal_service.LessonNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except signal_service.NotEnrolledError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except signal_service.LessonNotLiveError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return SignalCreateResponse(
        signal_id=signal.public_id, lesson_id=signal.lesson_id, created_at=signal.created_at, status=signal.status
    )


@router.get("/signals/{signal_id}", response_model=TeacherSignalSummary)
def get_signal(
    lesson_id: int,
    signal_id: uuid.UUID,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> TeacherSignalSummary:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        signal = signal_service.get_signal(db, lesson_id, signal_id, teacher_id)
    except (signal_service.LessonNotFoundError, signal_service.SignalNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except signal_service.NotLessonOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    return TeacherSignalSummary(
        signal_id=signal.public_id,
        created_at=signal.created_at,
        status=signal.status,
        student_id=signal.student_id,
        student_name=signal.student.name,
    )


@router.patch("/signals/{signal_id}", response_model=SignalUpdateResponse)
def update_signal(
    lesson_id: int,
    signal_id: uuid.UUID,
    payload: SignalStatusUpdateRequest,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> SignalUpdateResponse:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        signal = signal_service.update_signal_status(db, lesson_id, signal_id, payload.status.value, teacher_id)
    except (signal_service.LessonNotFoundError, signal_service.SignalNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except signal_service.NotLessonOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    return SignalUpdateResponse(
        signal_id=signal.public_id,
        status=signal.status,
        updated_at=signal.updated_at,
        student_id=signal.student_id,
        student_name=signal.student.name,
    )


@router.delete("/signals/{signal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_signal(
    lesson_id: int,
    signal_id: uuid.UUID,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> None:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        signal_service.delete_signal(db, lesson_id, signal_id, teacher_id)
    except (signal_service.LessonNotFoundError, signal_service.SignalNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except signal_service.NotLessonOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    lesson_id: int,
    since: Optional[datetime] = Query(default=None),
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> DashboardResponse:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        data = signal_service.get_dashboard(db, lesson_id, teacher_id, since)
    except signal_service.LessonNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except signal_service.NotLessonOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    return DashboardResponse(
        lesson_id=data["lesson_id"],
        open_signal_count=data["open_signal_count"],
        signals=[
            TeacherSignalSummary(
                signal_id=s.public_id,
                created_at=s.created_at,
                status=s.status,
                student_id=s.student_id,
                student_name=s.student.name,
            )
            for s in data["signals"]
        ],
        skill_snapshot=[
            SkillSnapshotItem(
                skill_id=row[0], skill_name=row[1], class_average_level=float(row[2]), students_below_threshold=row[3]
            )
            for row in data["skill_snapshot"]
        ],
    )
