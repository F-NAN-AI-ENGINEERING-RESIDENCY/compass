from sqlalchemy.orm import Session

from app.models.class_ import Class, generate_join_code
from app.models.enrollment import Enrollment


class ClassNotFoundError(Exception):
    pass


class NotClassOwnerError(Exception):
    pass


class NotEnrolledInClassError(Exception):
    pass


def get_class_or_404(db: Session, class_id: int) -> Class:
    class_ = db.get(Class, class_id)
    if class_ is None:
        raise ClassNotFoundError(f"Class {class_id} not found")
    return class_


def get_class_by_join_code(db: Session, join_code: str) -> Class:
    class_ = db.query(Class).filter(Class.join_code == join_code).first()
    if class_ is None:
        raise ClassNotFoundError(f"No class found for join code '{join_code}'")
    return class_


def assert_teacher_owns_class(class_: Class, teacher_id: int) -> None:
    if class_.teacher_id != teacher_id:
        raise NotClassOwnerError("You do not own this class")


def assert_student_enrolled_in_class(db: Session, class_: Class, student_id: int) -> None:
    enrolled = (
        db.query(Enrollment)
        .filter(Enrollment.class_id == class_.class_id, Enrollment.student_id == student_id)
        .first()
        is not None
    )
    if not enrolled:
        raise NotEnrolledInClassError("You are not enrolled in this class")


def assert_user_can_view_class(db: Session, class_: Class, user_id: int, role: str) -> None:
    if role == "teacher":
        assert_teacher_owns_class(class_, user_id)
    else:
        assert_student_enrolled_in_class(db, class_, user_id)


def create_class(db: Session, teacher_id: int, name: str) -> Class:
    class_ = Class(teacher_id=teacher_id, name=name, join_code=generate_unique_join_code(db))
    db.add(class_)
    db.commit()
    db.refresh(class_)
    return class_


def generate_unique_join_code(db: Session, max_attempts: int = 10) -> str:
    """DB-checked join code generation for a real class-creation endpoint to
    call explicitly. Class.join_code's own column default (same alphabet)
    already makes collisions astronomically unlikely on its own — this just
    makes the guarantee explicit rather than relying on that alone."""
    for _ in range(max_attempts):
        code = generate_join_code()
        if db.query(Class).filter(Class.join_code == code).first() is None:
            return code
    raise RuntimeError("Could not generate a unique class join code after several attempts")
