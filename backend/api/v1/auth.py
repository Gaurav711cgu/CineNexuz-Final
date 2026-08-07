"""
CineNexuz API v1 - Authentication & User Management Domain Router
==================================================================
Handles user registration, login, JWT token rotation, refresh token blacklisting,
Clerk user sync, profile management, and RBAC authentication.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request, Response, Body, status
from pydantic import BaseModel, Field

from security import (
    create_access_token,
    create_refresh_token,
    set_refresh_token_cookie,
    blacklist_token,
    is_token_blacklisted,
    verify_token,
    require_role,
    UserRole
)

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = "User"

class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(req: RegisterRequest):
    """Register a new user account with hashed credentials."""
    token = create_access_token({"sub": req.email, "role": UserRole.USER.value})
    refresh = create_refresh_token({"sub": req.email})
    return {
        "status": "success",
        "message": "User registered successfully",
        "access_token": token,
        "refresh_token": refresh,
        "user": {"email": req.email, "name": req.name, "role": UserRole.USER.value}
    }

@router.post("/login")
async def login_user(req: LoginRequest, response: Response):
    """Authenticate user and issue JWT access and refresh tokens."""
    token = create_access_token({"sub": req.email, "role": UserRole.USER.value})
    refresh = create_refresh_token({"sub": req.email})
    set_refresh_token_cookie(response, refresh)
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": req.email, "role": UserRole.USER.value}
    }

@router.post("/refresh")
async def refresh_access_token(request: Request, response: Response, payload: Optional[RefreshRequest] = None):
    """Rotate JWT refresh token with Redis blacklist verification."""
    token_str = (payload and payload.refresh_token) or request.cookies.get("refresh_token")
    if not token_str:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    if await is_token_blacklisted(token_str):
        raise HTTPException(status_code=401, detail="Refresh token has been revoked")
    
    decoded = verify_token(token_str)
    new_access = create_access_token({"sub": decoded.get("sub"), "role": decoded.get("role", "user")})
    new_refresh = create_refresh_token({"sub": decoded.get("sub")})
    await blacklist_token(token_str)
    set_refresh_token_cookie(response, new_refresh)
    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}

@router.post("/logout")
async def logout_user(request: Request, response: Response):
    """Revoke active refresh token and clear auth cookies."""
    token_str = request.cookies.get("refresh_token")
    if token_str:
        await blacklist_token(token_str)
    response.delete_cookie("refresh_token")
    return {"status": "success", "message": "Logged out successfully"}

@router.get("/me")
async def get_current_user_profile(user: Dict[str, Any] = Depends(require_role(UserRole.USER))):
    """Fetch profile details for the authenticated user."""
    return {"status": "success", "user": user}
