from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SkillTopic(Base):
    """Canonical curriculum topic catalog (e.g. "Fractions").

    Current_Skills references this by topic_id instead of a free-text column so
    a "skillId" means the same concept across every student's row, not just a
    private per-student mastery record.
    """

    __tablename__ = "skill_topics"

    topic_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    # passive_deletes=True: let ON DELETE RESTRICT on current_skills.topic_id
    # block the delete at the DB rather than the ORM nulling out a NOT NULL column.
    current_skills: Mapped[list["CurrentSkill"]] = relationship(back_populates="topic", passive_deletes=True)
