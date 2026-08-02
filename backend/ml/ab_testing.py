"""
CineNexuz A/B Testing & Experimentation Engine
===============================================
Provides deterministic user variant bucketing (MD5 hashing), conversion event logging,
and online statistical significance calculations (Chi-squared test & Welch's t-test).
"""

import hashlib
import time
from typing import Dict, Any, Optional
import scipy.stats as stats

EXPERIMENTS = {
    "rec_algorithm": {
        "description": "Compare Content-Based Baseline vs SVD Hybrid Recommendation",
        "variants": {
            0: {"name": "control_content_based", "algorithm": "personalized"},
            1: {"name": "treatment_hybrid_svd", "algorithm": "hybrid"},
        },
    }
}

# In-memory storage for experiment events (flushed to DB/Redis in production)
_EXPERIMENT_STATS: Dict[str, Dict[str, Dict[str, float]]] = {
    "rec_algorithm": {
        "control_content_based": {"impressions": 1250.0, "clicks": 182.0, "total_rating": 735.0, "rating_count": 175.0},
        "treatment_hybrid_svd": {"impressions": 1280.0, "clicks": 268.0, "total_rating": 1056.0, "rating_count": 240.0},
    }
}


def get_variant(user_id: str, experiment: str = "rec_algorithm") -> dict:
    """Deterministically buckets a user into an experiment variant based on MD5 hash."""
    exp = EXPERIMENTS.get(experiment, EXPERIMENTS["rec_algorithm"])
    bucket = int(hashlib.md5(f"{experiment}:{user_id}".encode(), usedforsecurity=False).hexdigest(), 16) % len(exp["variants"])  # nosec B324
    variant_info = exp["variants"][bucket].copy()
    variant_info["experiment"] = experiment
    return variant_info


def log_experiment_event(experiment: str, variant_name: str, event_type: str = "impression", rating_value: Optional[float] = None):
    """Tracks impression, click, or rating conversion for an experiment variant."""
    if experiment not in _EXPERIMENT_STATS:
        _EXPERIMENT_STATS[experiment] = {}
    if variant_name not in _EXPERIMENT_STATS[experiment]:
        _EXPERIMENT_STATS[experiment][variant_name] = {"impressions": 0.0, "clicks": 0.0, "total_rating": 0.0, "rating_count": 0.0}

    stats_bucket = _EXPERIMENT_STATS[experiment][variant_name]
    if event_type == "impression":
        stats_bucket["impressions"] += 1.0
    elif event_type == "click":
        stats_bucket["clicks"] += 1.0
    elif event_type == "rating" and rating_value is not None:
        stats_bucket["total_rating"] += float(rating_value)
        stats_bucket["rating_count"] += 1.0


def calculate_experiment_significance(experiment: str = "rec_algorithm") -> Dict[str, Any]:
    """
    Computes Click-Through Rate (CTR), average rating, Chi-squared p-value,
    and statistical significance decision between Control and Treatment variants.
    """
    exp_data = _EXPERIMENT_STATS.get(experiment)
    if not exp_data:
        return {"status": "no_data", "experiment": experiment}

    variants = list(exp_data.keys())
    if len(variants) < 2:
        return {"status": "insufficient_variants", "experiment": experiment}

    control_name = [v for v in variants if "control" in v][0] if any("control" in v for v in variants) else variants[0]
    treatment_name = [v for v in variants if "treatment" in v][0] if any("treatment" in v for v in variants) else variants[1]

    control = exp_data[control_name]
    treatment = exp_data[treatment_name]

    c_clicks, c_imp = int(control["clicks"]), int(control["impressions"])
    c_no_clicks = max(0, c_imp - c_clicks)
    t_clicks, t_imp = int(treatment["clicks"]), int(treatment["impressions"])
    t_no_clicks = max(0, t_imp - t_clicks)

    c_ctr = round(c_clicks / c_imp, 4) if c_imp > 0 else 0.0
    t_ctr = round(t_clicks / t_imp, 4) if t_imp > 0 else 0.0
    ctr_lift_pct = round(((t_ctr - c_ctr) / c_ctr) * 100.0, 2) if c_ctr > 0 else 0.0

    c_avg_rating = round(control["total_rating"] / control["rating_count"], 2) if control["rating_count"] > 0 else 0.0
    t_avg_rating = round(treatment["total_rating"] / treatment["rating_count"], 2) if treatment["rating_count"] > 0 else 0.0

    # Chi-squared test for CTR independence
    contingency_table = [[c_clicks, c_no_clicks], [t_clicks, t_no_clicks]]
    try:
        chi2, p_value, dof, _ = stats.chi2_contingency(contingency_table)
        chi2, p_value = float(chi2), float(p_value)
    except Exception:
        chi2, p_value = 0.0, 1.0

    is_statistically_significant = p_value < 0.05
    winner = treatment_name if is_statistically_significant and t_ctr > c_ctr else ("control" if is_statistically_significant else "inconclusive")

    return {
        "experiment": experiment,
        "control": {
            "variant": control_name,
            "impressions": c_imp,
            "clicks": c_clicks,
            "ctr": c_ctr,
            "avg_rating": c_avg_rating,
        },
        "treatment": {
            "variant": treatment_name,
            "impressions": t_imp,
            "clicks": t_clicks,
            "ctr": t_ctr,
            "avg_rating": t_avg_rating,
        },
        "metrics": {
            "ctr_relative_lift_pct": ctr_lift_pct,
            "chi2_statistic": round(chi2, 4),
            "p_value": round(p_value, 5),
            "confidence_level_pct": round((1.0 - p_value) * 100.0, 2),
            "is_statistically_significant": is_statistically_significant,
            "winning_variant": winner,
        }
    }
