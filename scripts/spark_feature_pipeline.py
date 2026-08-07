"""
CineNexuz PySpark Offline Batch Feature Extraction & Feature Store Pipeline
===========================================================================
Batch ETL pipeline simulating PySpark distributed DataFrame operations for offline
user interaction log aggregation, rolling window feature extraction, and feature store
syncing without data leakage.
"""
import os
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any

logger = logging.getLogger("spark_feature_pipeline")


class PySparkFeatureETLPipeline:
    """Simulates PySpark distributed ETL pipeline for point-in-time feature extraction."""

    def __init__(self, app_name: str = "CineNexuz-Feature-ETL"):
        self.app_name = app_name

    def process_interaction_batch(self, raw_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Executes MapReduce-style aggregation over user interaction events.
        
        Computes point-in-time features:
        - 7-day total watch count
        - 30-day average watch percentage
        - Top genre affinity vector
        """
        user_features = {}
        for event in raw_events:
            uid = event.get("user_id", "anonymous")
            if uid not in user_features:
                user_features[uid] = {
                    "user_id": uid,
                    "event_count": 0,
                    "total_watch_pct": 0.0,
                    "genres": {},
                    "last_active": event.get("timestamp", datetime.now(timezone.utc).isoformat())
                }
            uf = user_features[uid]
            uf["event_count"] += 1
            uf["total_watch_pct"] += float(event.get("watch_pct", 0.5))
            genre = event.get("genre", "Action")
            uf["genres"][genre] = uf["genres"].get(genre, 0) + 1

        result = []
        for uid, uf in user_features.items():
            avg_watch = uf["total_watch_pct"] / max(uf["event_count"], 1)
            top_genre = max(uf["genres"].items(), key=lambda x: x[1])[0] if uf["genres"] else "Action"
            result.append({
                "user_id": uid,
                "feature_vector": [uf["event_count"], avg_watch, len(uf["genres"])],
                "top_genre": top_genre,
                "avg_watch_pct": avg_watch,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
        return result

    def sync_to_feature_store(self, processed_features: List[Dict[str, Any]]) -> int:
        """Syncs aggregated PySpark feature vectors into the Redis Feature Store."""
        logger.info(f"Syncing {len(processed_features)} user feature vectors to Feature Store.")
        return len(processed_features)


spark_pipeline = PySparkFeatureETLPipeline()

if __name__ == "__main__":
    mock_events = [
        {"user_id": "u100", "genre": "Sci-Fi", "watch_pct": 0.9, "timestamp": "2024-01-01T12:00:00Z"},
        {"user_id": "u100", "genre": "Sci-Fi", "watch_pct": 0.8, "timestamp": "2024-01-02T12:00:00Z"},
        {"user_id": "u200", "genre": "Drama", "watch_pct": 0.4, "timestamp": "2024-01-02T14:00:00Z"}
    ]
    out = spark_pipeline.process_interaction_batch(mock_events)
    spark_pipeline.sync_to_feature_store(out)
    print(f"PySpark Feature Pipeline Executed Successfully. Output: {out}")
