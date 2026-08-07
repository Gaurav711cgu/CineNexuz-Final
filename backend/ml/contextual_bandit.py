"""
CineNexus LinUCB Contextual Multi-Armed Bandit Engine
=====================================================
Implements disjoint LinUCB (Linear Upper Confidence Bound) exploration-exploitation algorithm.
Dynamically balances recommending high-confidence movies vs exploring new/trending titles to gauge user taste.

Math:
    a_t = argmax_a [ x_{t,a}^T theta_a + alpha * sqrt( x_{t,a}^T A_a^{-1} x_{t,a} ) ]
    where A_a = D_a^T D_a + I_d, b_a = D_a^T c_a, theta_a = A_a^{-1} b_a
"""

import logging
import numpy as np
from typing import Dict, List, Any, Tuple, Optional

logger = logging.getLogger("ml.contextual_bandit")


class LinUCBArm:
    """Represents a single candidate arm (movie category/cluster) in LinUCB."""

    def __init__(self, arm_id: str, context_dim: int = 10, alpha: float = 0.5):
        self.arm_id = arm_id
        self.context_dim = context_dim
        self.alpha = alpha

        # A_a matrix initialized as d x d identity matrix
        self.A = np.identity(context_dim, dtype=np.float64)
        # b_a vector initialized as d x 1 zero vector
        self.b = np.zeros(context_dim, dtype=np.float64)

    def compute_ucb_score(self, context_vector: np.ndarray) -> float:
        """Calculates LinUCB score = Estimated Reward + Exploration Confidence Bound."""
        x = np.asarray(context_vector, dtype=np.float64)
        if len(x) < self.context_dim:
            x = np.pad(x, (0, self.context_dim - len(x)))
        elif len(x) > self.context_dim:
            x = x[:self.context_dim]

        A_inv = np.linalg.inv(self.A)
        theta = np.dot(A_inv, self.b)

        # Expected reward prediction
        expected_reward = float(np.dot(theta, x))
        
        # Upper Confidence Bound variance width
        variance = float(np.dot(x, np.dot(A_inv, x)))
        exploration_bonus = self.alpha * np.sqrt(max(0.0, variance))

        return round(float(expected_reward + exploration_bonus), 4)

    def update_reward(self, context_vector: np.ndarray, reward: float):
        """Updates ridge regression matrix A and vector b based on user interaction reward (1.0 = click/watch, 0.0 = skip)."""
        x = np.asarray(context_vector, dtype=np.float64)
        if len(x) < self.context_dim:
            x = np.pad(x, (0, self.context_dim - len(x)))
        elif len(x) > self.context_dim:
            x = x[:self.context_dim]

        self.A += np.outer(x, x)
        self.b += reward * x


class ContextualBanditEngine:
    """Manages multi-armed bandit arms and selects optimal exploratory/exploitative recommendations."""

    def __init__(self, context_dim: int = 10, alpha: float = 0.5):
        self.context_dim = context_dim
        self.alpha = alpha
        self.arms: Dict[str, LinUCBArm] = {}

    def get_or_create_arm(self, arm_id: str) -> LinUCBArm:
        if arm_id not in self.arms:
            self.arms[arm_id] = LinUCBArm(arm_id, self.context_dim, self.alpha)
        return self.arms[arm_id]

    def select_best_arm(self, candidate_arm_ids: List[str], user_context: np.ndarray) -> Tuple[str, float]:
        """Selects arm maximizing LinUCB score given user context vector."""
        best_arm_id = candidate_arm_ids[0]
        best_score = -float("inf")

        for arm_id in candidate_arm_ids:
            arm = self.get_or_create_arm(arm_id)
            score = arm.compute_ucb_score(user_context)
            if score > best_score:
                best_score = score
                best_arm_id = arm_id

        return best_arm_id, best_score

    def record_feedback(self, arm_id: str, user_context: np.ndarray, reward: float):
        """Records online feedback event."""
        arm = self.get_or_create_arm(arm_id)
        arm.update_reward(user_context, reward)


contextual_bandit_engine = ContextualBanditEngine()
