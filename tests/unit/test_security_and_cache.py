"""
Unit Tests for Security Hardening, Redis Token Blacklisting & Cache-Aside Engine (PART F1)
"""
import time
import pytest
from unittest.mock import MagicMock, AsyncMock

from security.auth import (
    create_access_token,
    create_refresh_token,
    blacklist_token,
    is_token_blacklisted,
    verify_token,
    UserRole
)
from cache.cache_manager import CacheKeys, get_cached_or_fetch


def test_access_and_refresh_token_generation():
    user_id = "user_12345"
    access_tok = create_access_token(user_id=user_id, role="admin")
    refresh_tok = create_refresh_token(user_id=user_id)

    assert isinstance(access_tok, str)
    assert isinstance(refresh_tok, str)

    acc_payload = verify_token(access_tok, expected_type="access")
    assert acc_payload["sub"] == user_id
    assert acc_payload["role"] == "admin"
    assert acc_payload["type"] == "access"

    ref_payload = verify_token(refresh_tok, expected_type="refresh")
    assert ref_payload["sub"] == user_id
    assert ref_payload["type"] == "refresh"


def test_token_blacklisting_in_redis():
    mock_redis = MagicMock()
    mock_redis.exists.return_value = 1

    jti = "test-jti-uuid"
    blacklist_token(mock_redis, jti=jti, ttl=900)

    mock_redis.setex.assert_called_once_with(f"token:blacklist:{jti}", 900, "1")
    assert is_token_blacklisted(mock_redis, jti) is True


def test_cache_keys_namespace_formatting():
    user_key = CacheKeys.RECOMMENDATIONS.format(user_id="u123", profile_id="p456")
    assert user_key == "recs:v2:u123:p456"

    search_hash = CacheKeys.hash_query("Inception 2010")
    search_key = CacheKeys.SEARCH_RESULTS.format(query_hash=search_hash, page=1)
    assert "search:" in search_key
    assert ":1" in search_key


@pytest.mark.asyncio
async def test_cache_aside_fail_open_on_redis_error():
    mock_redis = MagicMock()
    mock_redis.get.side_effect = Exception("Redis Connection Refused")

    async def fetch_db_data():
        return [{"tmdb_id": 550, "title": "Fight Club"}]

    # Should log warning and fall back to fetching DB data without raising an exception
    res = await get_cached_or_fetch(
        key="movie:550",
        fetch_fn=fetch_db_data,
        ttl=300,
        redis_client=mock_redis
    )

    assert res == [{"tmdb_id": 550, "title": "Fight Club"}]
