# ADR-004: Circuit Breaker Resilience Pattern

## Status
Accepted

## Context
External service outages (Redis, TMDB API, Kafka) cause cascading failures and request timeouts across backend services.

## Decision
Wrap Redis, TMDB API, and event stream calls in a 3-State (`Closed`, `Open`, `Half-Open`) Circuit Breaker pattern (`backend/resilience/circuit_breaker.py`).
- **Closed:** Normal execution. Counts consecutive failures.
- **Open:** Trips after 5 consecutive failures. Executes fallback immediately (e.g. serving precomputed recommendations from Postgres/Mongo).
- **Half-Open:** Automatically transitions after 30–60s reset timeout to test recovery.

## Consequences
- Prevents cascading system crashes during dependency downtime.
- Service degrades gracefully instead of hard failing.
