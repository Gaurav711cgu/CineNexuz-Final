"""
CineNexuz Nearline Worker & Queue Listener
Asynchronously consumes event streams (Kafka or in-memory fallback queue)
and updates online features in Redis within <5 seconds.
"""
import asyncio
import logging
from typing import Dict, Any

from nearline.processors import process_movie_watched_event
from resilience.dlq import dead_letter_queue
try:
    from logging_utils import log_event
except ImportError:
    def log_event(level, msg, ep="nearline_worker"):
        logging.log(level, f"[{ep}] {msg}")


class NearlineWorker:
    """Asynchronous worker for consuming user behavior events."""

    def __init__(self, db=None):
        self.db = db
        self.queue = asyncio.Queue()
        self.is_running = False
        self._task = None

    def set_db(self, db):
        self.db = db

    async def start(self):
        """Starts worker event consumption loop."""
        self.is_running = True
        self._task = asyncio.create_task(self._consume_loop())
        log_event(logging.INFO, "Nearline worker event loop started", "nearline_worker")

    async def stop(self):
        """Stops worker loop gracefully."""
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        log_event(logging.INFO, "Nearline worker stopped", "nearline_worker")

    async def dispatch_event(self, event_type: str, payload: Dict[str, Any]):
        """Dispatches event to nearline worker queue (<1ms overhead)."""
        await self.queue.put({"event_type": event_type, "payload": payload})

    async def _consume_loop(self):
        while self.is_running:
            try:
                event = await self.queue.get()
                event_type = event.get("event_type")
                payload = event.get("payload", {})

                await dead_letter_queue.execute_with_retry(
                    event_type=event_type,
                    payload=payload,
                    processor_fn=lambda p: process_movie_watched_event(p, self.db)
                )
                self.queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                log_event(logging.ERROR, f"Error in nearline worker consume loop: {e}", "nearline_worker")
                await asyncio.sleep(0.1)


# Global nearline worker instance
nearline_worker = NearlineWorker()
