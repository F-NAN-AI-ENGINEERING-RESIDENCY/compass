from tests.conftest import auth_header


def test_create_class(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.post("/api/classes", json={"name": "Algebra I"}, headers=headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["name"] == "Algebra I"
    assert body["teacherId"] == teacher.teacher_id
    assert body["joinCode"]


def test_student_cannot_create_class(client, make_student):
    student = make_student()
    headers = auth_header(client, "student", student.username)

    response = client.post("/api/classes", json={"name": "Algebra I"}, headers=headers)
    assert response.status_code == 403


def test_create_class_requires_auth(client):
    response = client.post("/api/classes", json={"name": "Algebra I"})
    assert response.status_code == 401


def test_owning_teacher_gets_class(client, make_teacher, make_class, make_student, make_enrollment):
    teacher = make_teacher()
    class_ = make_class(teacher)
    student_a = make_student(username="student_a", name="Ada Lovelace")
    student_b = make_student(username="student_b", name="Grace Hopper")
    make_enrollment(student_a, class_)
    make_enrollment(student_b, class_)
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get(f"/api/classes/{class_.class_id}", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["classId"] == class_.class_id
    assert body["joinCode"] == class_.join_code
    assert [e["studentName"] for e in body["enrollments"]] == ["Ada Lovelace", "Grace Hopper"]


def test_non_owning_teacher_cannot_get_class(client, make_teacher, make_class):
    owner = make_teacher(username="owner_t")
    other = make_teacher(username="other_t")
    class_ = make_class(owner)
    headers = auth_header(client, "teacher", other.username)

    response = client.get(f"/api/classes/{class_.class_id}", headers=headers)
    assert response.status_code == 403


def test_enrolled_student_gets_class(client, make_student, make_teacher, make_class, make_enrollment):
    student = make_student()
    teacher = make_teacher()
    class_ = make_class(teacher)
    make_enrollment(student, class_)
    headers = auth_header(client, "student", student.username)

    response = client.get(f"/api/classes/{class_.class_id}", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["classId"] == class_.class_id
    assert body["alertThreshold"] == "0.50"


def test_enrolled_student_does_not_see_roster(client, make_student, make_teacher, make_class, make_enrollment):
    student = make_student(username="student_a")
    classmate = make_student(username="student_b", name="Grace Hopper")
    teacher = make_teacher()
    class_ = make_class(teacher)
    make_enrollment(student, class_)
    make_enrollment(classmate, class_)
    headers = auth_header(client, "student", student.username)

    response = client.get(f"/api/classes/{class_.class_id}", headers=headers)
    assert response.status_code == 200, response.text
    assert response.json()["enrollments"] is None


def test_non_enrolled_student_cannot_get_class(client, make_student, make_teacher, make_class):
    student = make_student()
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "student", student.username)

    response = client.get(f"/api/classes/{class_.class_id}", headers=headers)
    assert response.status_code == 403


def test_get_missing_class_is_404(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.get("/api/classes/999999", headers=headers)
    assert response.status_code == 404
