from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    teacher_id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # passive_deletes=True: let the DB's ON DELETE RESTRICT on classes.teacher_id
    # reject the delete outright, instead of the ORM nulling out a NOT NULL column first.
    classes: Mapped[list["Class"]] = relationship(back_populates="teacher", passive_deletes=True)
