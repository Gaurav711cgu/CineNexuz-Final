# ADR-007: Enterprise Dual-Token Architecture with Redis JTI Revocation Blacklisting

## Status
**Accepted & Implemented**

## Context & Problem Statement
Stateless JWT authentication offers scalability but lacks immediate session revocation capabilities. If a JWT access token is stolen or a user logs out, the token remains valid until its natural expiration time. Relying solely on long-lived access tokens introduces significant security risks (credential theft, replay attacks, XSS session hijack).

## Decision Driver
- Mitigate XSS attacks targeting browser storage.
- Mitigate CSRF attacks across origins.
- Enable instantaneous `O(1)` token revocation on `/api/auth/logout` or token refresh rotation without database bottlenecks.
- Enforce strict separation between API authorization and session maintenance.

## Considered Options
1. **Single Long-Lived JWT (24h - 30d)**: Rejected (Insecure; cannot revoke prematurely without database state lookups on every request).
2. **Server-Side Database Sessions (MongoDB/PostgreSQL query per request)**: Rejected (High database latency overhead on high-frequency API calls).
3. **Dual-Token System (Short-Lived Access JWT + HttpOnly Refresh Cookie) + Redis JTI Blacklisting**: **Selected**.

## Decision & Technical Architecture

### 1. Dual-Token Specification
- **Access Token**:
  - **Lifetime**: 15 minutes (`ACCESS_TOKEN_TTL_SECONDS = 900`).
  - **Payload**: User ID (`sub`), Role (`role`), Type (`type: access`), Unique Identifier (`jti: UUIDv4`), Issued At (`iat`), Expiry (`exp`).
  - **Transport**: `Authorization: Bearer <token>` HTTP header.
- **Refresh Token**:
  - **Lifetime**: 7 days (`REFRESH_TOKEN_TTL_SECONDS = 604800`).
  - **Payload**: User ID (`sub`), Type (`type: refresh`), Unique Identifier (`jti: UUIDv4`), Issued At (`iat`), Expiry (`exp`).
  - **Transport**: `HttpOnly`, `Secure`, `SameSite=Strict` Cookie (`path=/api/auth`).

### 2. Redis JTI Blacklisting Engine
- Every token contains a globally unique JWT ID (`jti`).
- Upon `/api/auth/logout` or token rotation during `/api/auth/refresh`:
  1. The server extracts the token's `jti`.
  2. The `jti` is stored in Redis under key `token:blacklist:<jti>` with `TTL = remaining_token_expiry`.
  3. Memory cleanup is handled automatically by Redis TTL expiration.
- On every protected request:
  1. `verify_token()` decodes the signature.
  2. Executes an `O(1)` Redis check: `EXISTS token:blacklist:<jti>`.
  3. If blacklisted, raises `HTTP 401 Unauthorized ("Token has been revoked/logout")`.

### 3. Sequence Flow

```
Client App                   FastAPI Gateway                 Upstash Redis               MongoDB Atlas
    │                              │                              │                            │
    ├───── POST /api/auth/login ──>│                              │                            │
    │                              ├──────── Validate Creds ──────────────────────────────────>│
    │                              │<─────── User Record ──────────────────────────────────────┤
    │                              ├─ Create Access (15m, JTI-A)  │                            │
    │                              ├─ Create Refresh (7d, JTI-R)  │                            │
    │<── 200 OK (JWT + Cookie) ────┤                              │                            │
    │                              │                              │                            │
    │── GET /api/movies (Bearer) ─>│                              │                            │
    │                              ├─ Verify JTI-A ──────────────>│ (O(1) EXISTS)              │
    │                              │<─ Not Blacklisted ───────────┤                            │
    │<── 200 OK (Data) ────────────┤                              │                            │
    │                              │                              │                            │
    │── POST /api/auth/logout ────>│                              │                            │
    │                              ├─ SetEX token:blacklist:JTI-A ┼> [TTL: 900s]               │
    │                              ├─ SetEX token:blacklist:JTI-R ┼> [TTL: 604800s]            │
    │<── 200 OK (Clear Cookie) ────┤                              │                            │
```

## Consequences
- **Positive**:
  - Sub-millisecond `O(1)` token revocation checks.
  - Zero DB load for session validation.
  - Immunity to XSS token theft via `HttpOnly` refresh cookie protection.
  - Immediate kill-switch capability for compromised credentials.
- **Negative**:
  - Requires Redis instance (handled via Upstash Redis fallback logic in production).
