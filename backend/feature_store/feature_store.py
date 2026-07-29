"""
CineNexuz Feature Store Engine
Handles online feature serving (<5ms latency via Redis) and offline batch exports.
Enforces schema definitions and parity.
"""
import json
import logging
from typing import Dict, Any, Optional, List
import numpy as np

from feature_store.definitions import (
    FEATURE_DEFINITIONS,
    compute_genre_affinity,
    compute_avg_watch_pct
)

try:
    from logging_utils import log_event
except ImportError:
    def log_event(level, msg, ep="feature_store"):
        logging.log(level, f"[{ep}] {msg}")


class FeatureStore:
    """Dual Online/Offline Feature Store Manager."""

    def __init__(self, redis_client=None, db=None):
        self.redis = redis_client
        self.db = db

    def set_clients(self, redis_client=None, db=None):
        """Bind database clients."""
        if redis_client is not None:
            self.redis = redis_client
        if db is not None:
            self.db = db

    async def get_user_features(self, user_id: str) -> Dict[str, Any]:
        """
        Fetches user online features. Tries Redis first (<5ms).
        Falls back to computing directly from DB if missing or expired.
        """
        redis_key = f"features:user:{user_id}"
        
        # 1. Online Fast Path (Redis)
        if self.redis:
            try:
                cached_bytes = self.redis.get(redis_key)
                if cached_bytes:
                    if isinstance(cached_bytes, bytes):
                        cached_bytes = cached_bytes.decode('utf-8')
                    return json.loads(cached_bytes)
            except Exception as e:
                log_event(logging.WARNING, f"Redis feature store read error: {e}", "feature_store")

        # 2. Offline Fallback Path & Parity Recomputation
        if self.db is None:
            return {}

        try:
            from bson import ObjectId
            user_doc = None
            if ObjectId.is_valid(user_id):
                user_doc = await self.db.users.find_one({"_id": ObjectId(user_id)})
            if not user_doc:
                user_doc = await self.db.users.find_one({"_id": user_id})

            if not user_doc:
                return {}

            watch_history = user_doc.get("watch_history", [])
            
            # Compute using single source of truth functions
            genre_affinity = compute_genre_affinity(watch_history)
            avg_watch_pct = compute_avg_watch_pct(watch_history)

            features = {
                "user_id": str(user_id),
                "genre_affinity": genre_affinity,
                "avg_watch_pct": avg_watch_pct,
                "history_length": len(watch_history)
            }

            # Cache back to Redis with online TTL
            if self.redis:
                try:
                    ttl = FEATURE_DEFINITIONS["user:genre_affinity"]["ttl_online"]
                    self.redis.setex(redis_key, ttl, json.dumps(features))
                except Exception as e:
                    log_event(logging.WARNING, f"Redis feature store write error: {e}", "feature_store")

            return features

        except Exception as err:
            log_event(logging.ERROR, f"Error computing user features: {err}", "feature_store")
            return {}

    async def update_user_features_nearline(self, user_id: str, watch_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Updates nearline user features in Redis after event arrival."""
        genre_affinity = compute_genre_affinity(watch_history)
        avg_watch_pct = compute_avg_watch_pct(watch_history)

        features = {
            "user_id": str(user_id),
            "genre_affinity": genre_affinity,
            "avg_watch_pct": avg_watch_pct,
            "history_length": len(watch_history)
        }

        redis_key = f"features:user:{user_id}"
        if self.redis:
            try:
                ttl = FEATURE_DEFINITIONS["user:genre_affinity"]["ttl_online"]
                self.redis.setex(redis_key, ttl, json.dumps(features))
            except Exception as e:
                log_event(logging.ERROR, f"Nearline feature update Redis write failed: {e}", "feature_store")

        return features


# Global instance
feature_store = FeatureStore()
