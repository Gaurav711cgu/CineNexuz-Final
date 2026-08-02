"""
Unit tests for CineNexuz Cold-Start Handling, Evaluation Framework,
Statistical A/B Testing, and MCP Server.
"""

import sys
import os
import pytest

# Ensure backend and root directory are in sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class TestRecommendationEvaluator:
    """Test Precision@K, Recall@K, NDCG@K, Coverage, ILD, and benchmark suite."""

    def test_precision_recall_ndcg(self):
        from eval.recommendation_eval import RecommendationEvaluator
        evaluator = RecommendationEvaluator(rating_threshold=3.5, k=10)
        
        recs = ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"]
        ground_truth = {"m1", "m3", "m5"}
        
        p = evaluator.precision_at_k(recs, ground_truth)
        r = evaluator.recall_at_k(recs, ground_truth)
        n = evaluator.ndcg_at_k(recs, ground_truth)

        assert p == pytest.approx(0.3)
        assert r == pytest.approx(1.0)
        assert 0.0 < n <= 1.0

    def test_catalog_coverage_and_ild(self):
        from eval.recommendation_eval import RecommendationEvaluator
        evaluator = RecommendationEvaluator(k=5)

        recs_all = [
            ["m1", "m2", "m3"],
            ["m4", "m5", "m6"]
        ]
        cov = evaluator.catalog_coverage(recs_all, catalog_size=20)
        assert cov == pytest.approx(30.0)

        # ILD test with distinct genres
        genre_sets = [["Action", "Sci-Fi"], ["Drama", "Romance"]]
        ild = evaluator.intra_list_diversity(genre_sets)
        assert ild == pytest.approx(1.0)  # zero genre overlap -> ILD = 1.0

    def test_benchmark_report_execution(self):
        from eval.recommendation_eval import run_benchmark_report
        report = run_benchmark_report()
        assert "overall" in report
        assert "cold_start_users" in report
        assert "established_users" in report
        assert report["overall"]["precision_at_10"] >= 0.0


class TestABTestingSignificance:
    """Test A/B conversion logging and Chi-squared p-value calculation."""

    def test_statistical_significance_calculation(self):
        from ml.ab_testing import log_experiment_event, calculate_experiment_significance
        
        # Log impressions and clicks
        for _ in range(500):
            log_experiment_event("test_exp", "control_variant", "impression")
        for _ in range(50):
            log_experiment_event("test_exp", "control_variant", "click")

        for _ in range(500):
            log_experiment_event("test_exp", "treatment_variant", "impression")
        for _ in range(120):
            log_experiment_event("test_exp", "treatment_variant", "click")

        stats_res = calculate_experiment_significance("test_exp")
        assert stats_res["experiment"] == "test_exp"
        assert "p_value" in stats_res["metrics"]
        assert stats_res["metrics"]["ctr_relative_lift_pct"] > 0
        assert stats_res["metrics"]["p_value"] < 0.05
        assert stats_res["metrics"]["is_statistically_significant"] is True


class TestExplainabilityEngine:
    """Test detailed multi-factor explainability output."""

    def test_explain_recommendation_detailed(self):
        from ml.explainability import explain_recommendation_detailed
        movie = {"id": "m101", "genres": ["Sci-Fi", "Action"], "vote_average": 8.5, "svd_score": 0.92}
        taste = {"genre_weights": {"Sci-Fi": 0.5, "Action": 0.3}}

        res = explain_recommendation_detailed(movie, taste, algorithm="hybrid")
        assert "primary_reason" in res
        assert "factor_scores" in res
        assert res["factor_scores"]["svd_collaborative_score"] == 0.92
        assert "Sci-Fi" in res["matched_genres"]


class TestMCPServerTools:
    """Test FastAPI MCP Server endpoints."""

    def test_mcp_tools_list(self):
        from fastapi.testclient import TestClient
        from mcp_server import app

        client = TestClient(app)
        resp = client.get("/mcp/tools/list")
        assert resp.status_code == 200
        data = resp.json()
        assert "tools" in data
        tool_names = [t["name"] for t in data["tools"]]
        assert "cinenexuz_recommend" in tool_names
        assert "cinenexuz_explain" in tool_names
        assert "cinenexuz_eval" in tool_names

    def test_mcp_recommend_invocation(self):
        from fastapi.testclient import TestClient
        from mcp_server import app

        client = TestClient(app)
        resp = client.post("/mcp/tools/cinenexuz_recommend", json={"user_id": "test_mcp_user", "limit": 5})
        assert resp.status_code == 200
        data = resp.json()
        assert data["user_id"] == "test_mcp_user"
        assert len(data["recommendations"]) == 5
        assert "explanation" in data["recommendations"][0]
