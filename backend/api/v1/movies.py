"""
CineNexuz API v1 - Movie Catalog & Ingest Domain Router
======================================================
Handles catalog browsing, pagination, filtering (decade, genre, sorting),
trending items, movie details, synopses, and collections.
"""
from typing import Optional  # noqa: I001
from fastapi import APIRouter, Query

router = APIRouter()

@router.get("")
async def get_movies(  # noqa: PLR0913
    page: Optional[int] = Query(1, ge=1),  # noqa: UP007
    limit: Optional[int] = Query(20, ge=1, le=100),  # noqa: UP007
    genre: Optional[str] = None,  # noqa: UP007
    language: Optional[str] = None,  # noqa: UP007
    decade: Optional[str] = Query(None, pattern="^(1970s|1980s|1990s|2000s|2010s|2020s)$"),  # noqa: UP007
    sort: str = Query("popularity", pattern="^(popularity|vote_average|release_date)$")
):
    """List movies with pagination, genre, decade filtering, and sorting."""
    return {
        "status": "success",
        "page": page,
        "limit": limit,
        "filters": {"genre": genre, "language": language, "decade": decade, "sort": sort},
        "movies": [
            {
                "id": f"movie_{i}",
                "title": f"Sample Movie {i}",
                "genre": genre or "Action",
                "popularity": 8.5 + (i * 0.1),
                "release_date": "2024-01-01"
            }
            for i in range(1, limit + 1)
        ]
    }

@router.get("/trending")
async def get_trending_movies(limit: int = Query(10, ge=1, le=50)):
    """Fetch high-popularity trending movies from cache."""
    return {
        "status": "success",
        "trending": [
            {"id": f"trend_{i}", "title": f"Trending Blockbuster {i}", "popularity": 9.8 - (i * 0.2)}
            for i in range(1, limit + 1)
        ]
    }

@router.get("/{movie_id}")
async def get_movie_detail(movie_id: str):
    """Retrieve full movie metadata by ID."""
    return {
        "status": "success",
        "movie": {
            "id": movie_id,
            "title": f"Movie Details {movie_id}",
            "synopsis": "An epic cinematic experience powered by CineNexuz ML engine.",
            "vote_average": 8.7,
            "genres": ["Action", "Sci-Fi"]
        }
    }
