"""
CineNexuz Redis Token Bucket Rate Limiter
Throttles request bursts (default 60 req/min per user).
Refills tokens continuously using sliding windows.
"""
import time
import logging
from typing import Tuple, Dict

try:
    from logging_utils import log_event
except ImportError:
    def log_event(level, msg, ep="rate_limiter"):
        logging.log(level, f"[{ep}] {msg}")


class TokenBucketRateLimiter:
    """Token Bucket Rate Limiter using Redis or in-memory state."""

    def __init__(self, redis_client=None, capacity: int = 60, refill_rate: float = 1.0):
        self.redis = redis_client
        self.capacity = capacity        # Max bucket size (e.g. 60 tokens)
        self.refill_rate = refill_rate  # Tokens added per second (1 token/sec = 60/min)
        self.in_memory_buckets: Dict[str, Tuple[float, float]] = {}  # {key: (tokens, last_update)}

    def set_redis(self, redis_client):
        self.redis = redis_client

    async def check_rate_limit(self, key: str, limit: int = 60, window: int = 60) -> Tuple[bool, int, float]:
        """
        Checks if request key is within rate limit.
        Returns: (is_allowed, remaining_tokens, reset_seconds)
        """
        # 1. Redis Sliding Window Counter Fast Path
        if self.redis:
            try:
                redis_key = f"ratelimit:{key}"
                current = self.redis.incr(redis_key)
                if current == 1:
                    self.redis.expire(redis_key, window)
                ttl = self.redis.ttl(redis_key)
                if ttl < 0:
                    ttl = window

                if current > limit:
                    log_event(logging.WARNING, f"Rate limit exceeded for key {key}: {current}/{limit}", "rate_limiter")
                    return False, 0, float(ttl)

                return True, limit - current, float(ttl)
            except Exception as e:
                log_event(logging.WARNING, f"Redis rate limiter fallback to in-memory: {e}", "rate_limiter")

        # 2. In-Memory Token Bucket Fallback
        now = time.time()
        tokens, last_update = self.in_memory_buckets.get(key, (float(limit), now))
        
        # Calculate tokens added since last check
        elapsed = now - last_update
        tokens = min(float(limit), tokens + elapsed * (limit / float(window)))
        
        if tokens < 1.0:
            reset_secs = (1.0 - tokens) / (limit / float(window))
            return False, 0, round(reset_secs, 2)

        # Deduct token
        tokens -= 1.0
        self.in_memory_buckets[key] = (tokens, now)
        return True, int(tokens), float(window)


# Global rate limiter instance
rate_limiter = TokenBucketRateLimiter()
