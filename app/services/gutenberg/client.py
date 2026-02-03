"""
HTTP client for Project Gutenberg with rate limiting and retry logic.
"""

import logging
import time
from dataclasses import dataclass
from typing import Optional

import requests

logger = logging.getLogger(__name__)


class GutenbergFetchError(Exception):
    """Error fetching content from Project Gutenberg."""

    def __init__(self, gutenberg_id: int, message: str, retryable: bool = False):
        self.gutenberg_id = gutenberg_id
        self.retryable = retryable
        super().__init__(f"Book {gutenberg_id}: {message}")


@dataclass
class GutenbergBookInfo:
    """Metadata for a Gutenberg book."""

    gutenberg_id: int
    title: str
    author: str
    cover_url: Optional[str] = None


class GutenbergClient:
    """
    HTTP client for Project Gutenberg with rate limiting.

    Fetches book text and metadata while being a good API citizen
    with configurable rate limiting and retry logic.
    """

    # URL patterns for plain text files (in order of preference)
    TEXT_URL_PATTERNS = [
        "https://www.gutenberg.org/cache/epub/{id}/pg{id}.txt",
        "https://www.gutenberg.org/files/{id}/{id}-0.txt",
        "https://www.gutenberg.org/files/{id}/{id}.txt",
    ]

    # Cover image URL pattern
    COVER_URL_PATTERN = "https://www.gutenberg.org/cache/epub/{id}/pg{id}.cover.medium.jpg"

    def __init__(
        self,
        rate_limit: float = 1.0,
        timeout: int = 30,
        max_retries: int = 3,
    ):
        """
        Initialize the Gutenberg client.

        Args:
            rate_limit: Minimum seconds between requests
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts for transient failures
        """
        self.rate_limit = rate_limit
        self.timeout = timeout
        self.max_retries = max_retries
        self._last_request_time: float = 0
        self._session = requests.Session()
        self._session.headers.update(
            {
                "User-Agent": "ProjectLibris/1.0 (TikTok for Books; educational project)"
            }
        )

    def _rate_limit_wait(self) -> None:
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.rate_limit:
            sleep_time = self.rate_limit - elapsed
            logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s")
            time.sleep(sleep_time)
        self._last_request_time = time.time()

    def fetch_text(self, gutenberg_id: int) -> str:
        """
        Fetch plain text content for a book.

        Tries multiple URL patterns until one succeeds.

        Args:
            gutenberg_id: The Gutenberg book ID

        Returns:
            Raw text content of the book

        Raises:
            GutenbergFetchError: If book cannot be retrieved
        """
        errors = []

        for pattern in self.TEXT_URL_PATTERNS:
            url = pattern.format(id=gutenberg_id)

            for attempt in range(self.max_retries):
                self._rate_limit_wait()

                try:
                    logger.debug(f"Fetching {url} (attempt {attempt + 1})")
                    response = self._session.get(url, timeout=self.timeout)

                    if response.status_code == 200:
                        # Try to decode as UTF-8, fall back to latin-1
                        try:
                            return response.content.decode("utf-8")
                        except UnicodeDecodeError:
                            return response.content.decode("latin-1")

                    if response.status_code == 404:
                        # Not found at this URL, try next pattern
                        errors.append(f"{url}: 404 Not Found")
                        break

                    if response.status_code == 429:
                        # Rate limited, wait and retry
                        wait_time = 60 * (attempt + 1)
                        logger.warning(
                            f"Rate limited for book {gutenberg_id}, waiting {wait_time}s"
                        )
                        time.sleep(wait_time)
                        continue

                    if response.status_code >= 500:
                        # Server error, retry with backoff
                        if attempt < self.max_retries - 1:
                            wait_time = 2**attempt
                            logger.warning(
                                f"Server error {response.status_code} for {gutenberg_id}, "
                                f"retrying in {wait_time}s"
                            )
                            time.sleep(wait_time)
                            continue
                        errors.append(f"{url}: {response.status_code} Server Error")
                        break

                    # Other error codes
                    errors.append(f"{url}: {response.status_code}")
                    break

                except requests.Timeout:
                    if attempt < self.max_retries - 1:
                        wait_time = 2**attempt
                        logger.warning(
                            f"Timeout fetching {gutenberg_id}, retry {attempt + 1} in {wait_time}s"
                        )
                        time.sleep(wait_time)
                        continue
                    errors.append(f"{url}: Timeout after {self.max_retries} attempts")
                    break

                except requests.RequestException as e:
                    errors.append(f"{url}: {str(e)}")
                    break

        # All patterns failed
        error_msg = "; ".join(errors) if errors else "Unknown error"
        raise GutenbergFetchError(
            gutenberg_id,
            f"Could not fetch text: {error_msg}",
            retryable=False,
        )

    def get_cover_url(self, gutenberg_id: int) -> Optional[str]:
        """
        Get the cover image URL for a book.

        Note: Not all books have covers. This returns the URL without
        verifying it exists to avoid extra network requests.

        Args:
            gutenberg_id: The Gutenberg book ID

        Returns:
            Cover image URL, or None if not available
        """
        return self.COVER_URL_PATTERN.format(id=gutenberg_id)

    def verify_cover_exists(self, gutenberg_id: int) -> Optional[str]:
        """
        Verify a cover exists and return the URL if it does.

        Makes a HEAD request to check if the cover image exists.

        Args:
            gutenberg_id: The Gutenberg book ID

        Returns:
            Cover URL if it exists, None otherwise
        """
        url = self.get_cover_url(gutenberg_id)
        self._rate_limit_wait()

        try:
            response = self._session.head(url, timeout=10)
            if response.status_code == 200:
                return url
        except requests.RequestException:
            pass

        return None

    def close(self) -> None:
        """Close the HTTP session."""
        self._session.close()

    def __enter__(self) -> "GutenbergClient":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()
