from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment


class DuplicateEnrollmentError(Exception):
    pass


def create_enrollment(db: Session, student_id: int, class_id: int) -> Enrollment:
    exists = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == student_id, Enrollment.class_id == class_id)
        .first()
        is not None
    )
    if exists:
        raise DuplicateEnrollmentError("Already enrolled in this class")

    enrollment = Enrollment(student_id=student_id, class_id=class_id)
    db.add(enrollment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateEnrollmentError("Already enrolled in this class")
    db.refresh(enrollment)
    return enrollment
