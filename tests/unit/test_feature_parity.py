"""
Unit tests for Feature Store single source of truth parity.
"""
import pytest
from feature_store.definitions import compute_genre_affinity, compute_avg_watch_pct


def test_genre_affinity_parity_calculation():
    sample_history = [
        {"movie_id": "m1", "progress": 100, "genres": ["Action", "Sci-Fi"]},
        {"movie_id": "m2", "progress": 50, "genres": ["Action"]},
        {"movie_id": "m3", "progress": 0, "genres": ["Comedy"]}
    ]

    affinity = compute_genre_affinity(sample_history)
    
    # Total Action weight: 1.0 + 0.5 = 1.5
    # Total Sci-Fi weight: 1.0
    # Total weight sum: 1.0 + 1.0 + 0.5 = 2.5
    # Action fraction: 1.5 / 2.5 = 0.6
    # Sci-Fi fraction: 1.0 / 2.5 = 0.4
    assert affinity["Action"] == 0.6
    assert affinity["Sci-Fi"] == 0.4
    assert "Comedy" not in affinity


def test_avg_watch_pct_calculation():
    sample_history = [
        {"movie_id": "m1", "progress": 80},
        {"movie_id": "m2", "progress": 40},
        {"movie_id": "m3", "progress": 60}
    ]

    avg_pct = compute_avg_watch_pct(sample_history)
    assert avg_pct == 60.0
