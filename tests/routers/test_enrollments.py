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


def test_list_my_enrollments_returns_only_the_students_own(
    client, make_student, make_teacher, make_class, make_enrollment
):
    student = make_student()
    other_student = make_student(username="other_s")
    teacher = make_teacher()
    class_a = make_class(teacher, name="Algebra I")
    class_b = make_class(teacher, name="Algebra II")
    make_enrollment(student, class_a)
    make_enrollment(student, class_b)
    make_enrollment(other_student, class_a)
    headers = auth_header(client, "student", student.username)

    response = client.get("/api/enrollments", headers=headers)
    assert response.status_code == 200, response.text
    class_ids = [e["classId"] for e in response.json()]
    assert class_ids == [class_a.class_id, class_b.class_id]


def test_list_my_enrollments_empty_for_unenrolled_student(client, make_student):
    student = make_student()
    headers = auth_header(client, "student", student.username)

    response = client.get("/api/enrollments", headers=headers)
    assert response.status_code == 200, response.text
    assert response.json() == []


def test_teacher_cannot_list_enrollments(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get("/api/enrollments", headers=headers)
    assert response.status_code == 403


def test_list_my_enrollments_requires_auth(client):
    response = client.get("/api/enrollments")
    assert response.status_code == 401
