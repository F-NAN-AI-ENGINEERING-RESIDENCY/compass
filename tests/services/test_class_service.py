from app.services import class_service


def test_generate_unique_join_code_retries_past_a_collision(db_session, make_teacher, make_class, monkeypatch):
    taken_class = make_class(make_teacher())
    taken_code = taken_class.join_code

    candidates = iter([taken_code, "FRESH01"])
    monkeypatch.setattr("app.services.class_service.generate_join_code", lambda: next(candidates))

    code = class_service.generate_unique_join_code(db_session)
    assert code == "FRESH01"


def test_generate_unique_join_code_gives_up_after_max_attempts(db_session, make_teacher, make_class, monkeypatch):
    taken_class = make_class(make_teacher())
    monkeypatch.setattr("app.services.class_service.generate_join_code", lambda: taken_class.join_code)

    try:
        class_service.generate_unique_join_code(db_session, max_attempts=3)
        assert False, "expected RuntimeError"
    except RuntimeError:
        pass
