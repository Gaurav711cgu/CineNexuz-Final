"""
Unit Tests for Advanced SQL Concepts (Materialized Views, Window Functions & Recursive CTEs)
"""
import pytest
from unittest.mock import MagicMock, AsyncMock
from db_advanced_sql import AdvancedSQLEngine


@pytest.mark.asyncio
async def test_materialized_view_concurrent_refresh():
    mock_db = MagicMock()
    mock_db.pool = MagicMock()
    mock_db.execute = AsyncMock()

    engine = AdvancedSQLEngine(mock_db)
    success = await engine.refresh_genre_materialized_view()

    assert success is True
    mock_db.execute.assert_called_once_with("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_genre_popularity_stats;")


@pytest.mark.asyncio
async def test_window_function_genre_ranking_query():
    mock_db = MagicMock()
    mock_db.pool = MagicMock()
    mock_db.fetch = AsyncMock(return_value=[
        {"tmdb_id": 550, "title": "Fight Club", "vote_average": 8.4, "genre": "Drama", "genre_rank": 1},
        {"tmdb_id": 278, "title": "Shawshank", "vote_average": 8.7, "genre": "Drama", "genre_rank": 2}
    ])

    engine = AdvancedSQLEngine(mock_db)
    res = await engine.get_top_movies_per_genre_window("Drama", limit=5)

    assert len(res) == 2
    assert res[0]["title"] == "Fight Club"
    assert res[0]["genre_rank"] == 1


@pytest.mark.asyncio
async def test_recursive_cte_franchise_tree():
    mock_db = MagicMock()
    mock_db.pool = MagicMock()
    mock_db.fetch = AsyncMock(return_value=[
        {"tmdb_id": 550, "title": "Fight Club", "depth": 1},
        {"tmdb_id": 551, "title": "Fight Club 2", "depth": 2}
    ])

    engine = AdvancedSQLEngine(mock_db)
    res = await engine.get_franchise_recursive_cte(550)

    assert len(res) == 2
    assert res[1]["depth"] == 2
