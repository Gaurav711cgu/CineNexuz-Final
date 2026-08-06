"""
Unit tests for AIServiceManager lazy loading and component health probes.
"""

import sys
import os
import pytest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class TestAIServiceManager:

    def test_lazy_getters(self):
        from ai_service_manager import ai_service_manager
        
        # Test getters return without crashing even if fallback active
        svd = ai_service_manager.get_svd_recommender()
        assert svd is not None or ai_service_manager._component_status["svd"]["status"] in ["ok", "degraded"]

        tfidf = ai_service_manager.get_scratch_tfidf()
        assert tfidf is not None or ai_service_manager._component_status["tfidf"]["status"] in ["ok", "degraded"]

        faiss = ai_service_manager.get_faiss_retriever()
        assert faiss is not None or ai_service_manager._component_status["faiss"]["status"] in ["ok", "degraded"]

    def test_health_status(self):
        from ai_service_manager import ai_service_manager
        health = ai_service_manager.get_health_status()
        assert "overall_status" in health
        assert "components" in health
        assert health["overall_status"] in ["ok", "degraded"]
        assert "svd" in health["components"]
        assert "faiss" in health["components"]
