from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser, get_db, require_student
from app.schemas.tutor import TutorMessageRequest, TutorMessageResponse
from app.services import auth_service, lesson_service, tutor
from app.services.tutor import TutorService, get_tutor_service

router = APIRouter(prefix="/api/tutor", tags=["tutor"])


@router.post("/message", response_model=TutorMessageResponse)
def send_message(
    payload: TutorMessageRequest,
    current_user: CurrentUser = Depends(require_student),
    db: Session = Depends(get_db),
    tutor_service: TutorService = Depends(get_tutor_service),
) -> TutorMessageResponse:
    student_id = auth_service.user_id_of(current_user.principal)

    if payload.lesson_id is not None:
        try:
            lesson_service.get_lesson_or_404(db, payload.lesson_id)
        except lesson_service.LessonNotFoundError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    session = tutor.find_or_create_session(db, student_id, payload.lesson_id)
    tutor.add_message(db, session, sender="student", text=payload.message)

    history = tutor.build_message_history(db, session)
    reply_text = tutor_service.get_response(history)

    # Known deviation / not yet implemented: the system prompt tells the model
    # to redirect a distressed student to a teacher/counselor/trusted adult,
    # but nothing here notifies a teacher when that happens. Needs a product
    # decision (dashboard signal? separate alert?) before it's built — see
    # README "Known deviations from the original contract".
    tutor.add_message(db, session, sender="ai", text=reply_text)

    return TutorMessageResponse(session_id=session.session_id, reply=reply_text)
