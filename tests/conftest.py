"""
Pytest configuration and global fixtures for CineNexuz test suite.
Provides clean isolation between tests by explicitly resetting singletons
instead of reloading modules.
"""
import pytest
import sys
import os

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

@pytest.fixture(autouse=True)
def reset_singletons():
    """Autouse fixture to reset stateful singletons between tests."""
    yield
    # Reset A/B testing experiment registry if imported
    if "ml.ab_testing" in sys.modules:
        ab_testing = sys.modules["ml.ab_testing"]
        if hasattr(ab_testing, "_experiments"):
            ab_testing._experiments.clear()
    
    # Reset scratch TFIDF instance if imported
    if "ai.tfidf_scratch" in sys.modules:
        tfidf = sys.modules["ai.tfidf_scratch"]
        if hasattr(tfidf, "scratch_tfidf"):
            tfidf.scratch_tfidf.documents = []
            tfidf.scratch_tfidf.vocab = {}
            tfidf.scratch_tfidf.is_built = False
