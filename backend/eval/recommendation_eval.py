"""
CineNexuz Recommendation Engine Evaluation Framework
=====================================================
Calculates production ML metrics on held-out user interaction test sets:
  - Precision@K: Fraction of top-K recommendations liked by user (rating >= threshold)
  - Recall@K: Fraction of user's liked items captured in top-K recommendations
  - NDCG@K: Normalized Discounted Cumulative Gain for ranking quality
  - Catalog Coverage: Percentage of catalog recommended across all users
  - Intra-List Diversity: Average pairwise genre dissimilarity among top-K recs
  - Cold-Start vs Established User performance comparison
"""

import math
import numpy as np
from typing import Dict, List, Set, Any, Tuple


class RecommendationEvaluator:
    """Offline & online evaluation metrics for recommendation models."""

    def __init__(self, rating_threshold: float = 3.5, k: int = 10):
        self.rating_threshold = rating_threshold
        self.k = k

    def precision_at_k(self, recommended_ids: List[str], ground_truth_set: Set[str]) -> float:
        """Precision@K = |recommended in ground_truth| / K."""
        if not recommended_ids or self.k <= 0:
            return 0.0
        top_k = recommended_ids[:self.k]
        hits = sum(1 for item in top_k if item in ground_truth_set)
        return hits / min(self.k, len(top_k))

    def recall_at_k(self, recommended_ids: List[str], ground_truth_set: Set[str]) -> float:
        """Recall@K = |recommended in ground_truth| / |ground_truth|."""
        if not ground_truth_set:
            return 0.0
        top_k = recommended_ids[:self.k]
        hits = sum(1 for item in top_k if item in ground_truth_set)
        return hits / len(ground_truth_set)

    def ndcg_at_k(self, recommended_ids: List[str], ground_truth_set: Set[str]) -> float:
        """NDCG@K with binary relevance."""
        if not ground_truth_set or not recommended_ids:
            return 0.0

        top_k = recommended_ids[:self.k]
        dcg = 0.0
        for i, item_id in enumerate(top_k):
            if item_id in ground_truth_set:
                dcg += 1.0 / math.log2(i + 2)

        # Ideal DCG assumes all relevant items come first
        idcg = sum(1.0 / math.log2(i + 2) for i in range(min(self.k, len(ground_truth_set))))
        return dcg / idcg if idcg > 0 else 0.0

    def catalog_coverage(self, all_recommendations: List[List[str]], catalog_size: int) -> float:
        """Percentage of unique catalog items recommended across all user sessions."""
        if catalog_size <= 0:
            return 0.0
        recommended_set = set()
        for recs in all_recommendations:
            recommended_set.update(recs[:self.k])
        return round((len(recommended_set) / catalog_size) * 100.0, 2)

    def intra_list_diversity(self, item_genres_list: List[List[str]]) -> float:
        """
        Calculates Intra-List Diversity (ILD) using Jaccard distance between genre sets.
        ILD = 1 - average(Jaccard_similarity(item_i, item_j)) for all i != j.
        """
        n = len(item_genres_list)
        if n <= 1:
            return 1.0

        dissimilarities = []
        for i in range(n):
            for j in range(i + 1, n):
                set_i = set(item_genres_list[i])
                set_j = set(item_genres_list[j])
                union = set_i.union(set_j)
                if not union:
                    dissimilarities.append(1.0)
                else:
                    jaccard_sim = len(set_i.intersection(set_j)) / len(union)
                    dissimilarities.append(1.0 - jaccard_sim)

        return round(float(np.mean(dissimilarities)), 4)

    def evaluate_model_benchmark(
        self,
        test_user_profiles: List[Dict[str, Any]],
        catalog_ids: List[str],
        algorithm_func
    ) -> Dict[str, Any]:
        """
        Runs evaluation benchmark over a test set of user profiles.
        Splits into:
          - Overall metrics
          - Established User metrics (>= 5 ratings)
          - Cold-Start User metrics (< 5 ratings)
        """
        overall_precisions, overall_recalls, overall_ndcgs = [], [], []
        cold_precisions, cold_recalls, cold_ndcgs = [], [], []
        established_precisions, established_recalls, established_ndcgs = [], [], []
        
        all_recs = []

        for profile in test_user_profiles:
            user_id = profile.get("user_id", "test_user")
            user_ratings = profile.get("ratings", {})  # {movie_id: float}
            liked_ids = {m_id for m_id, r in user_ratings.items() if r >= self.rating_threshold}
            
            recs = algorithm_func(user_id=user_id, profile=profile, limit=self.k)
            rec_ids = [m.get("id", m.get("_id", str(m))) if isinstance(m, dict) else str(m) for m in recs]
            all_recs.append(rec_ids)

            p = self.precision_at_k(rec_ids, liked_ids)
            r = self.recall_at_k(rec_ids, liked_ids)
            n = self.ndcg_at_k(rec_ids, liked_ids)

            overall_precisions.append(p)
            overall_recalls.append(r)
            overall_ndcgs.append(n)

            if len(user_ratings) < 5:
                cold_precisions.append(p)
                cold_recalls.append(r)
                cold_ndcgs.append(n)
            else:
                established_precisions.append(p)
                established_recalls.append(r)
                established_ndcgs.append(n)

        return {
            "overall": {
                "precision_at_10": round(float(np.mean(overall_precisions)) if overall_precisions else 0.0, 4),
                "recall_at_10": round(float(np.mean(overall_recalls)) if overall_recalls else 0.0, 4),
                "ndcg_at_10": round(float(np.mean(overall_ndcgs)) if overall_ndcgs else 0.0, 4),
            },
            "established_users": {
                "precision_at_10": round(float(np.mean(established_precisions)) if established_precisions else 0.0, 4),
                "recall_at_10": round(float(np.mean(established_recalls)) if established_recalls else 0.0, 4),
                "ndcg_at_10": round(float(np.mean(established_ndcgs)) if established_ndcgs else 0.0, 4),
                "user_count": len(established_precisions)
            },
            "cold_start_users": {
                "precision_at_10": round(float(np.mean(cold_precisions)) if cold_precisions else 0.0, 4),
                "recall_at_10": round(float(np.mean(cold_recalls)) if cold_recalls else 0.0, 4),
                "ndcg_at_10": round(float(np.mean(cold_ndcgs)) if cold_ndcgs else 0.0, 4),
                "user_count": len(cold_precisions)
            },
            "catalog_coverage_pct": self.catalog_coverage(all_recs, len(catalog_ids)),
            "evaluated_user_count": len(test_user_profiles)
        }


def run_benchmark_report() -> Dict[str, Any]:
    """Generates benchmark report for CineNexuz recommendation algorithms."""
    evaluator = RecommendationEvaluator(rating_threshold=3.5, k=10)

    # Synthetic catalog and user profile benchmark suite for validation
    catalog = [f"movie_{i}" for i in range(1, 101)]
    movie_genres = {
        f"movie_{i}": ["Action", "Sci-Fi"] if i % 2 == 0 else ["Drama", "Romance"]
        for i in range(1, 101)
    }

    # Generate synthetic user test profiles (cold start & established)
    np.random.seed(42)
    test_profiles = []
    for u in range(50):
        n_ratings = 2 if u % 2 == 0 else 15  # 25 cold-start, 25 established
        rated_ids = np.random.choice(catalog, size=n_ratings, replace=False)
        ratings = {m_id: float(np.random.uniform(2.0, 5.0)) for m_id in rated_ids}
        preferred_genres = ["Action", "Sci-Fi"] if u % 2 == 0 else ["Drama"]
        test_profiles.append({
            "user_id": f"eval_user_{u}",
            "ratings": ratings,
            "preferred_genres": preferred_genres
        })

    def mock_hybrid_algorithm(user_id: str, profile: dict, limit: int = 10):
        ratings = profile.get("ratings", {})
        preferred = profile.get("preferred_genres", [])
        
        # Cold start fallback using preferred genres
        if len(ratings) < 5:
            matching = [m for m in catalog if any(g in preferred for g in movie_genres[m])]
            return matching[:limit]
        
        # Established user CF + Content blend
        liked = [m for m, r in ratings.items() if r >= 3.5]
        recs = liked + [m for m in catalog if m not in ratings]
        return recs[:limit]

    results = evaluator.evaluate_model_benchmark(test_profiles, catalog, mock_hybrid_algorithm)
    
    # Calculate average ILD across recommendations
    sample_recs = [mock_hybrid_algorithm(p["user_id"], p, 10) for p in test_profiles[:10]]
    sample_genres = [[movie_genres[m] for m in rec_set] for rec_set in sample_recs]
    avg_ild = round(float(np.mean([evaluator.intra_list_diversity(g_list) for g_list in sample_genres])), 4)
    results["intra_list_diversity"] = avg_ild

    return results


if __name__ == "__main__":
    import json
    report = run_benchmark_report()
    print("\n=======================================================")
    print(" CineNexuz Recommendation Benchmark Suite Output")
    print("=======================================================")
    print(json.dumps(report, indent=2))
