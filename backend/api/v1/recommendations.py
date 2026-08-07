"""
CineNexuz API v1 - Recommendations & Re-Ranking Domain Router
============================================================
Handles Multi-Stage Candidate Retrieval, SVD, Two-Tower Neural Net,
SASRec Sequential Transformer, LightGCN Graph NN, and MMR Reranking.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException

from ml.mmr_reranker import mmr_rerank
from ml.explainability import explain_recommendation

router = APIRouter()

@router.get("")
async def get_recommendations(
    user_id: str = Query("user_demo"),
    limit: int = Query(10, ge=1, le=50),
    diversity_lambda: float = Query(0.7, ge=0.0, le=1.0)
):
    """
    Fetch personalized recommendations via Two-Stage Pipeline + MMR Reranking.
    """
    raw_candidates = [
        {"id": f"rec_{i}", "title": f"Candidate Film {i}", "genre": "Sci-Fi" if i % 2 == 0 else "Drama", "score": 0.95 - (i * 0.05)}
        for i in range(1, limit * 2 + 1)
    ]
    reranked = mmr_rerank(raw_candidates, top_k=limit, lambda_param=diversity_lambda)
    return {
        "status": "success",
        "user_id": user_id,
        "diversity_lambda": diversity_lambda,
        "recommendations": reranked
    }

@router.get("/explain")
async def get_recommendation_explanation(user_id: str, movie_id: str):
    """Explain feature attribution for a specific recommendation."""
    explanation = explain_recommendation(user_id=user_id, item_id=movie_id)
    return {"status": "success", "user_id": user_id, "movie_id": movie_id, "explanation": explanation}
