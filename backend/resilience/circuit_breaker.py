"""
CineNexuz Circuit Breaker (Resilience Pattern)
3-State Pattern: Closed -> Open -> Half-Open
Prevents cascading failures when Redis, TMDB API, or Event Producers degrade.
"""
import time
import logging
import asyncio
from typing import Callable, Any, Optional

try:
    from logging_utils import log_event
except ImportError:
    def log_event(level, msg, ep="circuit_breaker"):
        logging.log(level, f"[{ep}] {msg}")


class CircuitBreakerOpenException(Exception):
    """Raised when circuit breaker is in OPEN state."""
    pass


class CircuitBreaker:
    """
    3-State Circuit Breaker pattern.
    - CLOSED: Normal operation. Counts failures.
    - OPEN: Service degraded. Rejects requests or executes fallback immediately.
    - HALF-OPEN: Reset timeout elapsed. Allows trial request to test recovery.
    """

    def __init__(self, name: str, fail_max: int = 5, reset_timeout: float = 60.0):
        self.name = name
        self.fail_max = fail_max
        self.reset_timeout = reset_timeout
        self.state = "CLOSED"
        self.failure_count = 0
        self.last_state_change = time.time()
        self._lock = asyncio.Lock()

    async def call(self, func: Callable, fallback_func: Optional[Callable] = None, *args, **kwargs) -> Any:
        """Executes func within circuit breaker protection."""
        async with self._lock:
            current_time = time.time()
            
            # Check state transition from OPEN to HALF-OPEN after reset_timeout
            if self.state == "OPEN":
                if current_time - self.last_state_change > self.reset_timeout:
                    self.state = "HALF-OPEN"
                    self.last_state_change = current_time
                    log_event(logging.INFO, f"CircuitBreaker '{self.name}' transitioned to HALF-OPEN (testing recovery)", "circuit_breaker")
                else:
                    log_event(logging.WARNING, f"CircuitBreaker '{self.name}' is OPEN. Triggering fallback.", "circuit_breaker")
                    if fallback_func:
                        res = fallback_func(*args, **kwargs)
                        return await res if asyncio.iscoroutine(res) else res
                    raise CircuitBreakerOpenException(f"CircuitBreaker '{self.name}' is OPEN")

        # Execute target function
        try:
            res = func(*args, **kwargs)
            if asyncio.iscoroutine(res):
                result = await res
            else:
                result = res

            # On success in HALF-OPEN or CLOSED
            async with self._lock:
                if self.state == "HALF-OPEN":
                    self.state = "CLOSED"
                    self.failure_count = 0
                    self.last_state_change = time.time()
                    log_event(logging.INFO, f"CircuitBreaker '{self.name}' recovered to CLOSED state", "circuit_breaker")
                elif self.state == "CLOSED":
                    self.failure_count = 0

            return result

        except Exception as exc:
            async with self._lock:
                self.failure_count += 1
                log_event(logging.WARNING, f"CircuitBreaker '{self.name}' failure {self.failure_count}/{self.fail_max}: {exc}", "circuit_breaker")

                if self.failure_count >= self.fail_max or self.state == "HALF-OPEN":
                    self.state = "OPEN"
                    self.last_state_change = time.time()
                    log_event(logging.ERROR, f"CircuitBreaker '{self.name}' tripped to OPEN state after {self.failure_count} failures", "circuit_breaker")

            if fallback_func:
                res = fallback_func(*args, **kwargs)
                return await res if asyncio.iscoroutine(res) else res
            raise exc


# Pre-instantiated circuit breakers for core services
redis_breaker = CircuitBreaker("redis_service", fail_max=5, reset_timeout=30.0)
tmdb_breaker = CircuitBreaker("tmdb_api", fail_max=5, reset_timeout=60.0)
event_breaker = CircuitBreaker("event_producer", fail_max=3, reset_timeout=15.0)
