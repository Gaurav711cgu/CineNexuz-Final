import logging
import httpx
from datetime import datetime, timezone
import os

TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")
TMDB_BASE = "https://api.themoviedb.org/3"

logger = logging.getLogger("cinenexus.collections")

async def fetch_collection_from_tmdb(collection_id: int):
    """Fetch complete collection metadata and parts from TMDB API"""
    if not TMDB_API_KEY:
        logger.warning("TMDB API key not configured, cannot fetch collection details")
        return None

    url = f"{TMDB_BASE}/collection/{collection_id}"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params={"api_key": TMDB_API_KEY, "language": "en-US"}, timeout=10)
            if resp.status_code == 200:
                return resp.json()
            else:
                logger.error(f"Failed to fetch TMDB collection {collection_id}: {resp.status_code}")
                return None
    except Exception as e:
        logger.error(f"Error fetching collection {collection_id} from TMDB: {e}")
        return None

async def upsert_collection(collection_data: dict, current_movie_tmdb_id: int, db):
    """
    Query TMDB for complete collection details, structure, sort parts chronologically,
    and save/update in db.collections. Link existing database movies to the collection.
    """
    if not collection_data or "id" not in collection_data:
        return None

    collection_id = int(collection_data["id"])
    logger.info(f"Processing collection {collection_id} ({collection_data.get('name')})")

    # Fetch fresh metadata from TMDB
    tmdb_details = await fetch_collection_from_tmdb(collection_id)
    if not tmdb_details:
        # Fall back to using belongs_to_collection fields from movie if TMDB fetch fails
        tmdb_details = {
            "id": collection_id,
            "name": collection_data.get("name", "Unknown Franchise"),
            "overview": collection_data.get("overview", "A collection of films."),
            "poster_path": collection_data.get("poster_path"),
            "backdrop_path": collection_data.get("backdrop_path"),
            "parts": [{"id": current_movie_tmdb_id, "title": "Current Movie"}]
        }

    parts = tmdb_details.get("parts", [])
    
    # Sort parts chronologically by release_date
    def get_release_date(p):
        rd = p.get("release_date", "")
        return rd if rd else "9999-12-31"

    parts_sorted = sorted(parts, key=get_release_date)

    parts_meta = []
    for idx, p in enumerate(parts_sorted):
        tmdb_part_id = int(p["id"])
        
        # Check if movie exists in db
        existing_movie = await db.movies.find_one({"tmdb_id": tmdb_part_id})
        
        in_db = False
        movie_id_str = None
        stream_status = "Paid"
        watch_url = None

        if existing_movie:
            in_db = True
            movie_id_str = str(existing_movie["_id"])
            if existing_movie.get("is_public_domain") or existing_movie.get("is_streamable"):
                stream_status = "Free"
            if existing_movie.get("video_url"):
                watch_url = existing_movie.get("video_url")

            # Update the movie document itself to link collection parameters
            await db.movies.update_one(
                {"_id": existing_movie["_id"]},
                {
                    "$set": {
                        "collection_id": collection_id,
                        "collection_name": tmdb_details.get("name", ""),
                        "collection_part": idx + 1
                    }
                }
            )

        parts_meta.append({
            "tmdb_id": tmdb_part_id,
            "title": p.get("title", "Unknown Part"),
            "release_date": p.get("release_date", ""),
            "poster_path": p.get("poster_path", ""),
            "backdrop_path": p.get("backdrop_path", ""),
            "vote_average": p.get("vote_average", 0.0),
            "overview": p.get("overview", ""),
            "in_db": in_db,
            "movie_id": movie_id_str,
            "stream_status": stream_status,
            "watch_url": watch_url,
            "part_number": idx + 1
        })

    # Save to db.collections
    collection_doc = {
        "tmdb_id": collection_id,
        "name": tmdb_details.get("name", "Unknown Franchise"),
        "overview": tmdb_details.get("overview", "A cinematic saga."),
        "poster_path": tmdb_details.get("poster_path", ""),
        "backdrop_path": tmdb_details.get("backdrop_path", ""),
        "parts": parts_meta,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    await db.collections.update_one(
        {"tmdb_id": collection_id},
        {"$set": collection_doc},
        upsert=True
    )
    logger.info(f"Upserted franchise collection: {collection_doc['name']} with {len(parts_meta)} parts")
    return collection_id
