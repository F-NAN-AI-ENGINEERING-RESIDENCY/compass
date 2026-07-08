from sqlalchemy.orm import Session

from app.models.class_ import Class, generate_join_code


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
