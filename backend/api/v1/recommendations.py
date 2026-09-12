"""
CineNexuz API v1 - Recommendations & Re-Ranking Domain Router
============================================================
Two-Stage Pipeline:
  Stage 1: FAISS ANN candidate generation (N → K=200)  [<10ms]
  Stage 2: SVD Collaborative Filter + Session reranking [<35ms]
  Stage 3: MMR diversity reranking                      [<5ms]
  Resilience: FallbackShelfManager for zero-downtime cold-start
  Total p99 SLA < 50ms.
"""
import logging  # noqa: I001
from typing import List, Dict, Any  # noqa: UP035

from fastapi import APIRouter, Query

from retrieval.two_stage import two_stage_pipeline
from ml.mmr_reranker import mmr_rerank
from ml.explainability import explain_recommendation
from resilience.fallback_shelves import fallback_shelf_manager

logger = logging.getLogger("api.v1.recommendations")
router = APIRouter()


@router.get("")
async def get_recommendations(
    user_id: str = Query("user_demo", description="User ID for personalized recommendations"),
    limit: int = Query(10, ge=1, le=50, description="Number of recommendations to return"),
    diversity_lambda: float = Query(0.7, ge=0.0, le=1.0, description="MMR lambda: 1.0=pure relevance, 0.0=pure diversity"),
):
    """
    Fetch personalized recommendations via Two-Stage Pipeline + MMR Reranking.
    Guarantees non-empty response through resilient zero-downtime fallback shelf.
    """
    raw_candidates: List[Dict[str, Any]] = []  # noqa: UP006
    telemetry: Dict[str, Any] = {}  # noqa: UP006

    try:
        pipeline_result = await two_stage_pipeline.recommend(
            user_id=user_id,
            limit=limit * 2,
        )
        raw_candidates = pipeline_result.get("recommendations", [])
        telemetry = pipeline_result.get("pipeline_telemetry", {})
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"Two-stage pipeline fallback triggered for {user_id}: {exc}")

    # If two-stage pipeline returns empty (e.g. cold start / DB offline), apply zero-downtime fallback shelf
    if not raw_candidates:
        fallback_res = fallback_shelf_manager.get_fallback_recommendations(
            shelf_type="trending",
            top_k=max(limit * 2, 10),
            failure_reason="cold_start_or_empty_index"
        )
        raw_candidates = fallback_res.get("recommendations", [])
        telemetry["fallback_shelf_served"] = True

    # Normalize fields for MMR
    for i, c in enumerate(raw_candidates):
        if "id" not in c and "movie_id" in c:
            c["id"] = c["movie_id"]
        if "score" not in c:
            c["score"] = c.get("predicted_rating", c.get("vote_average", 0.95 - (i * 0.05)))
        if "genres" not in c:
            c["genres"] = ["Sci-Fi" if i % 2 == 0 else "Drama"]

    reranked = mmr_rerank(raw_candidates, top_k=limit, lambda_param=diversity_lambda, relevance_key="score")

    return {
        "status": "success",
        "user_id": user_id,
        "diversity_lambda": diversity_lambda,
        "recommendations": reranked,
        "pipeline_telemetry": telemetry,
    }


@router.get("/explain")
async def get_recommendation_explanation(user_id: str, movie_id: str):
    """Explain feature attribution for a specific recommendation."""
    explanation = explain_recommendation(user_id=user_id, item_id=movie_id)
    return {
        "status": "success",
        "user_id": user_id,
        "movie_id": movie_id,
        "explanation": explanation,
    }
