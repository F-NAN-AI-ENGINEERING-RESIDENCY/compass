import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.exceptions import register_exception_handlers
from app.routers import (
    auth,
    classes,
    enrollments,
    lessons,
    materials,
    recordings,
    signals,
    students,
    transcripts,
    webhooks,
)
from app.services.lesson_scheduler import start_scheduler
from app.websockets import dashboard_ws
from app.websockets.manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # The connection manager needs the running loop so broadcast() (called
    # from service code on FastAPI's sync threadpool) can schedule sends onto
    # it via run_coroutine_threadsafe.
    manager.bind_loop(asyncio.get_running_loop())
    scheduler = start_scheduler() if settings.enable_lesson_scheduler else None
    yield
    if scheduler is not None:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title="Compass API",
    description="Backend for Compass, an AI-assisted support platform for K-12 virtual/hybrid classrooms.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router)
app.include_router(classes.router)
app.include_router(enrollments.router)
app.include_router(lessons.router)
app.include_router(materials.router)
app.include_router(recordings.router)
app.include_router(signals.router)
app.include_router(students.router)
app.include_router(transcripts.router)
app.include_router(webhooks.router)
app.include_router(dashboard_ws.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.environment}
