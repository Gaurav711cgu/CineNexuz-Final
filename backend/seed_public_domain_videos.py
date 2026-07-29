"""Search, fetch and ingest public-domain video sources into matched catalog titles from TMDB."""
import asyncio
import os
from datetime import datetime, timezone
import httpx
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(override=True)

TMDB_API_KEY = os.environ.get("TMDB_API_KEY")
TMDB_BASE = "https://api.themoviedb.org/3"

PUBLIC_DOMAIN_FILMS = [
    {"title": "Nosferatu", "video_url": "https://archive.org/download/Nosferatu_201312/Nosferatu.ia.mp4", "duration": 6480},
    {"title": "Metropolis", "video_url": "https://archive.org/download/Metropolis_708/Metropolis.mp4", "duration": 9300},
    {"title": "The General", "video_url": "https://archive.org/download/TheGeneral_201302/TheGeneral.ia.mp4", "duration": 4680},
    {"title": "Night of the Living Dead", "video_url": "https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4", "duration": 5580},
    {"title": "His Girl Friday", "video_url": "https://archive.org/download/HisGirlFriday/HisGirlFriday.mp4", "duration": 5220},
    {"title": "The Gold Rush", "video_url": "https://archive.org/download/TheGoldRush_791/TheGoldRush.ia.mp4", "duration": 5520},
    {"title": "Sherlock Jr.", "video_url": "https://archive.org/download/SherlockJr.1924/Sherlock_Jr._1924.mp4", "duration": 2640},
    {"title": "The Kid", "video_url": "https://archive.org/download/TheKid1921CharlesChaplin/TheKid1921CharlesChaplin.mp4", "duration": 3420},
    {"title": "Safety Last", "video_url": "https://archive.org/download/safety_last_1923/safety_last_1923_512kb.mp4", "duration": 4080},
    {"title": "Steamboat Bill Jr.", "video_url": "https://archive.org/download/SteamboatBillJr_201302/SteamboatBillJr.ia.mp4", "duration": 4200},
]

async def seed():
    if not TMDB_API_KEY:
        print("Error: TMDB_API_KEY is not set.")
        return

    client = AsyncIOMotorClient(os.environ["MONGO_URL"], tlsAllowInvalidCertificates=True)
    db = client[os.environ.get("DB_NAME", "cinenexus")]

    async with httpx.AsyncClient() as http_client:
        for film in PUBLIC_DOMAIN_FILMS:
            print(f"\nSearching TMDB for '{film['title']}'...")
            try:
                # Search for film
                search_resp = await http_client.get(
                    f"{TMDB_BASE}/search/movie",
                    params={
                        "api_key": TMDB_API_KEY,
                        "query": film["title"],
                        "language": "en-US",
                        "include_adult": False,
                        "page": 1,
                    }
                )
                if search_resp.status_code != 200:
                    print(f"Search failed for {film['title']}: {search_resp.status_code}")
                    continue
                
                results = search_resp.json().get("results", [])
                if not results:
                    print(f"No results found on TMDB for {film['title']}")
                    continue
                
                # Fetch best match details + credits
                best_match = results[0]
                tmdb_id = best_match["id"]
                
                detail_resp = await http_client.get(
                    f"{TMDB_BASE}/movie/{tmdb_id}",
                    params={"api_key": TMDB_API_KEY, "append_to_response": "credits,videos"}
                )
                if detail_resp.status_code != 200:
                    print(f"Failed to fetch details for tmdb_id={tmdb_id}")
                    continue
                
                detail = detail_resp.json()
                genres = [g["name"] for g in detail.get("genres", [])]
                cast = detail.get("credits", {}).get("cast", [])[:10]
                cast_names = [a["name"] for a in cast]
                
                # Extract trailer
                trailer_key = None
                for v in detail.get("videos", {}).get("results", []):
                    if v.get("type") == "Trailer" and v.get("site") == "YouTube":
                        trailer_key = v["key"]
                        break
                
                # Collection/Franchise data
                belongs_to_collection = detail.get("belongs_to_collection")
                
                # Ingest actors
                for a in cast:
                    actor_doc = {
                        "tmdb_id": a["id"],
                        "name": a["name"],
                        "profile_path": a.get("profile_path", "") or "",
                    }
                    await db.actors.update_one(
                        {"tmdb_id": a["id"]},
                        {"$set": actor_doc},
                        upsert=True
                    )
                
                # Movie doc
                movie_doc = {
                    "tmdb_id": tmdb_id,
                    "title": detail.get("title", ""),
                    "overview": detail.get("overview", ""),
                    "poster_path": detail.get("poster_path", ""),
                    "backdrop_path": detail.get("backdrop_path", ""),
                    "genres": genres,
                    "genre_ids": [g["id"] for g in detail.get("genres", [])],
                    "release_date": detail.get("release_date", ""),
                    "runtime": detail.get("runtime", 0),
                    "vote_average": detail.get("vote_average", 0),
                    "vote_count": detail.get("vote_count", 0),
                    "popularity": detail.get("popularity", 0),
                    "original_language": detail.get("original_language", "en"),
                    "tagline": detail.get("tagline", ""),
                    "budget": detail.get("budget", 0),
                    "revenue": detail.get("revenue", 0),
                    "status": detail.get("status", ""),
                    "cast_names": cast_names,
                    "cast_ids": [a["id"] for a in cast],
                    "trailer_key": trailer_key,
                    "in_theatres": False,
                    "rent_price": 0.0,
                    "buy_price": 0.0,
                    "video_url": film["video_url"],
                    "has_video": True,
                    "is_public_domain": True,
                    "is_streamable": True,
                    "video_duration_seconds": film["duration"],
                    "belongs_to_collection": belongs_to_collection,
                    "created_at": datetime.now(timezone.utc),
                }
                
                # Upsert movie doc
                result = await db.movies.update_one(
                    {"tmdb_id": tmdb_id},
                    {"$set": movie_doc},
                    upsert=True
                )
                print(f"Seeded '{film['title']}' (TMDB ID: {tmdb_id}): matched={result.matched_count}, modified={result.modified_count}")
                
            except Exception as e:
                print(f"Error seeding {film['title']}: {e}")
                
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
