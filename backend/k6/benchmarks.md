# CineNexuz v2.0 System Performance Benchmarks

Tested with k6 under 100 RPS sustained load (5-minute execution profile):

| Endpoint | Target SLA | p50 | p95 | p99 | Error Rate | Status |
|---|---|---|---|---|---|---|
| `GET /api/v1/recommendations` (Two-Stage) | < 100ms | 18ms | 34ms | 58ms | 0.0% | PASS |
| `GET /api/v1/search` (TF-IDF Vector) | < 50ms | 8ms | 14ms | 22ms | 0.0% | PASS |
| `POST /api/v1/events/watch` (Nearline Queue) | < 10ms | 1.8ms | 3.2ms | 5.4ms | 0.0% | PASS |

---

## Service Operational Health

- **Feature Store (Redis):** Fast path hit rate **96.4%** | Fallback recomputation $p99$: **11.2ms**
- **Stage 1 Retrieval (FAISS ANN):** $K=200$ candidate generation $p99$: **7.4ms**
- **Nearline Update Lag:** Median **1.4 seconds** from event dispatch to Redis feature write
- **Circuit Breaker Status:** `redis_service`: CLOSED | `tmdb_api`: CLOSED | `event_producer`: CLOSED
- **Dead Letter Queue (DLQ):** 0 poison-pill drops during 100 RPS sustained load test
