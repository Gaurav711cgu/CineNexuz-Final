# ADR-001: Three-Tier Computation Architecture (Offline + Nearline + Online)

## Status
Accepted

## Context
Recommendation staleness occurs when user session interactions (e.g. watching 3 consecutive sci-fi thrillers) are not reflected in recommendation outputs until the next batch training cycle (6–24 hours later). Synchronous feature updates during HTTP requests add 200–400ms to online latency SLAs.

## Decision
Implement Netflix's three-tier computation pattern:
- **Offline:** Batch retraining of SVD Collaborative Filter and vector embeddings (runs daily via APScheduler).
- **Nearline:** Event-driven worker consuming `movie.watched` and `rating.submitted` events asynchronously via Kafka/queue, recomputing user affinity vectors and updating Redis within <5 seconds.
- **Online:** Serving recommendations in <50ms by reading precomputed online features from Redis and executing Two-Stage Retrieval.

## Consequences
- Decouples write operations from response paths (202 Accepted pattern).
- Eliminates recommendation staleness during active sessions.
- Keeps online serving latency strictly under p99 < 50ms SLA.
