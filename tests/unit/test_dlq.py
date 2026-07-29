"""
Unit tests for Dead Letter Queue retry & poison-pill handling.
"""
import pytest
from resilience.dlq import DeadLetterQueue


@pytest.mark.asyncio
async def test_dlq_retries_and_places_in_dlq_on_exhaustion():
    dlq = DeadLetterQueue(max_retries=2, backoff_seconds=0.01)

    fail_count = 0
    def poison_pill_processor(payload):
        nonlocal fail_count
        fail_count += 1
        raise ValueError(f"Poison pill failure #{fail_count}")

    event_payload = {"user_id": "u123", "movie_id": "m456"}
    
    # Execute through DLQ
    res = await dlq.execute_with_retry("movie.watched", event_payload, poison_pill_processor)
    
    assert res is None
    assert fail_count == 2
    assert len(dlq.dlq_events) == 1

    event_entry = dlq.dlq_events[0]
    assert event_entry["event_type"] == "movie.watched"
    assert event_entry["payload"] == event_payload
    assert "Poison pill failure" in event_entry["error"]
