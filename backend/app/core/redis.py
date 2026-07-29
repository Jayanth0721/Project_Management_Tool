import asyncio
import redis.asyncio as redis
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

_client: redis.Redis | None = None
_redis_checked: bool = False


async def get_redis() -> redis.Redis:
    global _client, _redis_checked
    if _client is None and not _redis_checked:
        _redis_checked = True
        try:
            _client = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                decode_responses=True,
                socket_connect_timeout=3,
                socket_timeout=5,
            )
            await asyncio.wait_for(_client.ping(), timeout=6)
            logger.info("Connected to Redis at %s:%s", settings.redis_host, settings.redis_port)
        except Exception as exc:
            logger.warning("Redis unavailable — running without cache: %s", exc)
            _client = None  # type: ignore
    return _client


async def close_redis():
    global _client
    if _client is not None:
        await _client.close()
        _client = None


async def cache_get(key: str) -> str | None:
    client = await get_redis()
    if client is None:
        return None
    try:
        return await client.get(key)
    except Exception:
        return None


async def cache_set(key: str, value: str, ttl: int = 300) -> bool:
    client = await get_redis()
    if client is None:
        return False
    try:
        await client.setex(key, ttl, value)
        return True
    except Exception:
        return False


async def rate_limit(key: str, max_requests: int = 10, window: int = 60) -> tuple[bool, int]:
    """Check if a key is rate-limited. Returns (allowed, remaining)."""
    client = await get_redis()
    if client is None:
        return True, max_requests  # allow if Redis is down
    try:
        current = await client.incr(key)
        if current == 1:
            await client.expire(key, window)
        remaining = max(0, max_requests - current)
        return current <= max_requests, remaining
    except Exception:
        return True, max_requests
