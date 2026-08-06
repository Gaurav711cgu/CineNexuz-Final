"""
Unit tests for MMR Diversification Reranking and Mann-Whitney U A/B Testing.
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


class TestMMRReranker:

    def test_mmr_rerank_basic(self):
        from ml.mmr_reranker import mmr_rerank, jaccard_genre_similarity

        candidates = [
            {"id": "m1", "title": "Sci-Fi 1", "genres": ["Sci-Fi", "Action"], "svd_score": 0.95},
            {"id": "m2", "title": "Sci-Fi 2", "genres": ["Sci-Fi", "Action"], "svd_score": 0.94},
            {"id": "m3", "title": "Sci-Fi 3", "genres": ["Sci-Fi", "Action"], "svd_score": 0.93},
            {"id": "m4", "title": "Drama 1", "genres": ["Drama", "Romance"], "svd_score": 0.88},
            {"id": "m5", "title": "Horror 1", "genres": ["Horror", "Thriller"], "svd_score": 0.85},
        ]

        # Pure relevance would pick m1, m2, m3.
        # MMR with lambda=0.5 should pick m1 first, then penalize m2/m3 for genre overlap, picking m4 (Drama).
        results = mmr_rerank(candidates, top_k=3, lambda_param=0.5, relevance_key="svd_score")
        assert len(results) == 3
        ids = [r["id"] for r in results]
        assert "m1" in ids
        assert "m4" in ids  # Diverse candidate promoted!

    def test_jaccard_similarity(self):
        from ml.mmr_reranker import jaccard_genre_similarity
        assert jaccard_genre_similarity(["Action", "Sci-Fi"], ["Action", "Sci-Fi"]) == pytest.approx(1.0)
        assert jaccard_genre_similarity(["Action"], ["Drama"]) == pytest.approx(0.0)
        assert jaccard_genre_similarity(["Action", "Sci-Fi"], ["Action", "Drama"]) == pytest.approx(1/3)


class TestMannWhitneyABTesting:

    def test_mann_whitney_u_significance(self):
        from ml.ab_testing import log_experiment_event, calculate_experiment_significance

        # Log distinct rating distributions
        for r in [2.0, 2.5, 3.0, 3.0, 3.5, 2.0, 1.5, 3.0, 2.5, 3.0] * 5:
            log_experiment_event("mw_exp", "control_variant", "rating", rating_value=r)

        for r in [4.5, 5.0, 4.0, 5.0, 4.5, 4.0, 5.0, 4.5, 5.0, 4.0] * 5:
            log_experiment_event("mw_exp", "treatment_variant", "rating", rating_value=r)

        res = calculate_experiment_significance("mw_exp", alpha=0.05)
        assert res["experiment"] == "mw_exp"
        assert "mann_whitney_p_value" in res["metrics"]
        assert "mann_whitney_u_statistic" in res["metrics"]
        assert res["metrics"]["mann_whitney_p_value"] < 0.05
        assert res["metrics"]["is_statistically_significant"] is True
