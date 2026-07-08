from app.models.class_ import _JOIN_CODE_ALPHABET, _JOIN_CODE_LENGTH


def test_class_gets_a_join_code_automatically(make_teacher, make_class):
    class_ = make_class(make_teacher())
    assert class_.join_code is not None
    assert len(class_.join_code) == _JOIN_CODE_LENGTH
    assert all(ch in _JOIN_CODE_ALPHABET for ch in class_.join_code)


def test_two_classes_get_different_join_codes(make_teacher, make_class):
    teacher = make_teacher()
    class_a = make_class(teacher, name="Class A")
    class_b = make_class(teacher, name="Class B")
    assert class_a.join_code != class_b.join_code


def test_student_consent_status_defaults_to_not_required(make_student):
    student = make_student()
    assert student.consent_status == "not_required"
