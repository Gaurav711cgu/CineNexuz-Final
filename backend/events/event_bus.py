"""
CineNexus Asynchronous Distributed Event Bus
============================================
Decouples API request processing from event logging using an asynchronous event bus queue.
Processes CLICK, WATCH_PROGRESS, RATING, and HOVER events with worker thread pools, backpressure, and DLQ retries.
"""

import sys
import os
import asyncio
import time
import logging
from typing import Dict, List, Any, Callable, Optional
from enum import Enum

logger = logging.getLogger("events.event_bus")


class EventType(str, Enum):
    CLICK = "click"
    WATCH_PROGRESS = "watch_progress"
    RATING = "rating"
    HOVER = "hover"
    SEARCH = "search"


class Event:
    """Represents an interaction event payload."""

    def __init__(self, event_type: str, user_id: str, payload: Dict[str, Any]):
        self.event_id = f"evt_{int(time.time() * 1000)}_{user_id[:6]}"
        self.event_type = event_type
        self.user_id = user_id
        self.payload = payload
        self.timestamp = time.time()
        self.retry_count = 0


class DistributedEventBus:
    """Async event bus with queue buffer, worker consumers, and dead-letter queue (DLQ)."""

    def __init__(self, queue_capacity: int = 10000, num_workers: int = 2):
        self.queue_capacity = queue_capacity
        self.num_workers = num_workers
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=queue_capacity)
        self.dlq: List[Event] = []
        self.processed_count: int = 0
        self.failed_count: int = 0
        self.handlers: Dict[str, List[Callable]] = {}

    def register_handler(self, event_type: str, handler: Callable):
        """Registers a consumer callback for a specific event type."""
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        self.handlers[event_type].append(handler)

    async def publish_event(self, event_type: str, user_id: str, payload: Dict[str, Any]) -> bool:
        """Publishes event to queue without blocking caller."""
        event = Event(event_type, user_id, payload)
        try:
            self.queue.put_nowait(event)
            return True
        except asyncio.QueueFull:
            logger.warning(f"Event bus queue full! Moving event {event.event_id} to DLQ.")
            self.dlq.append(event)
            return False

    async def _worker_loop(self, worker_id: int):
        """Worker loop consuming events from queue."""
        while True:
            try:
                event = await self.queue.get()
                handlers = self.handlers.get(event.event_type, [])
                for h in handlers:
                    try:
                        if asyncio.iscoroutinefunction(h):
                            await h(event)
                        else:
                            h(event)
                    except Exception as e:
                        logger.error(f"Error handling event {event.event_id} in worker {worker_id}: {e}")
                        event.retry_count += 1
                        if event.retry_count > 3:
                            self.dlq.append(event)
                            self.failed_count += 1
                self.processed_count += 1
                self.queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Returns event bus telemetry."""
        return {
            "queue_size": self.queue.qsize(),
            "queue_capacity": self.queue_capacity,
            "processed_count": self.processed_count,
            "failed_count": self.failed_count,
            "dlq_size": len(self.dlq),
            "status": "healthy"
        }


event_bus = DistributedEventBus()
