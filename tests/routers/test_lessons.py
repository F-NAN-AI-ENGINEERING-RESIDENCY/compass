from app.main import app
from app.services.video import VideoProvisioningError, get_video_service
from tests.conftest import auth_header


class _FailingVideoService:
    def create_room(self, lesson):
        raise VideoProvisioningError("Daily is down")

    def delete_room(self, room_id):
        raise AssertionError("should not be called")

    def create_join_token(self, room_id, user_id, role):
        raise AssertionError("should not be called")

    def get_room_url(self, room_id):
        raise AssertionError("should not be called")


class _TeardownFailingVideoService:
    """Provisions rooms normally but fails to tear them down, so tests can
    verify a Daily outage on end-of-lesson never leaves a lesson stuck live."""

    def create_room(self, lesson):
        return f"fake-room-{lesson.lesson_id}", "fake"

    def delete_room(self, room_id):
        raise RuntimeError("Daily is down")

    def create_join_token(self, room_id, user_id, role):
        return f"fake-token-{room_id}-{user_id}-{role}"

    def get_room_url(self, room_id):
        return f"https://fake.daily.co/{room_id}"


def test_create_lesson(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "teacher", teacher.username)

    response = client.post("/api/lessons", json={"classId": class_.class_id, "title": "Fractions"}, headers=headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["classId"] == class_.class_id
    assert body["status"] == "scheduled"


def test_student_cannot_create_lesson(client, make_student, make_teacher, make_class):
    student = make_student()
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "student", student.username)

    response = client.post("/api/lessons", json={"classId": class_.class_id, "title": "Fractions"}, headers=headers)
    assert response.status_code == 403


def test_non_owning_teacher_cannot_create_lesson(client, make_teacher, make_class):
    owner = make_teacher(username="owner_t")
    other = make_teacher(username="other_t")
    class_ = make_class(owner)
    headers = auth_header(client, "teacher", other.username)

    response = client.post("/api/lessons", json={"classId": class_.class_id, "title": "Fractions"}, headers=headers)
    assert response.status_code == 403


def test_create_lesson_requires_auth(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)

    response = client.post("/api/lessons", json={"classId": class_.class_id, "title": "Fractions"})
    assert response.status_code == 401


def test_create_lesson_missing_class_is_404(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.post("/api/lessons", json={"classId": 999999, "title": "Fractions"}, headers=headers)
    assert response.status_code == 404


def test_start_then_end_lesson(client, db_session, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    headers = auth_header(client, "teacher", teacher.username)

    live_response = client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "live"}, headers=headers)
    assert live_response.status_code == 200, live_response.text
    body = live_response.json()
    assert body["status"] == "live"
    assert body["startedAt"] is not None

    db_session.refresh(lesson)
    assert lesson.video_room_id == f"fake-room-{lesson.lesson_id}"
    assert lesson.video_provider == "fake"

    ended_response = client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "ended"}, headers=headers)
    assert ended_response.status_code == 200, ended_response.text
    assert ended_response.json()["status"] == "ended"
    assert ended_response.json()["endedAt"] is not None


def test_ending_lesson_survives_daily_teardown_failure(client, db_session, make_teacher, make_class, make_lesson):
    """A Daily outage while tearing down the room must not leave the lesson
    stuck in "live" — the end-transition has to commit regardless."""
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    headers = auth_header(client, "teacher", teacher.username)

    client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "live"}, headers=headers)

    app.dependency_overrides[get_video_service] = lambda: _TeardownFailingVideoService()
    try:
        response = client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "ended"}, headers=headers)
    finally:
        del app.dependency_overrides[get_video_service]

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "ended"
    assert response.json()["endedAt"] is not None

    db_session.refresh(lesson)
    assert lesson.status == "ended"
    assert lesson.ended_at is not None


def test_cannot_skip_straight_to_ended(client, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    headers = auth_header(client, "teacher", teacher.username)

    response = client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "ended"}, headers=headers)
    assert response.status_code == 409


def test_cannot_restart_an_ended_lesson(client, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    headers = auth_header(client, "teacher", teacher.username)

    client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "live"}, headers=headers)
    client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "ended"}, headers=headers)
    response = client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "live"}, headers=headers)
    assert response.status_code == 409


def test_video_provisioning_failure_returns_502_and_leaves_lesson_scheduled(
    client, db_session, make_teacher, make_class, make_lesson
):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    headers = auth_header(client, "teacher", teacher.username)

    app.dependency_overrides[get_video_service] = lambda: _FailingVideoService()
    try:
        response = client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "live"}, headers=headers)
    finally:
        del app.dependency_overrides[get_video_service]

    assert response.status_code == 502, response.text

    db_session.refresh(lesson)
    assert lesson.status == "scheduled"
    assert lesson.video_room_id is None
    assert lesson.started_at is None


def test_non_owning_teacher_cannot_update_lesson(client, make_teacher, make_class, make_lesson):
    owner = make_teacher(username="owner_t")
    other = make_teacher(username="other_t")
    class_ = make_class(owner)
    lesson = make_lesson(class_)
    headers = auth_header(client, "teacher", other.username)

    response = client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "live"}, headers=headers)
    assert response.status_code == 403


def test_student_cannot_update_lesson_status(client, make_teacher, make_student, make_class, make_lesson):
    teacher = make_teacher()
    student = make_student()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    headers = auth_header(client, "student", student.username)

    response = client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "live"}, headers=headers)
    assert response.status_code == 403


def test_update_lesson_status_requires_auth(client, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)

    response = client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "live"})
    assert response.status_code == 401


def test_update_missing_lesson_is_404(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.patch("/api/lessons/999999", json={"status": "live"}, headers=headers)
    assert response.status_code == 404


def test_owning_teacher_gets_video_token_while_live(client, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    headers = auth_header(client, "teacher", teacher.username)
    client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "live"}, headers=headers)

    response = client.get(f"/api/lessons/{lesson.lesson_id}/video-token", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["provider"] == "fake"
    assert body["roomId"] == f"fake-room-{lesson.lesson_id}"
    assert body["roomUrl"] == f"https://fake.daily.co/fake-room-{lesson.lesson_id}"
    assert body["token"]


def test_enrolled_student_gets_video_token_while_live(
    client, make_teacher, make_student, make_class, make_enrollment, make_lesson
):
    teacher = make_teacher()
    student = make_student()
    class_ = make_class(teacher)
    make_enrollment(student, class_)
    lesson = make_lesson(class_)
    teacher_headers = auth_header(client, "teacher", teacher.username)
    client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "live"}, headers=teacher_headers)

    student_headers = auth_header(client, "student", student.username)
    response = client.get(f"/api/lessons/{lesson.lesson_id}/video-token", headers=student_headers)
    assert response.status_code == 200, response.text


def test_non_enrolled_student_cannot_get_video_token(
    client, make_teacher, make_student, make_class, make_lesson
):
    teacher = make_teacher()
    student = make_student()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    teacher_headers = auth_header(client, "teacher", teacher.username)
    client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "live"}, headers=teacher_headers)

    student_headers = auth_header(client, "student", student.username)
    response = client.get(f"/api/lessons/{lesson.lesson_id}/video-token", headers=student_headers)
    assert response.status_code == 403


def test_video_token_rejected_before_lesson_is_live(client, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get(f"/api/lessons/{lesson.lesson_id}/video-token", headers=headers)
    assert response.status_code == 409


def test_video_token_missing_lesson_is_404(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get("/api/lessons/999999/video-token", headers=headers)
    assert response.status_code == 404
