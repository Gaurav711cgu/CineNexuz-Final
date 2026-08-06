"""
CineNexus Maximal Marginal Relevance (MMR) Recommendation Reranker
===================================================================
Prevents filter bubbles by balancing relevance vs diversity using MMR math:
    MMR(d) = argmax [ lambda * Sim_1(d, User_Query) - (1 - lambda) * max_{s in S} Sim_2(d, s) ]
"""

from typing import List, Dict, Any, Set
import numpy as np


def jaccard_genre_similarity(genres1: List[str], genres2: List[str]) -> float:
    """Computes Jaccard similarity between two genre lists."""
    set1, set2 = set(genres1), set(genres2)
    union = set1.union(set2)
    if not union:
        return 0.0
    return len(set1.intersection(set2)) / len(union)


def mmr_rerank(
    candidates: List[Dict[str, Any]],
    top_k: int = 10,
    lambda_param: float = 0.7,
    relevance_key: str = "svd_score"
) -> List[Dict[str, Any]]:
    """
    Applies Maximal Marginal Relevance (MMR) re-ranking over candidate movies.
    
    Args:
        candidates: List of candidate movie dicts with scores and genres.
        top_k: Number of diverse items to select.
        lambda_param: Weighting factor between relevance (1.0) and diversity (0.0). Default 0.7.
        relevance_key: Dict key for candidate relevance score (e.g., 'svd_score', 'taste_score', 'score').
    
    Returns:
        List of top_k diverse, high-relevance movie dicts with 'mmr_score' attached.
    """
    if not candidates:
        return []

    # Normalize candidate relevance scores into [0, 1] range
    scores = [float(c.get(relevance_key, 0.5) or 0.5) for c in candidates]
    min_score, max_score = min(scores), max(scores)
    range_score = (max_score - min_score) if max_score > min_score else 1.0

    normalized_candidates = []
    for c, score in zip(candidates, scores):
        c_copy = dict(c)
        c_copy["norm_relevance"] = (score - min_score) / range_score
        normalized_candidates.append(c_copy)

    unselected = list(normalized_candidates)
    selected: List[Dict[str, Any]] = []

    # Iterative MMR selection
    while unselected and len(selected) < top_k:
        best_mmr_score = -float("inf")
        best_candidate_idx = -1

        for idx, candidate in enumerate(unselected):
            rel_score = candidate["norm_relevance"]

            # Calculate maximum similarity to any item already in selected set S
            if not selected:
                max_sim = 0.0
            else:
                sims = [
                    jaccard_genre_similarity(candidate.get("genres", []), s.get("genres", []))
                    for s in selected
                ]
                max_sim = max(sims) if sims else 0.0

            # Compute MMR score
            mmr_val = (lambda_param * rel_score) - ((1.0 - lambda_param) * max_sim)

            if mmr_val > best_mmr_score:
                best_mmr_score = mmr_val
                best_candidate_idx = idx

        if best_candidate_idx >= 0:
            chosen = unselected.pop(best_candidate_idx)
            chosen["mmr_score"] = round(float(best_mmr_score), 4)
            selected.append(chosen)

    return selected
