# ADR-005: Redis Token Bucket Rate Limiting

## Status
Accepted

## Context
Unthrottled API requests expose recommendation and search compute resources to burst attacks and resource starvation.

## Decision
Implement a Redis-backed Token Bucket rate limiter (`backend/resilience/rate_limiter.py`) configured to 60 requests/minute per user key with smooth token refill.

## Consequences
- Protects recommendation endpoints against abuse while permitting natural traffic bursts.
- Returns standard HTTP 429 status code with retry-after headers upon bucket exhaustion.
