"""
Gutenberg ingestion pipeline package.

Provides tools to fetch, process, and store books from Project Gutenberg.
"""

from app.services.gutenberg.client import GutenbergClient, GutenbergFetchError
from app.services.gutenberg.catalog import BookCatalog
from app.services.gutenberg.pipeline import (
    GutenbergPipeline,
    IngestionResult,
    IngestionProgress,
)

__all__ = [
    "GutenbergClient",
    "GutenbergFetchError",
    "BookCatalog",
    "GutenbergPipeline",
    "IngestionResult",
    "IngestionProgress",
]
