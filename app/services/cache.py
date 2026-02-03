import hashlib
import json
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Optional


class SimpleCache:
    """In-memory cache with TTL support."""

    def __init__(self, default_ttl: int = 300):
        """
        Initialize cache.

        Args:
            default_ttl: Default time-to-live in seconds (default: 5 minutes)
        """
        self._cache: dict = {}
        self._default_ttl = default_ttl

    def _make_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate a cache key from prefix and arguments."""
        key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
        hash_val = hashlib.md5(key_data.encode()).hexdigest()[:12]
        return f"{prefix}:{hash_val}"

    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found/expired
        """
        if key not in self._cache:
            return None

        value, expires_at = self._cache[key]
        if datetime.utcnow() > expires_at:
            del self._cache[key]
            return None

        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Set a value in cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (uses default if not specified)
        """
        ttl = ttl or self._default_ttl
        expires_at = datetime.utcnow() + timedelta(seconds=ttl)
        self._cache[key] = (value, expires_at)

    def delete(self, key: str) -> bool:
        """
        Delete a key from cache.

        Args:
            key: Cache key

        Returns:
            True if key was deleted, False if not found
        """
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def clear(self) -> None:
        """Clear all cached values."""
        self._cache.clear()

    def cleanup_expired(self) -> int:
        """
        Remove all expired entries.

        Returns:
            Number of entries removed
        """
        now = datetime.utcnow()
        expired_keys = [
            key for key, (_, expires_at) in self._cache.items() if now > expires_at
        ]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)


# Global cache instance for feed data
feed_cache = SimpleCache(default_ttl=60)  # 1 minute TTL for feed


def cached(prefix: str, ttl: int = 300):
    """
    Decorator for caching function results.

    Args:
        prefix: Cache key prefix
        ttl: Time-to-live in seconds

    Usage:
        @cached("feed", ttl=30)
        def get_feed(...):
            ...
    """

    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Skip 'self' for instance methods
            cache_args = args[1:] if args and hasattr(args[0], "__class__") else args

            # Build cache key
            key = feed_cache._make_key(prefix, *cache_args, **kwargs)

            # Check cache
            cached_value = feed_cache.get(key)
            if cached_value is not None:
                return cached_value

            # Call function and cache result
            result = func(*args, **kwargs)
            feed_cache.set(key, result, ttl)
            return result

        return wrapper

    return decorator
