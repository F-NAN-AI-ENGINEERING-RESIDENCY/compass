from tests.conftest import auth_header


def test_owning_teacher_lists_recordings(client, make_teacher, make_class, make_lesson, make_recording):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    make_recording(lesson)
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get(f"/api/lessons/{lesson.lesson_id}/recordings", headers=headers)

    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body) == 1
    assert body[0]["status"] == "ready"
    assert body[0]["durationSeconds"] == 300


def test_non_owning_teacher_cannot_list_recordings(client, make_teacher, make_class, make_lesson, make_recording):
    owner = make_teacher(username="owner_t")
    other = make_teacher(username="other_t")
    class_ = make_class(owner)
    lesson = make_lesson(class_)
    make_recording(lesson)
    headers = auth_header(client, "teacher", other.username)

    response = client.get(f"/api/lessons/{lesson.lesson_id}/recordings", headers=headers)
    assert response.status_code == 403


def test_student_cannot_list_recordings(client, make_teacher, make_student, make_class, make_lesson, make_recording):
    teacher = make_teacher()
    student = make_student()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    make_recording(lesson)
    headers = auth_header(client, "student", student.username)

    response = client.get(f"/api/lessons/{lesson.lesson_id}/recordings", headers=headers)
    assert response.status_code == 403


def test_list_recordings_missing_lesson_is_404(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get("/api/lessons/999999/recordings", headers=headers)
    assert response.status_code == 404


def test_owning_teacher_gets_access_link(client, make_teacher, make_class, make_lesson, make_recording):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    recording = make_recording(lesson, provider_recording_id="rec-xyz")
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get(f"/api/recordings/{recording.recording_id}/access-link", headers=headers)

    assert response.status_code == 200, response.text
    assert response.json()["accessLink"] == "https://fake.daily.co/recordings/rec-xyz/download"


def test_non_owning_teacher_cannot_get_access_link(client, make_teacher, make_class, make_lesson, make_recording):
    owner = make_teacher(username="owner_t")
    other = make_teacher(username="other_t")
    class_ = make_class(owner)
    lesson = make_lesson(class_)
    recording = make_recording(lesson)
    headers = auth_header(client, "teacher", other.username)

    response = client.get(f"/api/recordings/{recording.recording_id}/access-link", headers=headers)
    assert response.status_code == 403


def test_access_link_missing_recording_is_404(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get("/api/recordings/999999/access-link", headers=headers)
    assert response.status_code == 404
