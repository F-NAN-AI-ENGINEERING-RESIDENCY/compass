from tests.conftest import auth_header


def _create(client, headers, class_id, unit="Unit 1", display_name="Worksheet"):
    return client.post(
        f"/api/classes/{class_id}/materials",
        json={"unit": unit, "displayName": display_name},
        headers=headers,
    )


def test_create_material(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "teacher", teacher.username)

    response = _create(client, headers, class_.class_id, unit="Unit 1", display_name="Worksheet 1")
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["classId"] == class_.class_id
    assert body["unit"] == "Unit 1"
    assert body["displayName"] == "Worksheet 1"
    assert body["position"] == 0


def test_second_material_in_unit_gets_next_position(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "teacher", teacher.username)

    _create(client, headers, class_.class_id, unit="Unit 1", display_name="Worksheet 1")
    response = _create(client, headers, class_.class_id, unit="Unit 1", display_name="Worksheet 2")
    assert response.json()["position"] == 1


def test_positions_are_scoped_per_unit(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "teacher", teacher.username)

    _create(client, headers, class_.class_id, unit="Unit 1", display_name="Worksheet 1")
    response = _create(client, headers, class_.class_id, unit="Unit 2", display_name="Slides")
    assert response.json()["position"] == 0


def test_student_cannot_create_material(client, make_student, make_teacher, make_class):
    student = make_student()
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "student", student.username)

    response = _create(client, headers, class_.class_id)
    assert response.status_code == 403


def test_non_owning_teacher_cannot_create_material(client, make_teacher, make_class):
    owner = make_teacher(username="owner_t")
    other = make_teacher(username="other_t")
    class_ = make_class(owner)
    headers = auth_header(client, "teacher", other.username)

    response = _create(client, headers, class_.class_id)
    assert response.status_code == 403


def test_create_material_missing_class_is_404(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = _create(client, headers, 999999)
    assert response.status_code == 404


def test_list_materials_ordered_by_unit_then_position(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "teacher", teacher.username)

    _create(client, headers, class_.class_id, unit="Unit 2", display_name="Slides")
    _create(client, headers, class_.class_id, unit="Unit 1", display_name="Worksheet 1")
    _create(client, headers, class_.class_id, unit="Unit 1", display_name="Worksheet 2")

    response = client.get(f"/api/classes/{class_.class_id}/materials", headers=headers)
    assert response.status_code == 200, response.text
    names = [(m["unit"], m["displayName"]) for m in response.json()]
    assert names == [("Unit 1", "Worksheet 1"), ("Unit 1", "Worksheet 2"), ("Unit 2", "Slides")]


def test_list_materials_excludes_soft_deleted(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "teacher", teacher.username)

    material_id = _create(client, headers, class_.class_id).json()["materialId"]
    client.delete(f"/api/materials/{material_id}", headers=headers)

    response = client.get(f"/api/classes/{class_.class_id}/materials", headers=headers)
    assert response.json() == []


def test_non_enrolled_student_cannot_list_materials(client, make_student, make_teacher, make_class):
    student = make_student()
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "student", student.username)

    response = client.get(f"/api/classes/{class_.class_id}/materials", headers=headers)
    assert response.status_code == 403


def test_enrolled_student_can_list_materials(
    client, make_student, make_teacher, make_class, make_enrollment
):
    student = make_student()
    teacher = make_teacher()
    class_ = make_class(teacher)
    make_enrollment(student, class_)
    teacher_headers = auth_header(client, "teacher", teacher.username)
    _create(client, teacher_headers, class_.class_id, unit="Unit 1", display_name="Worksheet 1")

    student_headers = auth_header(client, "student", student.username)
    response = client.get(f"/api/classes/{class_.class_id}/materials", headers=student_headers)
    assert response.status_code == 200, response.text
    assert response.json()[0]["displayName"] == "Worksheet 1"


def test_list_materials_requires_auth(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)

    response = client.get(f"/api/classes/{class_.class_id}/materials")
    assert response.status_code == 401


def test_owning_teacher_can_rename_material(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "teacher", teacher.username)

    material_id = _create(client, headers, class_.class_id, display_name="Old Name").json()["materialId"]
    response = client.patch(
        f"/api/materials/{material_id}", json={"displayName": "New Name"}, headers=headers
    )
    assert response.status_code == 200, response.text
    assert response.json()["displayName"] == "New Name"


def test_non_owning_teacher_cannot_rename_material(client, make_teacher, make_class):
    owner = make_teacher(username="owner_t2")
    other = make_teacher(username="other_t2")
    class_ = make_class(owner)
    headers = auth_header(client, "teacher", owner.username)
    material_id = _create(client, headers, class_.class_id).json()["materialId"]

    other_headers = auth_header(client, "teacher", other.username)
    response = client.patch(
        f"/api/materials/{material_id}", json={"displayName": "Hijacked"}, headers=other_headers
    )
    assert response.status_code == 403


def test_rename_missing_material_is_404(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.patch("/api/materials/999999", json={"displayName": "Nope"}, headers=headers)
    assert response.status_code == 404


def test_owning_teacher_can_delete_material(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "teacher", teacher.username)
    material_id = _create(client, headers, class_.class_id).json()["materialId"]

    response = client.delete(f"/api/materials/{material_id}", headers=headers)
    assert response.status_code == 204

    rename_response = client.patch(
        f"/api/materials/{material_id}", json={"displayName": "Nope"}, headers=headers
    )
    assert rename_response.status_code == 404


def test_non_owning_teacher_cannot_delete_material(client, make_teacher, make_class):
    owner = make_teacher(username="owner_t3")
    other = make_teacher(username="other_t3")
    class_ = make_class(owner)
    headers = auth_header(client, "teacher", owner.username)
    material_id = _create(client, headers, class_.class_id).json()["materialId"]

    other_headers = auth_header(client, "teacher", other.username)
    response = client.delete(f"/api/materials/{material_id}", headers=other_headers)
    assert response.status_code == 403


def test_delete_missing_material_is_404(client, make_teacher):
    teacher = make_teacher()
    headers = auth_header(client, "teacher", teacher.username)

    response = client.delete("/api/materials/999999", headers=headers)
    assert response.status_code == 404


def test_owning_teacher_can_reorder_materials(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "teacher", teacher.username)

    first = _create(client, headers, class_.class_id, unit="Unit 1", display_name="First").json()
    second = _create(client, headers, class_.class_id, unit="Unit 1", display_name="Second").json()
    third = _create(client, headers, class_.class_id, unit="Unit 1", display_name="Third").json()

    response = client.patch(
        f"/api/classes/{class_.class_id}/materials/reorder",
        json={"unit": "Unit 1", "materialIds": [third["materialId"], first["materialId"], second["materialId"]]},
        headers=headers,
    )
    assert response.status_code == 200, response.text
    assert [m["displayName"] for m in response.json()] == ["Third", "First", "Second"]

    list_response = client.get(f"/api/classes/{class_.class_id}/materials", headers=headers)
    assert [m["displayName"] for m in list_response.json()] == ["Third", "First", "Second"]


def test_reorder_rejects_partial_id_list(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "teacher", teacher.username)

    first = _create(client, headers, class_.class_id, unit="Unit 1", display_name="First").json()
    _create(client, headers, class_.class_id, unit="Unit 1", display_name="Second").json()

    response = client.patch(
        f"/api/classes/{class_.class_id}/materials/reorder",
        json={"unit": "Unit 1", "materialIds": [first["materialId"]]},
        headers=headers,
    )
    assert response.status_code == 409


def test_reorder_does_not_affect_other_units(client, make_teacher, make_class):
    teacher = make_teacher()
    class_ = make_class(teacher)
    headers = auth_header(client, "teacher", teacher.username)

    unit1_first = _create(client, headers, class_.class_id, unit="Unit 1", display_name="U1-First").json()
    unit1_second = _create(client, headers, class_.class_id, unit="Unit 1", display_name="U1-Second").json()
    _create(client, headers, class_.class_id, unit="Unit 2", display_name="U2-Only")

    client.patch(
        f"/api/classes/{class_.class_id}/materials/reorder",
        json={"unit": "Unit 1", "materialIds": [unit1_second["materialId"], unit1_first["materialId"]]},
        headers=headers,
    )

    list_response = client.get(f"/api/classes/{class_.class_id}/materials", headers=headers)
    names = [(m["unit"], m["displayName"]) for m in list_response.json()]
    assert names == [("Unit 1", "U1-Second"), ("Unit 1", "U1-First"), ("Unit 2", "U2-Only")]


def test_non_owning_teacher_cannot_reorder(client, make_teacher, make_class):
    owner = make_teacher(username="owner_t4")
    other = make_teacher(username="other_t4")
    class_ = make_class(owner)
    headers = auth_header(client, "teacher", owner.username)
    material = _create(client, headers, class_.class_id).json()

    other_headers = auth_header(client, "teacher", other.username)
    response = client.patch(
        f"/api/classes/{class_.class_id}/materials/reorder",
        json={"unit": "Unit 1", "materialIds": [material["materialId"]]},
        headers=other_headers,
    )
    assert response.status_code == 403
