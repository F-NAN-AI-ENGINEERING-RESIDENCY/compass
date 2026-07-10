import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from tests.conftest import auth_header


def _login_token(client: TestClient, role: str, username: str) -> str:
    return auth_header(client, role, username)["Authorization"].removeprefix("Bearer ")


def test_rejects_connection_with_no_token(client, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_, status="live")

    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/lessons/{lesson.lesson_id}"):
            pass
    assert exc_info.value.code == 4401


def test_rejects_teacher_who_does_not_own_the_lesson(client, make_teacher, make_class, make_lesson):
    owner = make_teacher(username="owner")
    make_teacher(username="other")
    class_ = make_class(owner)
    lesson = make_lesson(class_, status="live")
    token = _login_token(client, "teacher", "other")

    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/lessons/{lesson.lesson_id}?token={token}"):
            pass
    assert exc_info.value.code == 4403


def test_rejects_connection_to_a_lesson_that_isnt_live(client, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)  # still "scheduled"
    token = _login_token(client, "teacher", teacher.username)

    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/lessons/{lesson.lesson_id}?token={token}"):
            pass
    assert exc_info.value.code == 4409


def test_ping_gets_a_pong(client, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_, status="live")
    token = _login_token(client, "teacher", teacher.username)

    with client.websocket_connect(f"/ws/lessons/{lesson.lesson_id}?token={token}") as ws:
        ws.send_json({"type": "ping"})
        assert ws.receive_json() == {"type": "pong"}


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
        assert created["type"] == "signal.created"
        assert created["data"]["lessonId"] == lesson.lesson_id
        assert created["data"]["studentId"] == student.student_id

        ack = ws.receive_json()
        assert ack["type"] == "signal.ack"
        assert ack["data"]["signalId"] == created["data"]["signalId"]


def test_connection_closes_with_1000_when_lesson_ends(client, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_, status="live")
    teacher_token = _login_token(client, "teacher", teacher.username)

    with client.websocket_connect(f"/ws/lessons/{lesson.lesson_id}?token={teacher_token}") as ws:
        response = client.patch(
            f"/api/lessons/{lesson.lesson_id}",
            json={"status": "ended"},
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        assert response.status_code == 200, response.text

        ended = ws.receive_json()
        assert ended["type"] == "lesson.ended"

        with pytest.raises(WebSocketDisconnect) as exc_info:
            ws.receive_json()
        assert exc_info.value.code == 1000
