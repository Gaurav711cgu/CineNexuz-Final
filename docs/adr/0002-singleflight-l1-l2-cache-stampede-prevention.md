# ADR-0002: L1 In-Memory + L2 Redis Caching with Singleflight Mutex Protection

## Status
Accepted

## Context & Problem Statement
Under high concurrency (10,000+ QPS), when a popular recommendation cache key expires in Redis, thousands of incoming requests simultaneously miss the cache and hit the database/SVD ML model (Thundering Herd / Cache Stampede). This leads to database CPU spikes, thread starvation, and HTTP 500 errors.

## Decision Outcome
Chosen **Singleflight Mutex Group** combined with **L1 In-Memory LRU + L2 Redis Distributed Cache**.

### Positive Consequences
- **Singleflight Guarantee:** Exactly **1** database/SVD execution occurs when a key expires. All concurrent requests wait on a shared asynchronous Future and receive the same returned result.
- Reduces DB read load by 99.8% during high-concurrency key expiration spikes.
- L1 LRU cache provides microsecond local response times for ultra-hot trending queries.

### Negative Consequences
- Slight RAM usage overhead for L1 LRU in-memory dictionaries.
