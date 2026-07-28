from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Material(Base):
    __tablename__ = "materials"

    material_id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(
        ForeignKey("classes.class_id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Free-text grouping, not a foreign key: there's no separate Unit entity
    # in this app, just the label a teacher types on the materials screen.
    unit: Mapped[str] = mapped_column(String, nullable=False)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    # Ordering is scoped to (class_id, unit); teacher-controlled via the
    # reorder endpoint, not recomputed automatically on insert/delete.
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    class_: Mapped["Class"] = relationship(back_populates="materials")
