"""Metrics package initializer."""
from metrics.prometheus import (
    REQUEST_LATENCY,
    CACHE_HIT_COUNTER,
    CACHE_MISS_COUNTER,
    RECOMMENDATION_SCORE,
    ACTIVE_WATCH_SESSIONS,
    SEARCH_QUERIES_TOTAL,
    generate_latest,
    CONTENT_TYPE_LATEST
)
