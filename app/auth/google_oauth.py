from dataclasses import dataclass

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.config import settings


class GoogleTokenError(Exception):
    """Raised for any ID token that fails verification or isn't usable —
    wrong/missing audience, expired, malformed, unverified email. Callers
    should treat this uniformly as 401; the underlying reason is logged,
    not exposed to the client."""


@dataclass
class GoogleIdentity:
    sub: str
    email: str
    name: str


def verify_google_id_token(raw_id_token: str) -> GoogleIdentity:
    """Verifies a Google Identity Services ID token server-side against
    Google's public keys and this app's configured OAuth client id — never
    trust a token's claims without this. Real network call to Google every
    time (no local JWKS caching beyond what google-auth's Request() already
    does); acceptable at this app's scale."""
    if not settings.google_oauth_client_id:
        raise GoogleTokenError("Google sign-in is not configured (GOOGLE_OAUTH_CLIENT_ID unset)")

    try:
        claims = google_id_token.verify_oauth2_token(
            raw_id_token, google_requests.Request(), settings.google_oauth_client_id
        )
    except ValueError as exc:
        raise GoogleTokenError(f"Invalid Google ID token: {exc}") from exc

    if not claims.get("email_verified"):
        raise GoogleTokenError("Google account email is not verified")

    email = claims.get("email")
    sub = claims.get("sub")
    if not email or not sub:
        raise GoogleTokenError("Google ID token is missing required claims")

    name = claims.get("name") or email.split("@")[0]
    return GoogleIdentity(sub=sub, email=email, name=name)
