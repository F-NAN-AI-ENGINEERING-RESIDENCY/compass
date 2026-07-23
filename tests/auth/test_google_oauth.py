import pytest

import app.auth.google_oauth as google_oauth_module
from app.auth.google_oauth import GoogleTokenError, verify_google_id_token
from app.config import settings


@pytest.fixture(autouse=True)
def _client_id(monkeypatch):
    monkeypatch.setattr(settings, "google_oauth_client_id", "test-client-id.apps.googleusercontent.com")


def _mock_claims(monkeypatch, claims):
    monkeypatch.setattr(
        google_oauth_module.google_id_token, "verify_oauth2_token", lambda *args, **kwargs: claims
    )


def test_verify_returns_identity_for_valid_claims(monkeypatch):
    _mock_claims(
        monkeypatch,
        {"sub": "12345", "email": "ada@example.com", "email_verified": True, "name": "Ada Lovelace"},
    )
    identity = verify_google_id_token("fake-token")
    assert identity.sub == "12345"
    assert identity.email == "ada@example.com"
    assert identity.name == "Ada Lovelace"


def test_verify_falls_back_to_email_local_part_when_name_missing(monkeypatch):
    _mock_claims(monkeypatch, {"sub": "12345", "email": "ada@example.com", "email_verified": True})
    identity = verify_google_id_token("fake-token")
    assert identity.name == "ada"


def test_verify_rejects_unverified_email(monkeypatch):
    _mock_claims(monkeypatch, {"sub": "12345", "email": "ada@example.com", "email_verified": False})
    with pytest.raises(GoogleTokenError):
        verify_google_id_token("fake-token")


def test_verify_rejects_missing_claims(monkeypatch):
    _mock_claims(monkeypatch, {"sub": "12345", "email_verified": True})  # no email
    with pytest.raises(GoogleTokenError):
        verify_google_id_token("fake-token")


def test_verify_wraps_google_value_error(monkeypatch):
    def _raise(*args, **kwargs):
        raise ValueError("Token expired")

    monkeypatch.setattr(google_oauth_module.google_id_token, "verify_oauth2_token", _raise)
    with pytest.raises(GoogleTokenError):
        verify_google_id_token("fake-token")


def test_verify_requires_client_id_configured(monkeypatch):
    monkeypatch.setattr(settings, "google_oauth_client_id", None)
    with pytest.raises(GoogleTokenError):
        verify_google_id_token("fake-token")
