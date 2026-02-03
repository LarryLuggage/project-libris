from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.logging_config import setup_logging
from app.models import Base
from app.routers import books, feed, health, interactions

logger = setup_logging(__name__)


def create_app() -> FastAPI:
    """Application factory."""
    application = FastAPI(
        title="Project LIBRIS",
        description="TikTok for Books - Serving atomic literature",
        version="1.0.0",
    )

    # CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API v1 routes
    application.include_router(feed.router, prefix="/api/v1")
    application.include_router(books.router, prefix="/api/v1")
    application.include_router(health.router, prefix="/api/v1")
    application.include_router(interactions.router, prefix="/api/v1")

    # Legacy routes for backward compatibility (deprecated)
    application.include_router(feed.router, prefix="", deprecated=True)

    logger.info("LIBRIS API initialized")
    return application


# Create tables on startup
Base.metadata.create_all(bind=engine)

app = create_app()
