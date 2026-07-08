from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser, get_db, require_student
from app.schemas.enrollments import EnrollmentCreateRequest, EnrollmentResponse
from app.services import auth_service, class_service, enrollment_service

router = APIRouter(prefix="/api/enrollments", tags=["enrollments"])


def _to_enrollment_response(enrollment) -> EnrollmentResponse:
    return EnrollmentResponse(
        enrollment_id=enrollment.enrollment_id,
        student_id=enrollment.student_id,
        class_id=enrollment.class_id,
        enrolled_at=enrollment.enrolled_at,
    )


@router.post("", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def create_enrollment(
    payload: EnrollmentCreateRequest,
    current_user: CurrentUser = Depends(require_student),
    db: Session = Depends(get_db),
) -> EnrollmentResponse:
    student_id = auth_service.user_id_of(current_user.principal)
    try:
        class_ = class_service.get_class_by_join_code(db, payload.join_code)
        enrollment = enrollment_service.create_enrollment(db, student_id, class_.class_id)
    except class_service.ClassNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except enrollment_service.DuplicateEnrollmentError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return _to_enrollment_response(enrollment)
