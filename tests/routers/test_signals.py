from app.models.confusion_signal import ConfusionSignal
from tests.conftest import auth_header


def _make_live_lesson(client, make_teacher, make_class, make_lesson, teacher=None):
    teacher = teacher or make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    headers = auth_header(client, "teacher", teacher.username)
    client.patch(f"/api/lessons/{lesson.lesson_id}", json={"status": "live"}, headers=headers)
    return teacher, class_, lesson


def test_enrolled_student_can_signal_on_a_live_lesson(
    client, make_teacher, make_student, make_class, make_enrollment, make_lesson
):
    student = make_student()
    teacher, class_, lesson = _make_live_lesson(client, make_teacher, make_class, make_lesson)
    make_enrollment(student, class_)
    headers = auth_header(client, "student", student.username)

    response = client.post(f"/api/lessons/{lesson.lesson_id}/signals", headers=headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["status"] == "open"
    assert body["lessonId"] == lesson.lesson_id
    assert "studentId" not in body and "studentName" not in body


def test_non_enrolled_student_cannot_signal(client, make_teacher, make_student, make_class, make_lesson):
    student = make_student()
    teacher, class_, lesson = _make_live_lesson(client, make_teacher, make_class, make_lesson)
    headers = auth_header(client, "student", student.username)

    response = client.post(f"/api/lessons/{lesson.lesson_id}/signals", headers=headers)
    assert response.status_code == 403


def test_teacher_cannot_create_a_signal(client, make_teacher, make_class, make_lesson):
    teacher, class_, lesson = _make_live_lesson(client, make_teacher, make_class, make_lesson)
    headers = auth_header(client, "teacher", teacher.username)

    response = client.post(f"/api/lessons/{lesson.lesson_id}/signals", headers=headers)
    assert response.status_code == 403


def test_cannot_signal_a_lesson_that_isnt_live(
    client, make_teacher, make_student, make_class, make_enrollment, make_lesson
):
    teacher = make_teacher()
    student = make_student()
    class_ = make_class(teacher)
    make_enrollment(student, class_)
    lesson = make_lesson(class_)  # still "scheduled"
    headers = auth_header(client, "student", student.username)

    response = client.post(f"/api/lessons/{lesson.lesson_id}/signals", headers=headers)
    assert response.status_code == 409


def test_signal_missing_lesson_is_404(client, make_student):
    student = make_student()
    headers = auth_header(client, "student", student.username)
    response = client.post("/api/lessons/999999/signals", headers=headers)
    assert response.status_code == 404


def test_owning_teacher_can_acknowledge_signal_and_sees_identity(
    client, make_teacher, make_student, make_class, make_enrollment, make_lesson
):
    student = make_student(username="ada")
    teacher, class_, lesson = _make_live_lesson(client, make_teacher, make_class, make_lesson)
    make_enrollment(student, class_)
    student_headers = auth_header(client, "student", student.username)
    create_response = client.post(f"/api/lessons/{lesson.lesson_id}/signals", headers=student_headers)
    signal_id = create_response.json()["signalId"]

    teacher_headers = auth_header(client, "teacher", teacher.username)
    response = client.patch(
        f"/api/lessons/{lesson.lesson_id}/signals/{signal_id}",
        json={"status": "acknowledged"},
        headers=teacher_headers,
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "acknowledged"
    assert body["studentId"] == student.student_id
    assert body["studentName"] == student.name


def test_non_owning_teacher_cannot_update_signal(
    client, make_teacher, make_student, make_class, make_enrollment, make_lesson
):
    student = make_student()
    owner, class_, lesson = _make_live_lesson(client, make_teacher, make_class, make_lesson, teacher=make_teacher(username="owner_t"))
    make_enrollment(student, class_)
    student_headers = auth_header(client, "student", student.username)
    create_response = client.post(f"/api/lessons/{lesson.lesson_id}/signals", headers=student_headers)
    signal_id = create_response.json()["signalId"]

    other_teacher = make_teacher(username="other_t")
    other_headers = auth_header(client, "teacher", other_teacher.username)
    response = client.patch(
        f"/api/lessons/{lesson.lesson_id}/signals/{signal_id}", json={"status": "acknowledged"}, headers=other_headers
    )
    assert response.status_code == 403


def test_student_cannot_update_signal(client, make_teacher, make_student, make_class, make_enrollment, make_lesson):
    student = make_student()
    teacher, class_, lesson = _make_live_lesson(client, make_teacher, make_class, make_lesson)
    make_enrollment(student, class_)
    student_headers = auth_header(client, "student", student.username)
    create_response = client.post(f"/api/lessons/{lesson.lesson_id}/signals", headers=student_headers)
    signal_id = create_response.json()["signalId"]

    response = client.patch(
        f"/api/lessons/{lesson.lesson_id}/signals/{signal_id}",
        json={"status": "acknowledged"},
        headers=student_headers,
    )
    assert response.status_code == 403


def test_update_missing_signal_is_404(client, make_teacher, make_class, make_lesson):
    teacher, class_, lesson = _make_live_lesson(client, make_teacher, make_class, make_lesson)
    headers = auth_header(client, "teacher", teacher.username)
    response = client.patch(
        f"/api/lessons/{lesson.lesson_id}/signals/00000000-0000-0000-0000-000000000000",
        json={"status": "acknowledged"},
        headers=headers,
    )
    assert response.status_code == 404


def test_owning_teacher_can_delete_signal(
    client, db_session, make_teacher, make_student, make_class, make_enrollment, make_lesson
):
    student = make_student()
    teacher, class_, lesson = _make_live_lesson(client, make_teacher, make_class, make_lesson)
    make_enrollment(student, class_)
    student_headers = auth_header(client, "student", student.username)
    create_response = client.post(f"/api/lessons/{lesson.lesson_id}/signals", headers=student_headers)
    signal_id = create_response.json()["signalId"]

    teacher_headers = auth_header(client, "teacher", teacher.username)
    response = client.delete(f"/api/lessons/{lesson.lesson_id}/signals/{signal_id}", headers=teacher_headers)
    assert response.status_code == 204

    remaining = db_session.query(ConfusionSignal).filter(ConfusionSignal.public_id == signal_id).first()
    assert remaining is None


def test_non_owning_teacher_cannot_delete_signal(
    client, make_teacher, make_student, make_class, make_enrollment, make_lesson
):
    student = make_student()
    owner, class_, lesson = _make_live_lesson(client, make_teacher, make_class, make_lesson, teacher=make_teacher(username="owner_t2"))
    make_enrollment(student, class_)
    student_headers = auth_header(client, "student", student.username)
    create_response = client.post(f"/api/lessons/{lesson.lesson_id}/signals", headers=student_headers)
    signal_id = create_response.json()["signalId"]

    other_teacher = make_teacher(username="other_t2")
    other_headers = auth_header(client, "teacher", other_teacher.username)
    response = client.delete(f"/api/lessons/{lesson.lesson_id}/signals/{signal_id}", headers=other_headers)
    assert response.status_code == 403


def test_dashboard_shows_open_count_and_identity(
    client, make_teacher, make_student, make_class, make_enrollment, make_lesson
):
    student = make_student(username="ada")
    teacher, class_, lesson = _make_live_lesson(client, make_teacher, make_class, make_lesson)
    make_enrollment(student, class_)
    student_headers = auth_header(client, "student", student.username)
    client.post(f"/api/lessons/{lesson.lesson_id}/signals", headers=student_headers)

    teacher_headers = auth_header(client, "teacher", teacher.username)
    response = client.get(f"/api/lessons/{lesson.lesson_id}/dashboard", headers=teacher_headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["openSignalCount"] == 1
    assert len(body["signals"]) == 1
    assert body["signals"][0]["studentId"] == student.student_id
    assert body["signals"][0]["studentName"] == student.name


def test_dashboard_forbidden_for_non_owning_teacher(client, make_teacher, make_class, make_lesson):
    owner, class_, lesson = _make_live_lesson(client, make_teacher, make_class, make_lesson, teacher=make_teacher(username="owner_t3"))
    other_teacher = make_teacher(username="other_t3")
    other_headers = auth_header(client, "teacher", other_teacher.username)

    response = client.get(f"/api/lessons/{lesson.lesson_id}/dashboard", headers=other_headers)
    assert response.status_code == 403


def test_dashboard_forbidden_for_student(client, make_teacher, make_student, make_class, make_lesson):
    student = make_student()
    teacher, class_, lesson = _make_live_lesson(client, make_teacher, make_class, make_lesson)
    headers = auth_header(client, "student", student.username)

    response = client.get(f"/api/lessons/{lesson.lesson_id}/dashboard", headers=headers)
    assert response.status_code == 403


def test_get_lesson_works_for_any_authenticated_role(client, make_teacher, make_student, make_class, make_lesson):
    teacher = make_teacher()
    student = make_student()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)

    for role, username in (("teacher", teacher.username), ("student", student.username)):
        headers = auth_header(client, role, username)
        response = client.get(f"/api/lessons/{lesson.lesson_id}", headers=headers)
        assert response.status_code == 200, response.text


def test_get_lesson_requires_auth(client, make_teacher, make_class, make_lesson):
    lesson = make_lesson(make_class(make_teacher()))
    response = client.get(f"/api/lessons/{lesson.lesson_id}")
    assert response.status_code == 401
