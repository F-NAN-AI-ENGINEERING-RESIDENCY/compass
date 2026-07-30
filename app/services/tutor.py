from abc import ABC, abstractmethod
from typing import Optional

from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from app.config import settings
from app.models.tutor_message import TutorMessage
from app.models.tutor_session import TutorSession

GEMINI_MODEL = "gemini-2.5-flash"

SOCRATIC_SYSTEM_PROMPT = """You are a Socratic tutor for a student. You have to ensure that, above all else, you don't give the student the answer. When prompted for an answer via a direct-answer request, acknowledge the urgency, decline the ask, and immediately redirect to a smaller step instead of a hint. A step should require the student to still do the actual work, such as a calculation, decision or application. Your default first move when receiving a raw problem, no question chat, is to ask what part they're stuck on/what they've tried, never to just start explaining. Ask clarifying questions, guide the student to the answer, and keep the tone warm and encouraging to help the student continue with the session. When asking questions or giving responses:

* Give simple, easy-to-follow breakdowns of the concept they are asking first, start with a simple understanding, and move up to more complex topics within the realm of what they are asking for
* Provide analogies to help the student understand the idea or concept better when repeated misunderstandings occur
* Do knowledge checks after breaking down a concept so you can gauge whether a student is following along with the review session
* Scrutinize answers, but don't create a system of frustration for the student. The frustration threshold: after two wrong answers on the same concept, switch strategy explicitly to a smaller sub-question or analogy, instead of attempting the same approach. Ensure the student has all details in place when trying to review a concept; have them see the big picture, but also ensure the small details are understood
* Lead with an example; the example must use different numbers/different specifics than the student's actual problem. Never state the final numeric/factual answer or complete formula, even when asked directly, even if the student claims urgency or wants to see the answer for general understanding.

If a student expresses something beyond academic frustration — hopelessness, distress, or anything suggesting they're struggling outside of this specific problem — stop the Socratic method immediately. Don't continue teaching. Respond with brief warmth, and clearly direct them to talk to a teacher, counselor, or trusted adult. Do not attempt to resolve emotional distress yourself."""

# Gemini's roles are "user" and "model" — not the "user"/"assistant" pair most
# other chat APIs use.
_SENDER_TO_ROLE = {"student": "user", "ai": "model"}


class TutorService(ABC):
    @abstractmethod
    def get_response(self, messages: list[dict]) -> str:
        """Given the full ordered session history as {"role", "content"} dicts, returns the tutor's next message."""


class GeminiTutorService(TutorService):
    """Talks to the Gemini API. Temporary provider — the plan is to swap this
    for an AnthropicTutorService once Claude API tokens are approved."""

    def __init__(self, api_key: str):
        self._client = genai.Client(api_key=api_key)

    def get_response(self, messages: list[dict]) -> str:
        contents = [
            types.Content(role=m["role"], parts=[types.Part.from_text(text=m["content"])]) for m in messages
        ]
        response = self._client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(system_instruction=SOCRATIC_SYSTEM_PROMPT),
        )
        return response.text


class FakeTutorService(TutorService):
    """Deterministic, network-free stand-in. Used automatically whenever
    GEMINI_API_KEY is unset, and forced in tests regardless of config."""

    def get_response(self, messages: list[dict]) -> str:
        return "What part of this problem are you stuck on, and what have you already tried?"


_tutor_service = None


def get_tutor_service() -> TutorService:
    """FastAPI dependency. Override with `app.dependency_overrides[get_tutor_service]`
    in tests for an extra guarantee against network calls, on top of the
    GEMINI_API_KEY-unset default below."""
    global _tutor_service
    if _tutor_service is None:
        _tutor_service = (
            GeminiTutorService(settings.gemini_api_key) if settings.gemini_api_key else FakeTutorService()
        )
    return _tutor_service


def find_or_create_session(db: Session, student_id: int, lesson_id: Optional[int]) -> TutorSession:
    session = (
        db.query(TutorSession)
        .filter(TutorSession.student_id == student_id, TutorSession.lesson_id == lesson_id)
        .order_by(TutorSession.started_at.desc())
        .first()
    )
    if session is None:
        session = TutorSession(student_id=student_id, lesson_id=lesson_id)
        db.add(session)
        db.commit()
        db.refresh(session)
    return session


def add_message(db: Session, session: TutorSession, sender: str, text: str) -> TutorMessage:
    message = TutorMessage(session_id=session.session_id, sender=sender, message_text=text)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def build_message_history(db: Session, session: TutorSession) -> list[dict]:
    messages = (
        db.query(TutorMessage)
        .filter(TutorMessage.session_id == session.session_id)
        .order_by(TutorMessage.created_at, TutorMessage.message_id)
        .all()
    )
    return [{"role": _SENDER_TO_ROLE[m.sender], "content": m.message_text} for m in messages]
