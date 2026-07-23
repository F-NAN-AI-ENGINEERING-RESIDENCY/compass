from datetime import datetime, timezone

from tests.conftest import auth_header


def test_list_live_lessons_returns_only_enrolled_and_live(
    client, db_session, make_student, make_teacher, make_class, make_enrollment, make_lesson
):
    student = make_student()
    teacher = make_teacher()

    enrolled_class = make_class(teacher, name="Algebra I")
    make_enrollment(student, enrolled_class)
    live_lesson = make_lesson(enrolled_class, title="Fractions", status="live")
    live_lesson.started_at = datetime(2026, 7, 23, 9, 0, tzinfo=timezone.utc)
    db_session.commit()

    scheduled_lesson_same_class = make_lesson(enrolled_class, title="Decimals", status="scheduled")

    other_class = make_class(teacher, name="Geometry")  # student not enrolled here
    make_lesson(other_class, title="Angles", status="live")

    headers = auth_header(client, "student", student.username)
    response = client.get("/api/students/me/live-lessons", headers=headers)

    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body) == 1
    assert body[0]["lessonId"] == live_lesson.lesson_id
    assert body[0]["classId"] == enrolled_class.class_id
    assert body[0]["className"] == "Algebra I"
    assert body[0]["startedAt"] is not None
    assert scheduled_lesson_same_class.lesson_id not in [item["lessonId"] for item in body]


def test_list_live_lessons_empty_when_none_live(client, make_student, make_teacher, make_class, make_enrollment):
    student = make_student()
    teacher = make_teacher()
    class_ = make_class(teacher)
    make_enrollment(student, class_)
    headers = auth_header(client, "student", student.username)

    response = client.get("/api/students/me/live-lessons", headers=headers)
    assert response.status_code == 200, response.text
    assert response.json() == []


def test_teacher_cannot_call_live_lessons(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get("/api/students/me/live-lessons", headers=headers)
    assert response.status_code == 403


def test_list_live_lessons_requires_auth(client):
    response = client.get("/api/students/me/live-lessons")
    assert response.status_code == 401
