"""
CineNexuz Feature Definitions — Single Source of Truth
Prevents training-serving skew by sharing exact feature computation logic
between offline batch training pipelines and online serving endpoints.
"""
from typing import Dict, List, Any
import numpy as np

FEATURE_DEFINITIONS = {
    "user:genre_affinity": {
        "description": "7-day rolling window user genre preference weights",
        "ttl_online": 3600,       # Redis TTL: 1 hour
        "ttl_offline": None,      # Permanent DB record
        "window": "7d",
    },
    "user:avg_watch_pct": {
        "description": "Average completion percentage across last 30 interactions",
        "ttl_online": 1800,      # Redis TTL: 30 mins
        "window": "30d",
    },
    "user:taste_vector": {
        "description": "Aggregated 384-d semantic embedding vector of user preferences",
        "ttl_online": 86400,     # Redis TTL: 24 hours
        "window": "90d",
    }
}
def compute_genre_affinity(watch_history: List[Dict[str, Any]]) -> Dict[str, float]:
    r"""
    Computes normalized genre affinity weights from user watch history.
    Formula: \sum (watch_progress_percentage * genre_presence) / total_weight
    """
    if not watch_history:
        return {}

    genre_counts: Dict[str, float] = {}
    total_weight = 0.0

    for item in watch_history:
        if not isinstance(item, dict):
            continue
        progress = float(item.get("progress", 100)) / 100.0
        genres = item.get("genres", [])
        if isinstance(genres, str):
            genres = [g.strip() for g in genres.split(",")]
        
        for g in genres:
            if not g:
                continue
            genre_counts[g] = genre_counts.get(g, 0.0) + progress
            total_weight += progress

    if total_weight == 0.0:
        return {}

    return {genre: round(score / total_weight, 4) for genre, score in genre_counts.items() if score > 0}


def compute_avg_watch_pct(watch_history: List[Dict[str, Any]]) -> float:
    """Computes average watch percentage across interactions."""
    if not watch_history:
        return 0.0
    percentages = []
    for item in watch_history:
        if isinstance(item, dict):
            p = item.get("progress")
            if p is not None:
                percentages.append(float(p))
    if not percentages:
        return 0.0
    return round(float(np.mean(percentages)), 2)

def compute_user_taste_vector(movie_embeddings: List[np.ndarray], weights: List[float]) -> np.ndarray:
    """Computes L2-normalized weighted average user embedding vector."""
    if not movie_embeddings or not weights or len(movie_embeddings) != len(weights):
        return np.zeros(384, dtype=np.float32)

    vecs = np.array(movie_embeddings, dtype=np.float32)
    w = np.array(weights, dtype=np.float32).reshape(-1, 1)
    
    weighted_sum = np.sum(vecs * w, axis=0)
    norm = np.linalg.norm(weighted_sum)
    if norm > 0:
        return (weighted_sum / norm).astype(np.float32)
    return weighted_sum.astype(np.float32)
