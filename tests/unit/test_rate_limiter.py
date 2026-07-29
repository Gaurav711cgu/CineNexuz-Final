"""
Unit tests for Token Bucket Rate Limiter.
"""
import pytest
from resilience.rate_limiter import TokenBucketRateLimiter


@pytest.mark.asyncio
async def test_rate_limiter_allows_under_limit():
    limiter = TokenBucketRateLimiter(capacity=10)
    user_key = "user_test_1"

    is_allowed, remaining, reset_secs = await limiter.check_rate_limit(user_key, limit=5, window=60)
    assert is_allowed is True
    assert remaining == 4


@pytest.mark.asyncio
async def test_rate_limiter_rejects_over_limit():
    limiter = TokenBucketRateLimiter(capacity=2)
    user_key = "user_test_2"

    # 1st request -> allowed
    ok1, _, _ = await limiter.check_rate_limit(user_key, limit=2, window=60)
    assert ok1 is True

    # 2nd request -> allowed
    ok2, _, _ = await limiter.check_rate_limit(user_key, limit=2, window=60)
    assert ok2 is True

    # 3rd request -> rejected (HTTP 429)
    ok3, remaining, _ = await limiter.check_rate_limit(user_key, limit=2, window=60)
    assert ok3 is False
    assert remaining == 0
