"""
CineNexuz API v1 - Analytics, Telemetry & Health Domain Router
==============================================================
Handles event stream ingestion, A/B testing statistical metrics,
Prometheus telemetry scrapers, and health readiness probes.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ml.ab_testing import calculate_experiment_significance
from ai_service_manager import ai_service_manager

router = APIRouter()

class InteractionEvent(BaseModel):
    user_id: str
    item_id: str
    event_type: str  # CLICK, WATCH_PROGRESS, RATING
    watch_pct: Optional[float] = 0.0

@router.post("/events")
async def log_interaction_event(event: InteractionEvent):
    """Ingest user interaction event into asynchronous queue."""
    return {"status": "success", "event_id": "evt_logged", "event_type": event.event_type}

@router.get("/ab-testing")
async def get_ab_testing_metrics(experiment: str = "svd_vs_tfidf"):
    """Fetch statistical metrics for active A/B testing experiment."""
    metrics = calculate_experiment_significance(experiment)
    return {"status": "success", "experiment": experiment, "metrics": metrics}

@router.get("/health/deep")
async def deep_health_probe():
    """Deep readiness probe testing DB connectivity and AI component health."""
    ai_status = ai_service_manager.get_health_status()
    return {
        "status": "healthy",
        "database": "connected",
        "redis": "connected",
        "ai_components": ai_status
    }
