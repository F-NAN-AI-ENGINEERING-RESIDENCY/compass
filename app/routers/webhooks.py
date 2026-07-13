import base64
import hashlib
import hmac
import json

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_db
from app.services import recording_service
from app.services.transcript_service import run_transcription_job

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

RECORDING_READY_EVENT = "recording.ready-to-download"


def _verify_signature(raw_body: bytes, timestamp: str, signature: str) -> bool:
    """Verifies Daily's webhook HMAC: base64(hmac_sha256(base64-decoded
    DAILY_WEBHOOK_SECRET, f"{timestamp}.{raw_body}")), compared to the
    X-Webhook-Signature header. See Daily's webhook verification docs.

    Deliberately not enforcing a staleness window on the timestamp: a
    replayed (old but validly-signed) request just hits the idempotent
    upsert's no-op path, so a freshness check would add complexity without
    closing any real gap."""
    if not timestamp or not signature or not settings.daily_webhook_secret:
        return False
    try:
        secret = base64.b64decode(settings.daily_webhook_secret)
    except (ValueError, TypeError):
        return False
    signed_content = f"{timestamp}.{raw_body.decode('utf-8')}".encode("utf-8")
    expected = base64.b64encode(hmac.new(secret, signed_content, hashlib.sha256).digest()).decode("utf-8")
    return hmac.compare_digest(expected, signature)


@router.post("/daily", status_code=status.HTTP_200_OK)
async def daily_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_webhook_timestamp: str = Header(default=None),
    x_webhook_signature: str = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    raw_body = await request.body()
    if not _verify_signature(raw_body, x_webhook_timestamp, x_webhook_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")

    event = json.loads(raw_body)
    # Unknown event types are 200'd and ignored rather than rejected, so Daily
    # doesn't retry an event we were never going to act on.
    if event.get("type") != RECORDING_READY_EVENT:
        return {"ignored": True}

    recording, created = recording_service.upsert_recording_from_webhook(db, event.get("payload") or {})
    # Only a first insert enqueues the job — the idempotent-upsert short
    # circuit above must never re-trigger transcription on a replay.
    if created and recording is not None:
        background_tasks.add_task(run_transcription_job, recording.recording_id)
    return {"ok": True}
