from celery import Celery
import os

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("cinenexus", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.timezone = "UTC"


@celery_app.task(name="recompute_taste_vector")
def recompute_taste_vector(user_id: str):
    """Recompute and cache user taste vector after interactions."""
    import asyncio
    from datetime import datetime, timezone
    from motor.motor_asyncio import AsyncIOMotorClient
    from bson import ObjectId

    async def _run():
        client = AsyncIOMotorClient(os.environ.get("MONGO_URL"), tlsAllowInvalidCertificates=True)
        db = client[os.environ.get("DB_NAME", "cinenexus")]

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            client.close()
            return

        history = await db.watch_history.find(
            {"user_id": user_id}
        ).sort("updated_at", -1).limit(100).to_list(100)

        genre_weights = {}
        for entry in history:
            movie_id = entry.get("movie_id")
            query = {"_id": ObjectId(movie_id)} if ObjectId.is_valid(str(movie_id)) else {"_id": movie_id}
            movie = await db.movies.find_one(query)
            if movie:
                completed_bonus = 2.0 if entry.get("completed") else 1.0
                for genre in movie.get("genres", []):
                    genre_weights[genre] = genre_weights.get(genre, 0) + completed_bonus

        total = sum(genre_weights.values()) or 1
        genre_weights = {key: round(value / total, 4) for key, value in genre_weights.items()}

        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "taste_vector.genre_weights": genre_weights,
                "taste_vector.last_updated": datetime.now(timezone.utc),
            }}
        )

        from upstash_redis import Redis as UpstashRedis
        url = os.environ.get("UPSTASH_REDIS_REST_URL", "")
        token = os.environ.get("UPSTASH_REDIS_REST_TOKEN", "")
        if url and token:
            redis = UpstashRedis(url=url, token=token)
            redis.delete(f"recs:{user_id}:personalized")
            redis.delete(f"recs:{user_id}:hybrid")
            redis.delete(f"recs:{user_id}:cf")
        client.close()

    asyncio.run(_run())


@celery_app.task(name="rebuild_tfidf_index")
def rebuild_tfidf_index():
    """Trigger TF-IDF index rebuild. Called after bulk content ingest."""
    import redis as redis_lib

    redis = redis_lib.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379/0"))
    redis.set("rebuild_tfidf", "1", ex=300)


@celery_app.task(
    name="tasks.refresh_recommendations",
    max_retries=3,
    default_retry_delay=60,
    soft_time_limit=120
)
def refresh_user_recommendations(user_id: str, profile_id: str):
    """Triggered asynchronously after a user watches or rates content."""
    import json
    import redis as redis_lib
    from ai.cf_svd import cf_engine

    try:
        recs = cf_engine.get_collaborative_recommendations(user_id, n_recommendations=50)
        redis = redis_lib.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379/0"))
        cache_key = f"recs:v2:{user_id}:{profile_id}"
        redis.setex(cache_key, 86400, json.dumps(recs, default=str))
        return {"user_id": user_id, "profile_id": profile_id, "status": "refreshed", "count": len(recs)}
    except Exception as exc:
        raise refresh_user_recommendations.retry(exc=exc)

