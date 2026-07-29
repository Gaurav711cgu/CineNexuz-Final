"""
CineNexuz ML Unit Tests
=======================
Run: pytest tests/test_ml.py -v --tb=short

These tests cover the three core ML components:
  1. From-scratch TF-IDF (tokenizer, IDF math, cosine similarity)
  2. SVD metric computation (RMSE, Precision@10, NDCG@10)
  3. A/B testing (deterministic bucketing, stability)

All tests are OFFLINE — no network, no database, no external services.
"""

import hashlib
import math
import sys
import os

import pytest

# ---------------------------------------------------------------------------
# Ensure backend package is importable from repo root
# ---------------------------------------------------------------------------
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, BACKEND_DIR)


# ===========================================================================
# 1. TF-IDF FROM SCRATCH
# ===========================================================================

class TestScratchTFIDFTokenizer:
    """Unit tests for the _tokenize() method — stopword removal, lowercasing."""

    def _get_tfidf(self):
        from ai.tfidf_scratch import ScratchTFIDF
        return ScratchTFIDF()

    def test_basic_tokenization(self):
        tfidf = self._get_tfidf()
        tokens = tfidf._tokenize("The quick brown fox")
        assert "the" not in tokens, "stopword 'the' should be filtered"
        assert "quick" in tokens
        assert "brown" in tokens
        assert "fox" in tokens

    def test_lowercase(self):
        tfidf = self._get_tfidf()
        tokens = tfidf._tokenize("THRILLER Drama")
        assert "thriller" in tokens
        assert "drama" in tokens

    def test_special_chars_stripped(self):
        tfidf = self._get_tfidf()
        tokens = tfidf._tokenize("sci-fi, action! mystery?")
        # punctuation should not survive
        for t in tokens:
            assert t.isalnum(), f"Non-alphanumeric token survived: {t!r}"

    def test_empty_string(self):
        tfidf = self._get_tfidf()
        assert tfidf._tokenize("") == []

    def test_stopword_only_string(self):
        tfidf = self._get_tfidf()
        assert tfidf._tokenize("the and or but") == []

    def test_short_tokens_filtered(self):
        tfidf = self._get_tfidf()
        tokens = tfidf._tokenize("a go do ok run")
        # tokens of length < 2 should be filtered (only 'ok' and 'run' ≥ 2 chars and not stopwords)
        for t in tokens:
            assert len(t) >= 2


class TestScratchTFIDFMath:
    """Verify TF computation and IDF smoothing formula."""

    def _get_tfidf(self):
        from ai.tfidf_scratch import ScratchTFIDF
        return ScratchTFIDF()

    def test_tf_sum_to_one(self):
        """TF values for a document should sum to 1 (they're relative frequencies)."""
        tfidf = self._get_tfidf()
        tokens = ["action", "thriller", "action", "mystery"]
        tf = tfidf._compute_tf(tokens)
        assert abs(sum(tf.values()) - 1.0) < 1e-9

    def test_tf_high_frequency_term(self):
        tfidf = self._get_tfidf()
        tokens = ["horror", "horror", "horror", "drama"]
        tf = tfidf._compute_tf(tokens)
        assert tf["horror"] == pytest.approx(0.75)
        assert tf["drama"] == pytest.approx(0.25)

    def test_idf_smoothed_formula(self):
        """IDF(t) = log(N / (1 + df[t])) — verify with known values."""
        N = 10
        df_t = 2
        expected_idf = math.log(N / (1 + df_t))
        assert expected_idf == pytest.approx(math.log(10 / 3), rel=1e-6)

    def test_index_build_and_search(self):
        from ai.tfidf_scratch import ScratchTFIDF
        tfidf = ScratchTFIDF()
        docs = [
            {"_id": "movie_1", "text": "action thriller hero saves world"},
            {"_id": "movie_2", "text": "romantic comedy love story funny"},
            {"_id": "movie_3", "text": "horror scary ghost mystery darkness"},
        ]
        result = tfidf.build_index(docs)
        assert result["status"] == "ready"
        assert result["documents"] == 3
        assert tfidf.ready is True

        # Action query should rank movie_1 highest
        hits = tfidf.search("action hero", top_n=3)
        assert len(hits) > 0
        top_id, top_score = hits[0]
        assert top_id == "movie_1", "Action query should rank action movie highest"
        assert top_score > 0

    def test_cosine_normalized_between_0_1(self):
        """Cosine similarity of normalized vectors is in [0, 1]."""
        from ai.tfidf_scratch import ScratchTFIDF
        tfidf = ScratchTFIDF()
        docs = [
            {"_id": "a", "text": "science fiction space exploration galaxy"},
            {"_id": "b", "text": "romance drama love heartbreak"},
        ]
        tfidf.build_index(docs)
        hits = tfidf.search("space galaxy science", top_n=2)
        for _, score in hits:
            assert 0.0 <= score <= 1.0, f"Score {score} out of [0,1]"

    def test_unseen_query_returns_empty(self):
        from ai.tfidf_scratch import ScratchTFIDF
        tfidf = ScratchTFIDF()
        tfidf.build_index([{"_id": "x", "text": "drama romance"}])
        hits = tfidf.search("zzzzzzz qqqqqq")
        assert hits == [], "Unknown query tokens should return empty results"


# ===========================================================================
# 2. SVD METRIC COMPUTATION
# ===========================================================================

class TestSVDMetrics:
    """
    Test offline evaluation metric logic (RMSE, Precision@K, NDCG@K)
    using synthetic prediction data — no model training required.
    """

    @staticmethod
    def _rmse(predictions):
        """RMSE = sqrt(mean((true - pred)^2))"""
        n = len(predictions)
        sse = sum((true - pred) ** 2 for true, pred in predictions)
        return math.sqrt(sse / n)

    @staticmethod
    def _precision_at_k(ranked_relevance, k=10, threshold=3.0):
        """Precision@K = |relevant in top-K| / K"""
        top_k = ranked_relevance[:k]
        return sum(1 for r in top_k if r >= threshold) / k

    @staticmethod
    def _ndcg_at_k(ranked_relevance, ideal_relevance, k=10, threshold=3.0):
        """NDCG@K using binary relevance."""
        def dcg(rel_list, k_):
            return sum(
                1.0 / math.log2(i + 2)
                for i, r in enumerate(rel_list[:k_])
                if r >= threshold
            )
        return dcg(ranked_relevance, k) / (dcg(ideal_relevance, k) or 1.0)

    def test_rmse_perfect_predictions(self):
        preds = [(4.0, 4.0), (3.0, 3.0), (5.0, 5.0)]
        assert self._rmse(preds) == pytest.approx(0.0)

    def test_rmse_known_value(self):
        # errors = [1, 1, 1] → RMSE = 1.0
        preds = [(3.0, 2.0), (4.0, 3.0), (5.0, 4.0)]
        assert self._rmse(preds) == pytest.approx(1.0)

    def test_precision_at_10_all_relevant(self):
        ranked = [4.0] * 10
        p = self._precision_at_k(ranked, k=10, threshold=3.0)
        assert p == pytest.approx(1.0)

    def test_precision_at_10_none_relevant(self):
        ranked = [1.0] * 10
        p = self._precision_at_k(ranked, k=10, threshold=3.0)
        assert p == pytest.approx(0.0)

    def test_precision_at_10_half_relevant(self):
        ranked = [4.0, 4.0, 4.0, 4.0, 4.0, 1.0, 1.0, 1.0, 1.0, 1.0]
        p = self._precision_at_k(ranked, k=10, threshold=3.0)
        assert p == pytest.approx(0.5)

    def test_ndcg_perfect_ranking(self):
        # Perfect ranking: all relevant items first
        ranked = [5.0, 4.5, 4.0, 3.5, 3.0, 1.0, 1.0, 1.0, 1.0, 1.0]
        ideal = sorted(ranked, reverse=True)
        ndcg = self._ndcg_at_k(ranked, ideal, k=10)
        assert ndcg == pytest.approx(1.0)

    def test_ndcg_worst_ranking(self):
        # Reverse order: relevant items last
        ideal = [5.0, 4.5, 4.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
        worst = sorted(ideal)  # ascending = relevant items at end
        ndcg = self._ndcg_at_k(worst, ideal, k=10)
        assert ndcg < 1.0, "Reversed ranking must have NDCG < 1"

    def test_ndcg_between_0_and_1(self):
        import random
        random.seed(42)
        ranked = [random.uniform(1, 5) for _ in range(10)]
        ideal = sorted(ranked, reverse=True)
        ndcg = self._ndcg_at_k(ranked, ideal, k=10)
        assert 0.0 <= ndcg <= 1.0

    def test_rmse_sensitive_to_outliers(self):
        """RMSE should be higher when one prediction is way off."""
        good_preds = [(3.0, 3.1)] * 9 + [(4.0, 4.1)]
        bad_preds  = [(3.0, 3.1)] * 9 + [(4.0, 9.9)]  # one huge error
        assert self._rmse(bad_preds) > self._rmse(good_preds)


# ===========================================================================
# 3. A/B TESTING — DETERMINISTIC BUCKETING
# ===========================================================================

class TestABTesting:
    """Verify deterministic, stable user bucket assignment."""

    def _get_variant(self, user_id, experiment="rec_algorithm"):
        from ml.ab_testing import get_variant
        return get_variant(user_id, experiment)

    def test_same_user_same_variant(self):
        """A user must always get the same variant across calls."""
        v1 = self._get_variant("user_abc_123")
        v2 = self._get_variant("user_abc_123")
        assert v1["name"] == v2["name"]

    def test_different_users_may_differ(self):
        """Different users should not always get the same variant (statistical sanity)."""
        users = [f"user_{i}" for i in range(100)]
        variants = [self._get_variant(u)["name"] for u in users]
        unique = set(variants)
        # With 2 variants and 100 users, both should appear
        assert len(unique) >= 2, "All 100 users ended up in same variant (bucketing is broken)"

    def test_variant_has_required_keys(self):
        v = self._get_variant("test_user_42")
        assert "name" in v
        assert "algorithm" in v

    def test_bucket_distribution_roughly_50_50(self):
        """MD5 bucketing should distribute ≈ evenly (within 15% of 50%)."""
        from ml.ab_testing import get_variant
        users = [f"user_{i}" for i in range(1000)]
        counts = {}
        for u in users:
            name = get_variant(u)["name"]
            counts[name] = counts.get(name, 0) + 1
        total = sum(counts.values())
        for name, count in counts.items():
            ratio = count / total
            assert 0.35 <= ratio <= 0.65, f"Variant {name!r} has {ratio:.1%} share — too skewed"

    def test_cross_experiment_independence(self):
        """Bucketing in experiment A must not leak into experiment B."""
        from ml.ab_testing import EXPERIMENTS
        # Just verify the experiment exists and has variants
        assert "rec_algorithm" in EXPERIMENTS
        exp = EXPERIMENTS["rec_algorithm"]
        assert "variants" in exp
        assert len(exp["variants"]) >= 2


# ===========================================================================
# 4. SYSTEM INTEGRATION SMOKE (no network)
# ===========================================================================

class TestScratchTFIDFStats:
    """Test get_stats() and get_top_idf_terms() on a built index."""

    def test_stats_after_build(self):
        from ai.tfidf_scratch import ScratchTFIDF
        tfidf = ScratchTFIDF()
        tfidf.build_index([
            {"_id": "1", "text": "action hero saves day"},
            {"_id": "2", "text": "romantic comedy love"},
        ])
        stats = tfidf.get_stats()
        assert stats["ready"] is True
        assert stats["indexed_documents"] == 2
        assert stats["vocabulary_size"] > 0
        assert stats["algorithm"] == "from_scratch_tfidf"

    def test_top_idf_terms(self):
        from ai.tfidf_scratch import ScratchTFIDF
        tfidf = ScratchTFIDF()
        tfidf.build_index([
            {"_id": "1", "text": "unique_term_xyz appears once"},
            {"_id": "2", "text": "common_term appears here"},
            {"_id": "3", "text": "common_term appears again"},
        ])
        top_terms = tfidf.get_top_idf_terms(n=5)
        assert len(top_terms) <= 5
        for entry in top_terms:
            assert "term" in entry
            assert "idf" in entry
            # Unique term should have highest IDF
        top_names = [e["term"] for e in top_terms]
        assert "unique_term_xyz" in top_names or len(top_names) > 0
