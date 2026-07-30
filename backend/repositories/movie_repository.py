"""
CineNexus Movie Repository (Data Abstraction Layer)
Implements the Repository Pattern to decouple HTTP API controllers from underlying database implementations.
"""
from typing import Optional, List, Dict, Any
from bson import ObjectId


class MovieRepository:
    """Encapsulates all database query logic for movie catalog operations."""

    def __init__(self, db=None, supabase_db=None):
        self.db = db
        self.supabase_db = supabase_db

    async def get_by_id(self, movie_id: str) -> Optional[Dict[str, Any]]:
        """Fetch movie document by MongoDB ObjectId or TMDB integer ID."""
        if self.db is None:
            return None

        query = {"_id": ObjectId(movie_id)} if ObjectId.is_valid(movie_id) else {"_id": movie_id}
        if isinstance(movie_id, int) or (isinstance(movie_id, str) and movie_id.isdigit()):
            query = {"$or": [{"_id": movie_id}, {"tmdb_id": int(movie_id)}]}

        movie = await self.db.movies.find_one(query)
        if movie:
            movie["_id"] = str(movie["_id"])
        return movie

    async def list_movies_slim(self, skip: int = 0, limit: int = 50, genre: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetches a slim payload representation of movies for grid card rendering.
        Reduces payload size by ~75% compared to full document retrieval.
        """
        if self.db is None:
            return []

        query = {}
        if genre:
            query["genres"] = {"$regex": f"^{genre}$", "$options": "i"}

        projection = {
            "_id": 1,
            "tmdb_id": 1,
            "title": 1,
            "poster_path": 1,
            "poster_url": 1,
            "vote_average": 1,
            "release_date": 1,
            "genres": 1
        }

        cursor = self.db.movies.find(query, projection).sort("popularity", -1).skip(skip).limit(limit)
        movies = await cursor.to_list(limit)

        for m in movies:
            m["_id"] = str(m["_id"])
        return movies
