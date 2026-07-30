"""
CineNexus Centralized Cache Manager & Cache-Aside Engine (PART B)
Implements:
- Searchable CacheKeys namespace factory
- Cache-Aside pattern with RedisError fail-open resilience
- Prometheus Cache Hit/Miss metrics instrumentation
- Startup cache warming for trending content & genre statistics
"""
import json
import logging
import hashlib
from typing import Callable, Any, Optional, Dict

logger = logging.getLogger("cache.manager")


class CacheKeys:
    """Centralized key namespace factory for system-wide cache predictability."""
    RECOMMENDATIONS = "recs:v2:{user_id}:{profile_id}"       # TTL: 24h (86400s)
    WATCHLIST       = "watchlist:{profile_id}"                # TTL: 5m (300s)
    HISTORY         = "history:{profile_id}:page:{page}"      # TTL: 2m (120s)
    MOVIE_DETAIL    = "movie:{tmdb_id}"                       # TTL: 1h (3600s)
    SEARCH_RESULTS  = "search:{query_hash}:{page}"           # TTL: 15m (900s)
    GENRE_STATS     = "stats:genres"                          # TTL: 1h (3600s)
    TRENDING        = "trending:v1"                           # TTL: 10m (600s)
    RATE_LIMIT      = "ratelimit:{user_id}:{window}"          # TTL: 60s

    @staticmethod
    def hash_query(query: str) -> str:
        """Generates MD5 hash for search query caching."""
        return hashlib.md5(query.strip().lower().encode("utf-8")).hexdigest()

    @staticmethod
    def invalidate_user(redis_client, user_id: str, profile_id: str):
        """Invalidates user-scoped recommendation cache on activity updates."""
        if not redis_client:
            return
        try:
            pattern = CacheKeys.RECOMMENDATIONS.format(user_id=user_id, profile_id=profile_id)
            redis_client.delete(pattern)
        except Exception as e:
            logger.warning(f"Failed user cache invalidation for {user_id}: {e}")


async def get_cached_or_fetch(
    key: str,
    fetch_fn: Callable,
    ttl: int = 300,
    redis_client=None
) -> Any:
    """
    Cache-Aside pattern helper with fail-open DB fallback on Redis error.
    Tracks cache hits and misses via metrics counters.
    """
    # 1. Attempt Redis Cache Read
    if redis_client:
        try:
            cached_data = redis_client.get(key)
            if cached_data:
                if isinstance(cached_data, bytes):
                    cached_data = cached_data.decode("utf-8")
                # Increment metrics hit counter
                try:
                    from metrics.prometheus import CACHE_HIT_COUNTER
                    CACHE_HIT_COUNTER.labels(key_prefix=key.split(":")[0]).inc()
                except Exception:
                    pass
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Redis cache-aside read failed for key '{key}': {e}. Failing open to DB.")

    # 2. Cache Miss / Redis Unavailable -> Execute Fetch Function
    try:
        from metrics.prometheus import CACHE_MISS_COUNTER
        CACHE_MISS_COUNTER.labels(key_prefix=key.split(":")[0]).inc()
    except Exception:
        pass

    result = await fetch_fn()

    # 3. Store in Redis asynchronously
    if redis_client and result is not None:
        try:
            redis_client.setex(key, ttl, json.dumps(result, default=str))
        except Exception as e:
            logger.warning(f"Redis cache-aside write failed for key '{key}': {e}")

    return result


async def warm_caches(db, redis_client):
    """Pre-populates high-traffic data into Redis on application startup."""
    if not redis_client or db is None:
        logger.info("Skipping cache warming: Redis or MongoDB not available.")
        return

    logger.info("Starting startup cache warming...")
    try:
        # Warm trending movies
        cursor = db.movies.find().sort("popularity", -1).limit(50)
        trending_movies = await cursor.to_list(50)
        if trending_movies:
            # Clean Mongo _id for JSON serialization
            for m in trending_movies:
                m["_id"] = str(m["_id"])
            redis_client.setex(CacheKeys.TRENDING, 600, json.dumps(trending_movies, default=str))
            logger.info(f"Warmed CacheKeys.TRENDING with {len(trending_movies)} titles.")

        # Warm genre stats
        pipeline = [
            {"$unwind": "$genres"},
            {"$group": {"_id": "$genres", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        genre_counts = await db.movies.aggregate(pipeline).to_list(100)
        if genre_counts:
            stats = {g["_id"]: g["count"] for g in genre_counts if g.get("_id")}
            redis_client.setex(CacheKeys.GENRE_STATS, 3600, json.dumps(stats))
            logger.info(f"Warmed CacheKeys.GENRE_STATS with {len(stats)} genres.")

    except Exception as e:
        logger.warning(f"Cache warming failed: {e}")
