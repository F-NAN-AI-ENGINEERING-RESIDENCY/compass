from datetime import datetime, timedelta, timezone

from app.models.session import Session
from tests.conftest import auth_header


def test_register_student(client):
    response = client.post(
        "/api/auth/register",
        json={"role": "student", "username": "ada", "name": "Ada Lovelace", "email": "ada@example.com", "password": "hunter22"},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["username"] == "ada"
    assert body["role"] == "student"
    assert "password" not in body


def test_register_duplicate_username_is_409(client, make_student):
    make_student(username="ada")
    response = client.post(
        "/api/auth/register",
        json={"role": "student", "username": "ada", "name": "Someone Else", "email": "other@example.com", "password": "hunter22"},
    )
    assert response.status_code == 409


def test_login_wrong_password_is_401(client, make_student):
    make_student(username="ada", password="correct-password")
    response = client.post("/api/auth/login", json={"role": "student", "username": "ada", "password": "wrong"})
    assert response.status_code == 401


def test_login_success_returns_session_token(client, make_teacher):
    make_teacher(username="ms_turing", password="hunter22")
    response = client.post(
        "/api/auth/login", json={"role": "teacher", "username": "ms_turing", "password": "hunter22"}
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["role"] == "teacher"
    assert body["accessToken"]


def test_get_me_requires_auth(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_get_and_patch_me(client, make_student):
    student = make_student(username="ada")
    headers = auth_header(client, "student", "ada")

    get_response = client.get("/api/auth/me", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["username"] == "ada"

    patch_response = client.patch("/api/auth/me", headers=headers, json={"name": "Ada, Countess of Lovelace"})
    assert patch_response.status_code == 200
    assert patch_response.json()["name"] == "Ada, Countess of Lovelace"


def test_logout_then_reuse_token_is_401(client, make_student):
    make_student(username="ada")
    headers = auth_header(client, "student", "ada")

    logout_response = client.post("/api/auth/logout", headers=headers)
    assert logout_response.status_code == 200

    reuse_response = client.get("/api/auth/me", headers=headers)
    assert reuse_response.status_code == 401


def test_expired_session_is_401(client, db_session, make_student):
    make_student(username="ada")
    headers = auth_header(client, "student", "ada")
    token = headers["Authorization"].split(" ", 1)[1]

    session = db_session.query(Session).filter(Session.token == token).one()
    session.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db_session.commit()

    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401
