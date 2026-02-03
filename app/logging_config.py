import logging
import sys
from typing import Optional

from app.config import get_settings


def setup_logging(name: Optional[str] = None) -> logging.Logger:
    """Configure and return a logger instance."""
    settings = get_settings()

    logging.basicConfig(
        level=getattr(logging, settings.log_level),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    logger = logging.getLogger(name or "libris")
    return logger
