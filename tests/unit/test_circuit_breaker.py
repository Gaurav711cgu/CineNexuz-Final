"""
Unit tests for Circuit Breaker 3-state pattern (Closed -> Open -> Half-Open).
"""
import pytest
import asyncio
from resilience.circuit_breaker import CircuitBreaker, CircuitBreakerOpenException


@pytest.mark.asyncio
async def test_circuit_breaker_normal_closed_operation():
    breaker = CircuitBreaker(name="test_service", fail_max=3, reset_timeout=1.0)
    
    async def sample_fn():
        return "success"

    res = await breaker.call(sample_fn)
    assert res == "success"
    assert breaker.state == "CLOSED"
    assert breaker.failure_count == 0


@pytest.mark.asyncio
async def test_circuit_breaker_trips_to_open_on_failures():
    breaker = CircuitBreaker(name="test_service", fail_max=2, reset_timeout=1.0)

    async def failing_fn():
        raise ValueError("Service error")

    # Failure 1
    with pytest.raises(ValueError):
        await breaker.call(failing_fn)
    assert breaker.state == "CLOSED"
    assert breaker.failure_count == 1

    # Failure 2 -> Trips to OPEN
    with pytest.raises(ValueError):
        await breaker.call(failing_fn)
    assert breaker.state == "OPEN"

    # Subsequent call while OPEN throws CircuitBreakerOpenException immediately
    with pytest.raises(CircuitBreakerOpenException):
        await breaker.call(failing_fn)


@pytest.mark.asyncio
async def test_circuit_breaker_fallback_execution():
    breaker = CircuitBreaker(name="test_service", fail_max=1, reset_timeout=5.0)

    async def failing_fn():
        raise ConnectionError("Connection refused")

    def fallback_fn():
        return "fallback_response"

    # Call fails and triggers fallback
    res = await breaker.call(failing_fn, fallback_func=fallback_fn)
    assert res == "fallback_response"
    assert breaker.state == "OPEN"

    # Calling while OPEN executes fallback immediately
    res2 = await breaker.call(failing_fn, fallback_func=fallback_fn)
    assert res2 == "fallback_response"
