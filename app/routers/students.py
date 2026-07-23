from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser, get_db, require_student
from app.schemas.lessons import LiveLessonResponse
from app.services import auth_service, lesson_service

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("/me/live-lessons", response_model=List[LiveLessonResponse])
def list_my_live_lessons(
    current_user: CurrentUser = Depends(require_student),
    db: Session = Depends(get_db),
) -> List[LiveLessonResponse]:
    student_id = auth_service.user_id_of(current_user.principal)
    lessons = lesson_service.get_live_lessons_for_student(db, student_id)
    return [
        LiveLessonResponse(
            lesson_id=lesson.lesson_id,
            class_id=lesson.class_id,
            class_name=lesson.class_.name,
            started_at=lesson.started_at,
        )
        for lesson in lessons
    ]
