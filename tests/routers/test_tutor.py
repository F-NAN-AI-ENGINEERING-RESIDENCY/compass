from app.models.tutor_message import TutorMessage
from app.models.tutor_session import TutorSession
from tests.conftest import auth_header


def test_student_can_send_a_message_and_gets_a_reply(client, make_student):
    student = make_student()
    headers = auth_header(client, "student", student.username)

    response = client.post("/api/tutor/message", json={"message": "I'm stuck on fractions"}, headers=headers)

    assert response.status_code == 200, response.text
    body = response.json()
    assert isinstance(body["sessionId"], int)
    assert isinstance(body["reply"], str) and body["reply"]


def test_teacher_cannot_send_a_tutor_message(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.post("/api/tutor/message", json={"message": "Hello"}, headers=headers)

    assert response.status_code == 403


def test_unauthenticated_cannot_send_a_tutor_message(client):
    response = client.post("/api/tutor/message", json={"message": "Hello"})

    assert response.status_code == 401


def test_message_with_missing_lesson_id_is_404(client, make_student):
    student = make_student()
    headers = auth_header(client, "student", student.username)

    response = client.post(
        "/api/tutor/message", json={"message": "Hello", "lessonId": 999999}, headers=headers
    )

    assert response.status_code == 404


def test_message_with_lesson_id_links_session_to_lesson(
    client, db_session, make_student, make_teacher, make_class, make_lesson
):
    student = make_student()
    lesson = make_lesson(make_class(make_teacher()))
    headers = auth_header(client, "student", student.username)

    response = client.post(
        "/api/tutor/message", json={"message": "Hello", "lessonId": lesson.lesson_id}, headers=headers
    )

    assert response.status_code == 200, response.text
    session = db_session.get(TutorSession, response.json()["sessionId"])
    assert session.lesson_id == lesson.lesson_id
    assert session.student_id == student.student_id


def test_session_and_message_history_persist_across_multiple_messages(client, db_session, make_student):
    student = make_student()
    headers = auth_header(client, "student", student.username)

    first = client.post("/api/tutor/message", json={"message": "I'm stuck"}, headers=headers)
    second = client.post("/api/tutor/message", json={"message": "I tried squaring both sides"}, headers=headers)

    assert first.status_code == 200 and second.status_code == 200
    session_id = first.json()["sessionId"]
    assert second.json()["sessionId"] == session_id

    messages = (
        db_session.query(TutorMessage)
        .filter(TutorMessage.session_id == session_id)
        .order_by(TutorMessage.created_at, TutorMessage.message_id)
        .all()
    )
    assert [m.sender for m in messages] == ["student", "ai", "student", "ai"]
    assert messages[0].message_text == "I'm stuck"
    assert messages[2].message_text == "I tried squaring both sides"
