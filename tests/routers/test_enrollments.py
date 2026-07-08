from tests.conftest import auth_header


def test_enroll_with_valid_join_code(client, make_student, make_teacher, make_class):
    student = make_student()
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "student", student.username)

    response = client.post("/api/enrollments", json={"joinCode": class_.join_code}, headers=headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["studentId"] == student.student_id
    assert body["classId"] == class_.class_id


def test_teacher_cannot_enroll(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "teacher", teacher.username)

    response = client.post("/api/enrollments", json={"joinCode": class_.join_code}, headers=headers)
    assert response.status_code == 403


def test_enroll_requires_auth(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)

    response = client.post("/api/enrollments", json={"joinCode": class_.join_code})
    assert response.status_code == 401


def test_enroll_with_unknown_join_code_is_404(client, make_student):
    student = make_student()
    headers = auth_header(client, "student", student.username)

    response = client.post("/api/enrollments", json={"joinCode": "NOPE123"}, headers=headers)
    assert response.status_code == 404


def test_enroll_duplicate_is_409(client, make_student, make_teacher, make_class, make_enrollment):
    student = make_student()
    teacher = make_teacher()
    class_ = make_class(teacher)
    make_enrollment(student, class_)
    headers = auth_header(client, "student", student.username)

    response = client.post("/api/enrollments", json={"joinCode": class_.join_code}, headers=headers)
    assert response.status_code == 409
