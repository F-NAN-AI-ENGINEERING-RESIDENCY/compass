from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser, get_current_user, get_db, require_teacher
from app.schemas.classes import ClassCreateRequest, ClassResponse
from app.services import auth_service, class_service

router = APIRouter(prefix="/api/classes", tags=["classes"])


def _to_class_response(class_) -> ClassResponse:
    return ClassResponse(
        class_id=class_.class_id,
        teacher_id=class_.teacher_id,
        name=class_.name,
        join_code=class_.join_code,
        alert_threshold=class_.alert_threshold,
        created_at=class_.created_at,
    )


@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    payload: ClassCreateRequest,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> ClassResponse:
    teacher_id = auth_service.user_id_of(current_user.principal)
    class_ = class_service.create_class(db, teacher_id, payload.name)
    return _to_class_response(class_)


@router.get("/{class_id}", response_model=ClassResponse)
def get_class(
    class_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClassResponse:
    user_id = auth_service.user_id_of(current_user.principal)
    try:
        class_ = class_service.get_class_or_404(db, class_id)
        class_service.assert_user_can_view_class(db, class_, user_id, current_user.role.value)
    except class_service.ClassNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (class_service.NotClassOwnerError, class_service.NotEnrolledInClassError) as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    return _to_class_response(class_)
