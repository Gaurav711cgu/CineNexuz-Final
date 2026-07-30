"""Deterministic A/B testing helpers for recommendation experiments."""
import hashlib

EXPERIMENTS = {
    "rec_algorithm": {
        "description": "Compare recommendation algorithms",
        "variants": {
            0: {"name": "control_content_based", "algorithm": "personalized"},
            1: {"name": "treatment_hybrid_cf", "algorithm": "hybrid"},
        },
    }
}


def get_variant(user_id: str, experiment: str = "rec_algorithm") -> dict:
    exp = EXPERIMENTS.get(experiment)
    if not exp:
        exp = EXPERIMENTS["rec_algorithm"]
    bucket = int(hashlib.md5(f"{experiment}:{user_id}".encode(), usedforsecurity=False).hexdigest(), 16) % len(exp["variants"])  # nosec B324 — MD5 for deterministic A/B bucketing, not security
    return exp["variants"][bucket]
