"""
Unit tests for Nearline Event Worker & Feature Store updates.
"""
import pytest
from nearline.processors import process_movie_watched_event


@pytest.mark.asyncio
async def test_nearline_processor_updates_features():
    event_payload = {
        "user_id": "user_nearline_1",
        "movie_id": "movie_101",
        "watch_pct": 0.85
    }

    updated_features = await process_movie_watched_event(event_payload)
    
    assert updated_features["user_id"] == "user_nearline_1"
    assert "genre_affinity" in updated_features
    assert "avg_watch_pct" in updated_features
