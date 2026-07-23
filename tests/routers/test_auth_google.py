import app.routers.auth as auth_router_module
from app.auth.google_oauth import GoogleIdentity, GoogleTokenError
from app.models.student import Student
from app.models.teacher import Teacher


def _mock_google_identity(monkeypatch, sub="google-sub-1", email="ada@example.com", name="Ada Lovelace"):
    monkeypatch.setattr(
        auth_router_module, "verify_google_id_token", lambda id_token: GoogleIdentity(sub=sub, email=email, name=name)
    )


def _mock_google_failure(monkeypatch, message="Invalid Google ID token: bad signature"):
    def _raise(id_token):
        raise GoogleTokenError(message)

    monkeypatch.setattr(auth_router_module, "verify_google_id_token", _raise)


def test_new_student_account_created_on_first_google_signin(client, db_session, monkeypatch):
    _mock_google_identity(monkeypatch, sub="sub-student-1", email="ada@example.com", name="Ada Lovelace")

    response = client.post("/api/auth/google", json={"idToken": "fake-token", "role": "student"})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["role"] == "student"
    assert body["accessToken"]

    student = db_session.query(Student).filter(Student.email == "ada@example.com").first()
    assert student is not None
    assert student.auth_provider == "google"
    assert student.google_sub == "sub-student-1"
    assert student.password_hash is None
    assert student.name == "Ada Lovelace"


def test_repeat_google_signin_logs_into_same_account_not_a_new_one(client, db_session, monkeypatch):
    _mock_google_identity(monkeypatch, sub="sub-repeat", email="grace@example.com")

    first = client.post("/api/auth/google", json={"idToken": "t1", "role": "student"})
    second = client.post("/api/auth/google", json={"idToken": "t2", "role": "student"})

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["userId"] == second.json()["userId"]
    assert db_session.query(Student).filter(Student.google_sub == "sub-repeat").count() == 1


def test_google_signin_links_to_existing_password_account_by_verified_email(
    client, db_session, make_teacher, monkeypatch
):
    teacher = make_teacher(username="ms_turing", email="turing@example.com", password="hunter22")
    _mock_google_identity(monkeypatch, sub="sub-link", email="turing@example.com", name="Alan Turing")

    response = client.post("/api/auth/google", json={"idToken": "t1", "role": "teacher"})
    assert response.status_code == 200, response.text
    assert response.json()["userId"] == teacher.teacher_id

    db_session.refresh(teacher)
    assert teacher.google_sub == "sub-link"
    # Linking must not clobber the existing password login path.
    assert teacher.password_hash is not None

    login = client.post(
        "/api/auth/login", json={"role": "teacher", "username": "ms_turing", "password": "hunter22"}
    )
    assert login.status_code == 200, login.text


def test_google_accounts_are_scoped_per_role(client, db_session, monkeypatch):
    _mock_google_identity(monkeypatch, sub="sub-both-roles", email="dual@example.com")

    student_resp = client.post("/api/auth/google", json={"idToken": "t1", "role": "student"})
    teacher_resp = client.post("/api/auth/google", json={"idToken": "t2", "role": "teacher"})

    assert student_resp.status_code == 200
    assert teacher_resp.status_code == 200
    assert db_session.query(Student).filter(Student.google_sub == "sub-both-roles").count() == 1
    assert db_session.query(Teacher).filter(Teacher.google_sub == "sub-both-roles").count() == 1


def test_username_collision_on_google_signup_gets_disambiguated(client, db_session, make_student, monkeypatch):
    make_student(username="ada", email="ada@example.com")  # occupies the base-username candidate
    # Different email (so this doesn't hit the email-link path above) but the
    # same email local-part, so the generated username still collides.
    _mock_google_identity(monkeypatch, sub="sub-collision", email="ada@gmail.com", name="Another Ada")

    response = client.post("/api/auth/google", json={"idToken": "t1", "role": "student"})
    assert response.status_code == 200, response.text

    new_student = db_session.query(Student).filter(Student.google_sub == "sub-collision").first()
    assert new_student.username != "ada"
    assert new_student.username.startswith("ada")


def test_invalid_google_token_is_401(client, monkeypatch):
    _mock_google_failure(monkeypatch)

    response = client.post("/api/auth/google", json={"idToken": "garbage", "role": "student"})
    assert response.status_code == 401


def test_google_signin_missing_fields_is_422(client):
    response = client.post("/api/auth/google", json={"role": "student"})
    assert response.status_code == 422
