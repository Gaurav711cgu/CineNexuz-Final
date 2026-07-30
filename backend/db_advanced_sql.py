"""
CineNexus Advanced SQL Engine (FAANG Database Architecture)
Executes:
1. Materialized View Refresh (REFRESH MATERIALIZED VIEW CONCURRENTLY)
2. Window Functions (ROW_NUMBER() / RANK() per genre)
3. Recursive CTEs (Franchise Timeline Dependencies)
"""
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("db.advanced_sql")


class AdvancedSQLEngine:
    """Interface executing high-order SQL operations on PostgreSQL."""

    def __init__(self, db_manager=None):
        self.db_manager = db_manager

    async def refresh_genre_materialized_view(self) -> bool:
        """
        Executes a zero-downtime background refresh of pre-computed genre statistics
        using REFRESH MATERIALIZED VIEW CONCURRENTLY.
        """
        if not self.db_manager or not getattr(self.db_manager, "pool", None):
            logger.warning("Supabase Postgres pool not connected. Skipping Materialized View refresh.")
            return False

        sql = "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_genre_popularity_stats;"
        try:
            await self.db_manager.execute(sql)
            logger.info("Successfully refreshed Materialized View 'mv_genre_popularity_stats' concurrently.")
            return True
        except Exception as e:
            logger.error(f"Failed to refresh Materialized View: {e}")
            return False

    async def get_top_movies_per_genre_window(self, genre: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Uses SQL Window Functions (ROW_NUMBER() OVER PARTITION BY genre)
        to return top-ranked titles in a single query pass.
        """
        if not self.db_manager or not getattr(self.db_manager, "pool", None):
            return []

        sql = """
            SELECT tmdb_id, title, vote_average, original_language, genre, genre_rank
            FROM v_top_movies_per_genre
            WHERE genre ILIKE $1 AND genre_rank <= $2;
        """
        try:
            records = await self.db_manager.fetch(sql, genre, limit)
            return [dict(r) for r in records]
        except Exception as e:
            logger.error(f"Error fetching top movies via Window Function view: {e}")
            return []

    async def get_franchise_recursive_cte(self, root_movie_id: int) -> List[Dict[str, Any]]:
        """
        Executes a Recursive Common Table Expression (WITH RECURSIVE)
        to map out prequel/sequel collection timelines.
        """
        if not self.db_manager or not getattr(self.db_manager, "pool", None):
            return []

        sql = """
            WITH RECURSIVE franchise_tree AS (
                SELECT tmdb_id, title, release_date, 1 AS depth
                FROM movies WHERE tmdb_id = $1
                UNION ALL
                SELECT m.tmdb_id, m.title, m.release_date, ft.depth + 1
                FROM movies m
                JOIN franchise_tree ft ON m.release_date > ft.release_date
                WHERE ft.depth < 4 AND m.genres && (SELECT genres FROM movies WHERE tmdb_id = ft.tmdb_id)
            )
            SELECT * FROM franchise_tree ORDER BY depth ASC;
        """
        try:
            records = await self.db_manager.fetch(sql, root_movie_id)
            return [dict(r) for r in records]
        except Exception as e:
            logger.error(f"Error executing Recursive CTE: {e}")
            return []


# Instantiate singleton advanced SQL engine
advanced_sql_engine = None
try:
    from db_supabase import supabase_db
    advanced_sql_engine = AdvancedSQLEngine(supabase_db)
except Exception as e:
    logger.warning(f"Failed initializing AdvancedSQLEngine: {e}")
