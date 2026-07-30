"""
CineNexus Dynamic Feature Flag Manager (Phase 3 Architecture)
Enables zero-downtime feature rollouts, dark launches, and instant kill-switches.
"""
import logging
from typing import Dict, Any

logger = logging.getLogger("resilience.feature_flags")


class FeatureFlagManager:
    """Centralized dynamic feature flag controller."""

    def __init__(self):
        self._flags: Dict[str, bool] = {
            "enable_pgvector_search": True,
            "enable_collaborative_filtering": True,
            "enable_langgraph_agent": True,
            "enable_slim_card_payloads": True,
            "enable_acid_transactions": True,
            "enable_rate_limiting": True,
        }

    def is_enabled(self, flag_name: str, default: bool = False) -> bool:
        """Returns the status of a feature flag."""
        return self._flags.get(flag_name, default)

    def set_flag(self, flag_name: str, value: bool):
        """Dynamically updates a feature flag status at runtime."""
        self._flags[flag_name] = value
        logger.info(f"Feature flag '{flag_name}' updated to {value}.")

    def get_all_flags(self) -> Dict[str, bool]:
        """Exposes current feature flag state."""
        return self._flags.copy()


# Global feature flag instance
feature_flags = FeatureFlagManager()
