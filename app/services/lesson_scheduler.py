import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.config import settings
from app.database import SessionLocal
from app.services import lesson_service
from app.services.video import get_video_service

logger = logging.getLogger(__name__)

CHECK_INTERVAL_SECONDS = 60


def check_for_inactive_lessons() -> None:
    db = SessionLocal()
    try:
        ended = lesson_service.end_inactive_lessons(
            db,
            get_video_service(),
            datetime.now(timezone.utc),
            settings.lesson_inactivity_timeout_minutes,
        )
        for lesson in ended:
            logger.info("Auto-ended inactive lesson %s", lesson.lesson_id)
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_for_inactive_lessons, "interval", seconds=CHECK_INTERVAL_SECONDS)
    scheduler.start()
    return scheduler
