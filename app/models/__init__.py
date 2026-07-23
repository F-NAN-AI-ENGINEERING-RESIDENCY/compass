"""Import every model so they register on Base's declarative registry.

Required before any relationship() string reference (e.g. Mapped["Lesson"])
can resolve, and before Alembic autogenerate can see the full schema.
"""

from app.models.class_ import Class
from app.models.confusion_signal import ConfusionSignal
from app.models.current_skill import CurrentSkill
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.material import Material
from app.models.question import Question
from app.models.question_cluster import QuestionCluster
from app.models.recording import Recording
from app.models.session import Session
from app.models.skill_topic import SkillTopic
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.transcript_chunk import TranscriptChunk
from app.models.tutor_message import TutorMessage
from app.models.tutor_session import TutorSession

__all__ = [
    "Class",
    "ConfusionSignal",
    "CurrentSkill",
    "Enrollment",
    "Lesson",
    "Material",
    "Question",
    "QuestionCluster",
    "Recording",
    "Session",
    "SkillTopic",
    "Student",
    "Teacher",
    "TranscriptChunk",
    "TutorMessage",
    "TutorSession",
]
