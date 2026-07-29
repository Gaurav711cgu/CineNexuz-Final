"""
CineNexuz Dead Letter Queue (DLQ) Implementation
Retries failed event execution 3 times with backoff before isolating poison-pill events to DLQ storage.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Callable, List

try:
    from logging_utils import log_event
except ImportError:
    def log_event(level, msg, ep="dlq"):
        logging.log(level, f"[{ep}] {msg}")


class DeadLetterQueue:
    """Manages event retries and stores poison-pill events in DLQ."""

    def __init__(self, max_retries: int = 3, backoff_seconds: float = 0.5):
        self.max_retries = max_retries
        self.backoff_seconds = backoff_seconds
        self.dlq_events: List[Dict[str, Any]] = []

    async def execute_with_retry(self, event_type: str, payload: Dict[str, Any], processor_fn: Callable) -> Any:
        """Executes processor function with max_retries before routing to DLQ."""
        last_exception = None
        for attempt in range(1, self.max_retries + 1):
            try:
                res = processor_fn(payload)
                if asyncio.iscoroutine(res):
                    return await res
                return res
            except Exception as exc:
                last_exception = exc
                log_event(logging.WARNING, f"Attempt {attempt}/{self.max_retries} failed for event {event_type}: {exc}", "dlq")
                if attempt < self.max_retries:
                    await asyncio.sleep(self.backoff_seconds * attempt)

        # Route to DLQ after exhausting retries
        dlq_entry = {
            "event_type": event_type,
            "payload": payload,
            "error": str(last_exception),
            "failed_at": datetime.now(timezone.utc).isoformat(),
            "attempts": self.max_retries
        }
        self.dlq_events.append(dlq_entry)
        log_event(logging.ERROR, f"Event routed to Dead Letter Queue (DLQ): {event_type}, Error: {last_exception}", "dlq")
        return None

    def get_dlq_events() -> List[Dict[str, Any]]:
        return self.dlq_events

    def clear_dlq(self):
        self.dlq_events.clear()


# Global DLQ instance
dead_letter_queue = DeadLetterQueue()
