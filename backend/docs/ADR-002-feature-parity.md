# ADR-002: Feature Store Online/Offline Parity

## Status
Accepted

## Context
Training-serving skew degrades model evaluation silently when offline training feature calculations differ from online serving feature transformations.

## Decision
Consolidate all feature computation logic into a single module (`backend/feature_store/definitions.py`). Both batch training pipelines and online serving endpoints import the exact same calculation functions (`compute_genre_affinity`, `compute_avg_watch_pct`, `compute_user_taste_vector`).

## Consequences
- Guaranteed mathematical equivalence between training data features and online inference features.
- Eliminates silent accuracy degradation in production rollouts.
