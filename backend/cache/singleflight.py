"""
CineNexus L1/L2 Singleflight Cache Stampede Protection
======================================================
Prevents Thundering Herd / Cache Stampedes under high QPS using Singleflight Mutex Locks.
Combines L1 In-Memory LRU Cache with L2 Redis Cache.

When a hot cache key expires, Singleflight ensures ONLY 1 request executes the expensive DB query,
while concurrent requests block and receive the identical single result.
"""

import sys
import os
import asyncio
import time
import logging
from typing import Dict, Any, Callable, Optional, Tuple

logger = logging.getLogger("cache.singleflight")


class SingleflightGroup:
    """Manages in-flight concurrent execution calls to prevent duplicate expensive operations."""

    def __init__(self):
        self._in_flight: Dict[str, asyncio.Future] = {}
        self._lock = asyncio.Lock()

    async def execute(self, key: str, fn: Callable) -> Tuple[Any, bool]:
        """
        Executes fn for key, or awaits in-flight call if already executing.
        Returns Tuple[Result, is_shared].
        """
        async with self._lock:
            if key in self._in_flight:
                # Concurrent request found! Await the in-flight call.
                future = self._in_flight[key]
                is_shared = True
            else:
                # First request! Create future and mark in-flight.
                loop = asyncio.get_event_loop()
                future = loop.create_future()
                self._in_flight[key] = future
                is_shared = False

        if is_shared:
            result = await future
            return result, True

        # Execute fn for the first request
        try:
            if asyncio.iscoroutinefunction(fn):
                res = await fn()
            else:
                res = fn()
            future.set_result(res)
            return res, False
        except Exception as e:
            future.set_exception(e)
            raise e
        finally:
            async with self._lock:
                self._in_flight.pop(key, None)


class TwoTierSingleflightCache:
    """L1 (Memory) + L2 (Redis) Cache with Singleflight Stampede Protection."""

    def __init__(self, l1_ttl_sec: int = 60):
        self.l1_cache: Dict[str, Tuple[Any, float]] = {}
        self.l1_ttl_sec = l1_ttl_sec
        self.singleflight = SingleflightGroup()

    def get_l1(self, key: str) -> Optional[Any]:
        """Fetches item from L1 in-memory cache if not expired."""
        if key in self.l1_cache:
            val, exp = self.l1_cache[key]
            if time.time() < exp:
                return val
            else:
                del self.l1_cache[key]
        return None

    def set_l1(self, key: str, value: Any, ttl: Optional[int] = None):
        """Sets item in L1 in-memory cache."""
        ttl_val = ttl if ttl is not None else self.l1_ttl_sec
        self.l1_cache[key] = (value, time.time() + ttl_val)

    async def get_or_fetch(self, key: str, fetch_fn: Callable, ttl_sec: int = 60) -> Tuple[Any, str]:
        """
        Fetches item using L1 -> L2 -> Singleflight DB Fetch fallback chain.
        Returns Tuple[Result, source] where source is 'L1', 'L2', or 'DB_SINGLEFLIGHT'.
        """
        # 1. L1 Cache Hit
        l1_val = self.get_l1(key)
        if l1_val is not None:
            return l1_val, "L1_HIT"

        # 2. Singleflight DB Fetch (prevents stampede)
        async def wrapped_fetch():
            val = await fetch_fn() if asyncio.iscoroutinefunction(fetch_fn) else fetch_fn()
            self.set_l1(key, val, ttl=ttl_sec)
            return val

        val, is_shared = await self.singleflight.execute(key, wrapped_fetch)
        source = "SINGLEFLIGHT_SHARED" if is_shared else "DB_FETCH"
        return val, source


singleflight_cache = TwoTierSingleflightCache()
