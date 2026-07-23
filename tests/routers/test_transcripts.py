from tests.conftest import auth_header


def test_owning_teacher_gets_transcript_ordered_by_offset(
    client, make_teacher, make_class, make_lesson, make_recording, make_transcript_chunk
):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    recording = make_recording(lesson)
    make_transcript_chunk(lesson, recording, text="second", start_offset_seconds=5.0, end_offset_seconds=9.0)
    make_transcript_chunk(lesson, recording, text="first", start_offset_seconds=0.0, end_offset_seconds=4.5)
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get(f"/api/lessons/{lesson.lesson_id}/transcript", headers=headers)

    assert response.status_code == 200, response.text
    body = response.json()
    assert [chunk["text"] for chunk in body] == ["first", "second"]


def test_non_owning_teacher_cannot_get_transcript(
    client, make_teacher, make_class, make_lesson, make_recording, make_transcript_chunk
):
    owner = make_teacher(username="owner_t")
    other = make_teacher(username="other_t")
    class_ = make_class(owner)
    lesson = make_lesson(class_)
    recording = make_recording(lesson)
    make_transcript_chunk(lesson, recording)
    headers = auth_header(client, "teacher", other.username)

    response = client.get(f"/api/lessons/{lesson.lesson_id}/transcript", headers=headers)
    assert response.status_code == 403


def test_student_cannot_get_transcript(client, make_teacher, make_student, make_class, make_lesson):
    teacher = make_teacher()
    student = make_student()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    headers = auth_header(client, "student", student.username)

    response = client.get(f"/api/lessons/{lesson.lesson_id}/transcript", headers=headers)
    assert response.status_code == 403


def test_transcript_missing_lesson_is_404(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get("/api/lessons/999999/transcript", headers=headers)
    assert response.status_code == 404


def test_transcript_empty_before_any_recording(client, make_teacher, make_class, make_lesson):
    teacher = make_teacher()
    class_ = make_class(teacher)
    lesson = make_lesson(class_)
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get(f"/api/lessons/{lesson.lesson_id}/transcript", headers=headers)
    assert response.status_code == 200
    assert response.json() == []
