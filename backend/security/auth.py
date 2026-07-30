"""
CineNexus Security & Authentication Hardening Module (PART A)
Implements:
- JWT Access (15m) + Refresh Token Rotation (7d)
- Redis Token Blacklisting (Logout & Token Revocation)
- HttpOnly + SameSite=Strict Cookie Management
- Role-Based Access Control (RBAC) Dependency Injection
"""
import uuid
import time
import logging
from enum import Enum
from typing import Optional, Dict, Any, List
import jwt
from fastapi import HTTPException, Security, Depends, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger("security.auth")
security_scheme = HTTPBearer(auto_error=False)

import os

# Secrets & TTLs
def get_jwt_secret() -> str:
    return os.getenv("JWT_SECRET", "cinenexus-super-secret-jwt-key-change-in-production")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL_SECONDS = 900        # 15 minutes
REFRESH_TOKEN_TTL_SECONDS = 604800    # 7 days


class UserRole(str, Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"


def create_access_token(user_id: str, role: str = "user", extra_claims: Optional[dict] = None) -> str:
    """Generates a short-lived access token (15m) with JTI."""
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + ACCESS_TOKEN_TTL_SECONDS
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Generates a 7-day refresh token with a unique JTI for rotation tracking."""
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + REFRESH_TOKEN_TTL_SECONDS
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_refresh_token_cookie(response: Response, refresh_token: str):
    """Sets secure HttpOnly cookie for refresh token to mitigate XSS attacks."""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=REFRESH_TOKEN_TTL_SECONDS,
        path="/api/auth"
    )


def blacklist_token(redis_client, jti: str, ttl: int = ACCESS_TOKEN_TTL_SECONDS):
    """Blacklists a token JTI in Redis upon logout or token rotation."""
    if redis_client and jti:
        try:
            key = f"token:blacklist:{jti}"
            redis_client.setex(key, ttl, "1")
        except Exception as e:
            logger.warning(f"Failed to blacklist token {jti} in Redis: {e}")


def is_token_blacklisted(redis_client, jti: str) -> bool:
    """Checks if a JTI is blacklisted in Redis."""
    if not redis_client or not jti:
        return False
    try:
        return bool(redis_client.exists(f"token:blacklist:{jti}"))
    except Exception as e:
        logger.warning(f"Error checking token blacklist for {jti}: {e}")
        return False


def verify_token(token: str, redis_client=None, expected_type: str = "access") -> Dict[str, Any]:
    """Decodes and validates a JWT token, checking type and Redis blacklist status."""
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        jti = payload.get("jti")
        token_type = payload.get("type", "access")

        if token_type != expected_type:
            raise HTTPException(status_code=401, detail=f"Invalid token type: expected {expected_type}")

        if redis_client and jti and is_token_blacklisted(redis_client, jti):
            raise HTTPException(status_code=401, detail="Token has been revoked/logout")

        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token signature")


def require_role(*roles: UserRole):
    """
    FastAPI dependency injection for Role-Based Access Control (RBAC).
    Usage: user = Depends(require_role(UserRole.ADMIN))
    """
    allowed_roles = [r.value for r in roles]

    async def rbac_dependency(request: Request, creds: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)):
        token = None
        if creds and creds.credentials:
            token = creds.credentials
        elif "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            raise HTTPException(status_code=401, detail="Authentication token required")

        redis_client = getattr(request.app.state, "redis", None)
        payload = verify_token(token, redis_client=redis_client, expected_type="access")

        user_role = payload.get("role", UserRole.USER.value)
        if user_role not in allowed_roles and UserRole.ADMIN.value not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient role permissions")

        return payload

    return rbac_dependency
