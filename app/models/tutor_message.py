from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

MESSAGE_SENDERS = ("student", "ai")


class TutorMessage(Base):
    __tablename__ = "tutor_messages"
    __table_args__ = (
        CheckConstraint(f"sender IN {MESSAGE_SENDERS}", name="ck_tutor_messages_sender"),
    )

    message_id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("tutor_sessions.session_id", ondelete="CASCADE"), nullable=False
    )
    sender: Mapped[str] = mapped_column(String, nullable=False)
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    session: Mapped["TutorSession"] = relationship(back_populates="messages")
