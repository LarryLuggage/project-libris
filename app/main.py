from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.logging_config import setup_logging
from app.routers import auth, books, comments, feed, health, interactions, reviews, story_club

logger = setup_logging(__name__)


def create_app() -> FastAPI:
    """Application factory."""
    application = FastAPI(
        title="Project LIBRIS",
        description="TikTok for Books - Serving atomic literature",
        version="1.0.0",
    )

    settings = get_settings()

    # CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_origins != ["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global exception handlers
    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"detail": "Invalid request parameters", "error_code": "VALIDATION_ERROR"},
        )

    @application.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error_code": "INTERNAL_ERROR"},
        )

    # API v1 routes
    application.include_router(feed.router, prefix="/api/v1")
    application.include_router(books.router, prefix="/api/v1")
    application.include_router(health.router, prefix="/api/v1")
    application.include_router(interactions.router, prefix="/api/v1")
    application.include_router(comments.router, prefix="/api/v1")
    application.include_router(reviews.router, prefix="/api/v1")
    application.include_router(auth.router, prefix="/api/v1")
    application.include_router(story_club.router, prefix="/api/v1")


    # Legacy routes for backward compatibility (deprecated)
    application.include_router(feed.router, prefix="", deprecated=True)

    logger.info("LIBRIS API initialized")
    return application


app = create_app()
