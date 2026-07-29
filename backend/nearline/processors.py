"""
CineNexuz Nearline Processors
Handles nearline asynchronous event computation (e.g. movie.watched, rating.submitted).
Updates online feature store in Redis within <5s.
"""
import logging
from typing import Dict, Any

from feature_store.feature_store import feature_store
try:
    from logging_utils import log_event
except ImportError:
    def log_event(level, msg, ep="nearline"):
        logging.log(level, f"[{ep}] {msg}")


async def process_movie_watched_event(event_payload: Dict[str, Any], db=None) -> Dict[str, Any]:
    """
    Processes 'movie.watched' event:
    1. Extracts user_id, movie_id, watch_pct.
    2. Fetches user watch history from DB.
    3. Recomputes user features using feature store definitions.
    4. Updates online Redis feature store.
    """
    user_id = event_payload.get("user_id")
    movie_id = event_payload.get("movie_id")
    watch_pct = event_payload.get("watch_pct", 1.0)

    if not user_id or not movie_id:
        raise ValueError("Missing user_id or movie_id in event payload")

    watch_history = []
    if db is not None:
        from bson import ObjectId
        query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
        user_doc = await db.users.find_one(query)
        if user_doc:
            watch_history = user_doc.get("watch_history", [])

    # If watch_history empty, construct current event item
    if not watch_history:
        watch_history = [{"movie_id": movie_id, "progress": watch_pct * 100}]

    updated_features = await feature_store.update_user_features_nearline(user_id, watch_history)
    log_event(logging.INFO, f"Nearline processed movie.watched for user {user_id}", "nearline_processor")
    return updated_features
