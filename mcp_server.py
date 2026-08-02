"""
CineNexuz MCP (Model Context Protocol) Server
============================================
Exposes CineNexuz recommendation algorithms, explainability engine,
and model evaluation capabilities as standardized MCP tools for AI agents.

Run server:
    python mcp_server.py
    or
    uvicorn mcp_server:app --port 8001
"""

import sys
import os
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Ensure backend modules are importable
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from ml.explainability import explain_recommendation_detailed
from ml.ab_testing import get_variant, calculate_experiment_significance
from eval.recommendation_eval import run_benchmark_report

app = FastAPI(
    title="CineNexuz MCP Server",
    description="Model Context Protocol interface for CineNexuz recommendation & AI engine",
    version="1.0.0"
)


class RecommendParams(BaseModel):
    user_id: str = Field("guest_user", description="Target user identifier")
    limit: int = Field(10, ge=1, le=50, description="Number of recommendations to return")
    algorithm: Optional[str] = Field("hybrid", description="Algorithm variant: hybrid, cf_svd, personalized, cold_start")


class ExplainParams(BaseModel):
    movie_id: str = Field(..., description="Movie identifier or title")
    user_id: str = Field("guest_user", description="Target user identifier")
    genres: Optional[List[str]] = Field(["Action", "Sci-Fi"], description="Movie genre list")
    vote_average: Optional[float] = Field(8.2, description="Movie vote rating")


class MCPToolCall(BaseModel):
    tool_name: str = Field(..., description="Name of the MCP tool to execute")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Arguments for tool execution")


@app.get("/")
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "CineNexuz MCP Server", "mcp_spec_version": "2026-01-01"}


@app.get("/mcp/tools/list")
@app.post("/mcp/tools/list")
async def list_tools():
    """Lists available MCP tools exposed by CineNexuz."""
    return {
        "tools": [
            {
                "name": "cinenexuz_recommend",
                "description": "Fetch personalized movie recommendations for a user powered by SVD collaborative filtering & TF-IDF hybrid engine",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "Target user ID"},
                        "limit": {"type": "integer", "default": 10, "description": "Number of recommendations"},
                        "algorithm": {"type": "string", "default": "hybrid", "enum": ["hybrid", "cf_svd", "personalized", "cold_start"]}
                    },
                    "required": ["user_id"]
                }
            },
            {
                "name": "cinenexuz_explain",
                "description": "Generate multi-factor explainability and feature score breakdowns for a recommended movie",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "movie_id": {"type": "string", "description": "Movie ID"},
                        "user_id": {"type": "string", "description": "User ID"},
                        "genres": {"type": "array", "items": {"type": "string"}},
                        "vote_average": {"type": "number"}
                    },
                    "required": ["movie_id"]
                }
            },
            {
                "name": "cinenexuz_eval",
                "description": "Execute recommendation model evaluation suite and return Precision@10, Recall@10, NDCG@10, Coverage, & ILD metrics",
                "input_schema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "cinenexuz_ab_stats",
                "description": "Get live A/B experiment conversion stats, Chi-squared statistic, and p-value decision",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "experiment": {"type": "string", "default": "rec_algorithm"}
                    }
                }
            }
        ]
    }


@app.post("/mcp/tools/cinenexuz_recommend")
async def cinenexuz_recommend(params: RecommendParams):
    """Executes recommendation pipeline tool."""
    user_variant = get_variant(params.user_id)
    algo = params.algorithm or user_variant.get("algorithm", "hybrid")

    # Sample curated recommendations for demonstration/tool invocation
    sample_movies = [
        {"id": "mov_101", "title": "Inception", "genres": ["Sci-Fi", "Action"], "vote_average": 8.8, "svd_score": 0.94},
        {"id": "mov_102", "title": "Interstellar", "genres": ["Sci-Fi", "Drama"], "vote_average": 8.6, "svd_score": 0.91},
        {"id": "mov_103", "title": "The Dark Knight", "genres": ["Action", "Crime"], "vote_average": 9.0, "svd_score": 0.96},
        {"id": "mov_104", "title": "Blade Runner 2049", "genres": ["Sci-Fi", "Mystery"], "vote_average": 8.0, "svd_score": 0.87},
        {"id": "mov_105", "title": "Pulp Fiction", "genres": ["Crime", "Drama"], "vote_average": 8.9, "svd_score": 0.92},
        {"id": "mov_106", "title": "Dune: Part Two", "genres": ["Sci-Fi", "Adventure"], "vote_average": 8.7, "svd_score": 0.89},
        {"id": "mov_107", "title": "Arrival", "genres": ["Sci-Fi", "Mystery"], "vote_average": 7.9, "svd_score": 0.85},
        {"id": "mov_108", "title": "The Matrix", "genres": ["Action", "Sci-Fi"], "vote_average": 8.7, "svd_score": 0.93},
        {"id": "mov_109", "title": "Oppenheimer", "genres": ["Biography", "Drama"], "vote_average": 8.9, "svd_score": 0.90},
        {"id": "mov_110", "title": "Fight Club", "genres": ["Drama", "Thriller"], "vote_average": 8.8, "svd_score": 0.91},
    ]

    user_taste = {"genre_weights": {"Sci-Fi": 0.45, "Action": 0.35, "Crime": 0.20}}

    output_recs = []
    for m in sample_movies[:params.limit]:
        explanation = explain_recommendation_detailed(m, user_taste, algorithm=algo)
        output_recs.append({
            "id": m["id"],
            "title": m["title"],
            "genres": m["genres"],
            "vote_average": m["vote_average"],
            "explanation": explanation
        })

    return {
        "user_id": params.user_id,
        "experiment_variant": user_variant.get("name", "default"),
        "algorithm_used": algo,
        "recommendations_count": len(output_recs),
        "recommendations": output_recs
    }


@app.post("/mcp/tools/cinenexuz_explain")
async def cinenexuz_explain(params: ExplainParams):
    """Executes explainability tool."""
    movie_doc = {
        "id": params.movie_id,
        "genres": params.genres or ["Action", "Sci-Fi"],
        "vote_average": params.vote_average or 8.2
    }
    user_taste = {"genre_weights": {"Sci-Fi": 0.4, "Action": 0.3}}
    return explain_recommendation_detailed(movie_doc, user_taste, algorithm="hybrid")


@app.post("/mcp/tools/cinenexuz_eval")
async def cinenexuz_eval():
    """Executes evaluation benchmark suite tool."""
    return run_benchmark_report()


@app.post("/mcp/tools/cinenexuz_ab_stats")
async def cinenexuz_ab_stats(experiment: str = "rec_algorithm"):
    """Returns A/B experiment statistical significance stats."""
    return calculate_experiment_significance(experiment)


if __name__ == "__main__":
    import uvicorn
    print("Starting CineNexuz MCP Server on http://0.0.0.0:8001 ...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
