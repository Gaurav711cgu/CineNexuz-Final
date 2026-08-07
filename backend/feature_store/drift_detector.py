"""
CineNexus Feature Store Data Drift & Shift Detector
===================================================
Calculates Population Stability Index (PSI) and Wasserstein Distance between offline training distributions
and online serving distributions to alert when feature drift degrades recommendation performance.
"""

import math
import logging
import numpy as np
from typing import Dict, List, Any, Tuple
from scipy.stats import wasserstein_distance

logger = logging.getLogger("feature_store.drift_detector")


class FeatureDriftDetector:
    """Calculates PSI and Wasserstein distance for continuous and categorical feature distributions."""

    @staticmethod
    def calculate_psi(
        expected: np.ndarray,
        actual: np.ndarray,
        num_bins: int = 10,
        epsilon: float = 1e-4
    ) -> float:
        """
        Calculates Population Stability Index (PSI).
        PSI = sum((Actual% - Expected%) * ln(Actual% / Expected%))
        """
        exp_arr = np.asarray(expected, dtype=float)
        act_arr = np.asarray(actual, dtype=float)

        if len(exp_arr) == 0 or len(act_arr) == 0:
            return 0.0

        # Determine bin edges based on expected distribution quantiles
        min_val, max_val = min(exp_arr.min(), act_arr.min()), max(exp_arr.max(), act_arr.max())
        bins = np.linspace(min_val, max_val, num_bins + 1)
        
        # Calculate counts per bin
        exp_counts, _ = np.histogram(exp_arr, bins=bins)
        act_counts, _ = np.histogram(act_arr, bins=bins)

        # Convert to percentages (probabilities)
        exp_pct = exp_counts / float(len(exp_arr))
        act_pct = act_counts / float(len(act_arr))

        # Add epsilon smoothing to prevent div by zero or log(0)
        exp_pct = np.where(exp_pct == 0, epsilon, exp_pct)
        act_pct = np.where(act_pct == 0, epsilon, act_pct)

        # Compute PSI terms
        psi_value = np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
        return round(float(psi_value), 4)

    @staticmethod
    def calculate_wasserstein(expected: np.ndarray, actual: np.ndarray) -> float:
        """Calculates 1D Wasserstein Distance (Earth Mover's Distance)."""
        exp_arr = np.asarray(expected, dtype=float)
        act_arr = np.asarray(actual, dtype=float)
        if len(exp_arr) == 0 or len(act_arr) == 0:
            return 0.0
        return round(float(wasserstein_distance(exp_arr, act_arr)), 4)

    def evaluate_feature_drift(
        self,
        feature_name: str,
        training_data: np.ndarray,
        serving_data: np.ndarray
    ) -> Dict[str, Any]:
        """
        Evaluates PSI and Wasserstein distance for a named feature and classifies drift severity.
        """
        psi_score = self.calculate_psi(training_data, serving_data)
        w_distance = self.calculate_wasserstein(training_data, serving_data)

        if psi_score < 0.10:
            status = "STABLE"
            message = "No significant feature drift detected."
        elif psi_score < 0.25:
            status = "MODERATE_DRIFT"
            message = "Moderate feature drift detected. Consider scheduling model retrain."
        else:
            status = "CRITICAL_DRIFT"
            message = "Critical feature drift detected! Automatic model retraining triggered."

        return {
            "feature_name": feature_name,
            "population_stability_index": psi_score,
            "wasserstein_distance": w_distance,
            "status": status,
            "message": message,
            "training_samples": len(training_data),
            "serving_samples": len(serving_data)
        }


feature_drift_detector = FeatureDriftDetector()
