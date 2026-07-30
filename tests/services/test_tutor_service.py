from app.services import tutor


def test_fake_tutor_service_is_deterministic_and_network_free():
    service = tutor.FakeTutorService()
    first = service.get_response([{"role": "user", "content": "I'm stuck on fractions"}])
    second = service.get_response([{"role": "user", "content": "Something totally different"}])

    assert first == second
    assert isinstance(first, str) and first


def test_find_or_create_session_creates_a_new_session(db_session, make_student):
    student = make_student()

    session = tutor.find_or_create_session(db_session, student.student_id, None)

    assert session.session_id is not None
    assert session.student_id == student.student_id
    assert session.lesson_id is None


def test_find_or_create_session_reuses_existing_session_for_same_student_and_lesson(
    db_session, make_student, make_teacher, make_class, make_lesson
):
    student = make_student()
    lesson = make_lesson(make_class(make_teacher()))

    first = tutor.find_or_create_session(db_session, student.student_id, lesson.lesson_id)
    second = tutor.find_or_create_session(db_session, student.student_id, lesson.lesson_id)

    assert first.session_id == second.session_id


def test_find_or_create_session_treats_no_lesson_separately_from_a_lesson(
    db_session, make_student, make_teacher, make_class, make_lesson
):
    student = make_student()
    lesson = make_lesson(make_class(make_teacher()))

    no_lesson_session = tutor.find_or_create_session(db_session, student.student_id, None)
    lesson_session = tutor.find_or_create_session(db_session, student.student_id, lesson.lesson_id)

    assert no_lesson_session.session_id != lesson_session.session_id


def test_add_message_persists_sender_and_text(db_session, make_student):
    student = make_student()
    session = tutor.find_or_create_session(db_session, student.student_id, None)

    message = tutor.add_message(db_session, session, sender="student", text="What is a fraction?")

    assert message.message_id is not None
    assert message.sender == "student"
    assert message.message_text == "What is a fraction?"


def test_build_message_history_maps_sender_to_gemini_roles_in_order(db_session, make_student):
    student = make_student()
    session = tutor.find_or_create_session(db_session, student.student_id, None)
    tutor.add_message(db_session, session, sender="student", text="I'm stuck")
    tutor.add_message(db_session, session, sender="ai", text="What have you tried?")
    tutor.add_message(db_session, session, sender="student", text="I tried X")

    history = tutor.build_message_history(db_session, session)

    assert history == [
        {"role": "user", "content": "I'm stuck"},
        {"role": "model", "content": "What have you tried?"},
        {"role": "user", "content": "I tried X"},
    ]


def test_get_tutor_service_falls_back_to_fake_when_no_api_key(monkeypatch):
    monkeypatch.setattr(tutor, "_tutor_service", None)
    monkeypatch.setattr(tutor.settings, "gemini_api_key", None)

    service = tutor.get_tutor_service()

    assert isinstance(service, tutor.FakeTutorService)


def test_get_tutor_service_uses_gemini_when_api_key_is_set(monkeypatch):
    monkeypatch.setattr(tutor, "_tutor_service", None)
    monkeypatch.setattr(tutor.settings, "gemini_api_key", "fake-test-key")

    service = tutor.get_tutor_service()

    assert isinstance(service, tutor.GeminiTutorService)
