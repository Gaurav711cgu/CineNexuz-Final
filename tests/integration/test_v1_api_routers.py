"""
Integration Unit Tests for Domain-Driven API v1 Routers
=========================================================
Verifies router endpoints for Auth, Movies, Recommendations, AI, Analytics, and Streaming.
"""
import sys
import os
import pytest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

class TestAPIV1AuthRouter:
    def test_register_and_login_flow(self):
        reg_res = client.post("/api/v1/auth/register", json={"email": "v1test@example.com", "password": "password123"})
        assert reg_res.status_code == 201
        data = reg_res.json()
        assert "access_token" in data
        assert data["status"] == "success"

        login_res = client.post("/api/v1/auth/login", json={"email": "v1test@example.com", "password": "password123"})
        assert login_res.status_code == 200
        l_data = login_res.json()
        assert "access_token" in l_data

class TestAPIV1MoviesRouter:
    def test_get_movies_and_trending(self):
        res = client.get("/api/v1/movies?limit=5&decade=2020s")
        assert res.status_code == 200
        data = res.json()
        assert len(data["movies"]) == 5

        trend_res = client.get("/api/v1/movies/trending?limit=3")
        assert trend_res.status_code == 200
        assert len(trend_res.json()["trending"]) == 3

class TestAPIV1RecommendationsRouter:
    def test_get_recommendations_and_explanation(self):
        res = client.get("/api/v1/recommendations?user_id=usr_99&limit=5&diversity_lambda=0.8")
        assert res.status_code == 200
        data = res.json()
        assert len(data["recommendations"]) == 5

class TestAPIV1AIRouter:
    def test_rag_search_and_film_studio(self):
        rag_res = client.post("/api/v1/ai/rag-search", json={"query": "space travel sci-fi"})
        assert rag_res.status_code == 200
        assert len(rag_res.json()["results"]) > 0

        studio_res = client.post("/api/v1/ai/film-studio", json={"genre_prompt": "cyberpunk", "target_audience": "young adults"})
        assert studio_res.status_code == 200
        assert "script_outline" in studio_res.json()

class TestAPIV1AnalyticsRouter:
    def test_log_events_and_deep_health(self):
        evt_res = client.post("/api/v1/analytics/events", json={"user_id": "u1", "item_id": "m1", "event_type": "CLICK"})
        assert evt_res.status_code == 200
        assert evt_res.json()["status"] == "success"

        health_res = client.get("/api/v1/analytics/health/deep")
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "healthy"

class TestAPIV1StreamingRouter:
    def test_hls_master_playlist(self):
        res = client.get("/api/v1/stream/movie_100/master.m3u8")
        assert res.status_code == 200
        assert "#EXTM3U" in res.text
