from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.exceptions import register_exception_handlers
from app.routers import auth, lessons


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing to do yet — DB connections are opened per-request via
    # app.dependencies.get_db, and the WebSocket connection manager (added in
    # a later step) will register itself here.
    yield
    # Shutdown: nothing to do yet.


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
app.include_router(lessons.router)

# Remaining routers are registered here in a later step, e.g.:
# from app.routers import signals, dashboard
# app.include_router(signals.router)
# app.include_router(dashboard.router)

# WebSocket route is registered here in a later step, e.g.:
# from app.websockets import dashboard_ws
# app.include_router(dashboard_ws.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.environment}
