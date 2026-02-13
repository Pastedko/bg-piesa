"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import get_settings
from .database import init_db, session_scope
from .migrations import run_migrations
from .routers import admin, authors, library, plays
from .seed_data import seed_demo_data


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="bgpiesa API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(authors.router)
    app.include_router(plays.router)
    app.include_router(library.router)
    app.include_router(admin.router)

    app.mount(
        settings.media_url_prefix,
        StaticFiles(directory=settings.media_root),
        name="media",
    )

    @app.get("/api/health")
    def healthcheck():
        return {"status": "ok", "app": settings.app_name}

    @app.on_event("startup")
    def on_startup():
        init_db()
        run_migrations()
        with session_scope() as session:
            seed_demo_data(session)

    return app


app = create_app()

