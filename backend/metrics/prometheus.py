"""
CineNexus Prometheus Telemetry & Metrics Instrumentation Module (PART D2)
Exposes metrics for:
- Request latency histograms by endpoint/method/status
- Cache-Aside hits & misses counter by key prefix
- Recommendation score distributions
- Active streaming watch sessions
"""
from prometheus_client import Counter, Histogram, Gauge, Summary, generate_latest, CONTENT_TYPE_LATEST

# Request latency by endpoint & status
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint", "status_code"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5]
)

# Cache performance metrics
CACHE_HIT_COUNTER = Counter(
    "cache_hits_total",
    "Total Redis cache hits",
    ["key_prefix"]
)

CACHE_MISS_COUNTER = Counter(
    "cache_misses_total",
    "Total Redis cache misses",
    ["key_prefix"]
)

# ML model metrics
RECOMMENDATION_SCORE = Histogram(
    "recommendation_score_distribution",
    "Distribution of recommendation confidence scores",
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
)

# System activity gauges
ACTIVE_WATCH_SESSIONS = Gauge(
    "active_watch_sessions",
    "Current active streaming sessions"
)

SEARCH_QUERIES_TOTAL = Counter(
    "search_queries_total",
    "Total search queries executed",
    ["source"]
)
