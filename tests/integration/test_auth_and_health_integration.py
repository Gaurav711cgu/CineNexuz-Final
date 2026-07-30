"""
Integration Tests for Security Headers, Health Probes & Auth Endpoints (PART F2)
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from server import app
from security.auth import create_refresh_token, create_access_token

client = TestClient(app)


def test_shallow_and_deep_health_endpoints():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "timestamp" in data

    res_deep = client.get("/health/deep")
    assert res_deep.status_code == 200
    deep_data = res_deep.json()
    assert "checks" in deep_data
    assert "mongodb" in deep_data["checks"]


def test_owasp_security_headers_presence():
    res = client.get("/health")
    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["X-Frame-Options"] == "DENY"
    assert res.headers["X-XSS-Protection"] == "1; mode=block"
    assert "Strict-Transport-Security" in res.headers
    assert "X-Trace-ID" in res.headers


def test_refresh_token_rotation_flow():
    user_id = "test_user_integration_999"
    refresh_token = create_refresh_token(user_id=user_id)

    res = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"
