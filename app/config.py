from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Database
    database_url: str = "postgresql+psycopg2://localhost/libris"

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    # Feed settings
    vibe_threshold: float = 0.6
    page_size: int = 10

    # Sentiment analysis
    sentiment_analyzer: Literal["textblob", "hybrid", "literary"] = "literary"

    # Gutenberg ingestion settings
    gutenberg_rate_limit: float = 1.0  # Seconds between requests
    gutenberg_timeout: int = 30  # Request timeout in seconds
    ingestion_word_count: int = 300  # Words per page chunk

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
