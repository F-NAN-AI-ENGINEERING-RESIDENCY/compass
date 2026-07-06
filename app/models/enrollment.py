from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint("student_id", "class_id", name="uq_enrollments_student_class"),
        # The unique constraint above indexes (student_id, class_id); the roster
        # lookup ("which students are in class X") filters on class_id alone, so
        # it needs class_id leading its own index too.
        Index("ix_enrollments_class_id", "class_id"),
    )

    enrollment_id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.class_id", ondelete="CASCADE"), nullable=False)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    student: Mapped["Student"] = relationship(back_populates="enrollments")
    class_: Mapped["Class"] = relationship(back_populates="enrollments")
