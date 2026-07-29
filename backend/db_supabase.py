import os
import asyncpg
from logging_utils import logger

# Retrieve the Supabase PostgreSQL connection string from environment
# Format: postgresql://postgres.[username]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
DATABASE_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

class SupabaseDBManager:
    def __init__(self):
        self.pool = None

    async def connect(self):
        """Initialize the connection pool to the Supabase Postgres cluster."""
        if self.pool:
            return
        
        if not DATABASE_URL:
            logger.warning("SUPABASE_DB_URL environment variable is missing. Supabase connector is inactive.")
            return

        try:
            logger.info("Initializing connection pool to Supabase PostgreSQL...")
            # We use a connection pool to maximize concurrency throughput for API and watchlogs
            self.pool = await asyncpg.create_pool(
                dsn=DATABASE_URL,
                min_size=2,
                max_size=10,
                timeout=30.0
            )
            logger.info("Successfully established connection pool to Supabase cluster.")
        except Exception as e:
            logger.error(f"Failed to connect to Supabase PostgreSQL: {e}")
            raise e

    async def disconnect(self):
        """Close the database connection pool gracefully."""
        if self.pool:
            logger.info("Closing Supabase connection pool...")
            await self.pool.close()
            self.pool = None
            logger.info("Supabase connection pool closed.")

    async def execute(self, query: str, *args):
        """Execute a write/update command and return standard status."""
        if not self.pool:
            await self.connect()
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)

    async def fetch(self, query: str, *args):
        """Fetch multiple records from PostgreSQL."""
        if not self.pool:
            await self.connect()
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def fetchrow(self, query: str, *args):
        """Fetch a single record from PostgreSQL."""
        if not self.pool:
            await self.connect()
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)

    # ── pgvector Dense Embedding Semantic Search RAG ──
    async def semantic_search(self, query_vector: list, limit: int = 8, min_similarity: float = 0.60):
        """
        Execute dense vector search against movie_embeddings table using pgvector's cosine distance (<=>).
        Optimized by an active HNSW index at the SQL layer.
        """
        if not self.pool:
            await self.connect()

        # Cosine similarity = 1 - cosine distance (<=>)
        sql_query = """
            SELECT m.*, 1 - (e.embedding <=> $1::vector) AS similarity
            FROM movies m
            JOIN movie_embeddings e ON m.tmdb_id = e.movie_id
            WHERE 1 - (e.embedding <=> $1::vector) >= $2
            ORDER BY similarity DESC
            LIMIT $3;
        """
        try:
            records = await self.fetch(sql_query, query_vector, min_similarity, limit)
            return [dict(r) for r in records]
        except Exception as e:
            logger.error(f"Failed executing semantic vector search: {e}")
            return []

    # ── ratings Matrix pull for collaborative SVD worker retraining ──
    async def get_ratings_matrix(self):
        """Fetch all rating profiles/movies log matrices for SVD machine learning pipeline."""
        sql_query = """
            SELECT profile_id::text, movie_id, rating 
            FROM profile_ratings;
        """
        try:
            records = await self.fetch(sql_query)
            return [dict(r) for r in records]
        except Exception as e:
            logger.error(f"Failed fetching SVD ML rating records: {e}")
            return []

# Singleton instance of the Supabase Database manager
supabase_db = SupabaseDBManager()
