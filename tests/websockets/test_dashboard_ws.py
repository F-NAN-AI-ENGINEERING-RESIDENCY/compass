import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from tests.conftest import auth_header


def _login_token(client: TestClient, role: str, username: str) -> str:
    return auth_header(client, role, username)["Authorization"].removeprefix("Bearer ")


def test_rejects_connection_with_no_token(client, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)

    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/lessons/{lesson.lesson_id}"):
            pass
    assert exc_info.value.code == 1008


def test_rejects_teacher_who_does_not_own_the_lesson(client, make_teacher, make_class, make_lesson):
    owner = make_teacher(username="owner")
    make_teacher(username="other")
    class_ = make_class(owner)
    lesson = make_lesson(class_)
    token = _login_token(client, "teacher", "other")

    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/lessons/{lesson.lesson_id}?token={token}"):
            pass
    assert exc_info.value.code == 1008


def test_owning_teacher_receives_broadcast_when_student_signals(
    client, make_teacher, make_student, make_class, make_lesson, make_enrollment
):
    teacher = make_teacher()
    student = make_student()
    class_ = make_class(teacher)
    lesson = make_lesson(class_, status="live")
    make_enrollment(student, class_)
    teacher_token = _login_token(client, "teacher", teacher.username)
    student_token = _login_token(client, "student", student.username)

    with client.websocket_connect(f"/ws/lessons/{lesson.lesson_id}?token={teacher_token}") as ws:
        response = client.post(
            f"/api/lessons/{lesson.lesson_id}/signals",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 201, response.text

        created = ws.receive_json()
        assert created["eventType"] == "signal.created"
        assert created["lessonId"] == lesson.lesson_id
        assert created["studentId"] == student.student_id

        ack = ws.receive_json()
        assert ack["eventType"] == "signal.ack"
        assert ack["signalId"] == created["signalId"]
