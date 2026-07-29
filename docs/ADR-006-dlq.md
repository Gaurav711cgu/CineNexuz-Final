# ADR-006: Dead Letter Queue (DLQ) for Failed Consumer Events

## Status
Accepted

## Context
Transient consumer errors or malformed event payloads cause silent data loss if failed events are discarded without retries or isolation.

## Decision
Route event processing through a Dead Letter Queue (`backend/resilience/dlq.py`).
- Retries failed event processing 3 times with backoff.
- On 3rd failure, moves event payload to Dead Letter Queue list (`dlq_events`) for manual review and alerting.

## Consequences
- Prevents silent event drops and feature vector drift.
- Isolates poison-pill payloads without blocking the main event queue worker.
