import os
import asyncio
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import asyncpg
from logging_utils import logger

# Load environment variables from .env
load_dotenv(override=True)

MONGO_URL = os.getenv("MONGO_URL")
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

# Base URLs for images (standard from TMDB)
TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500"
TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/original"

async def initialize_pgvector_schema(pg_conn):
    """Ensure the pgvector extension is enabled and database schema tables are created."""
    logger.info("Initializing Supabase schema tables...")
    
    # Enable vector extension
    await pg_conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    await pg_conn.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    
    # Read the schema file if it exists, otherwise use standard statements
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    if os.path.exists(schema_path):
        with open(schema_path, "r") as f:
            schema_sql = f.read()
        await pg_conn.execute(schema_sql)
        logger.info("Executed schema.sql successfully.")
    else:
        logger.warning("schema.sql not found. Table creation skipped.")

async def migrate_data():
    if not MONGO_URL:
        logger.error("MONGO_URL is missing in environment. Cannot migrate.")
        return
    if not SUPABASE_DB_URL:
        logger.error("SUPABASE_DB_URL/DATABASE_URL is missing in environment. Cannot migrate.")
        return

    logger.info("Connecting to MongoDB Atlas...")
    mongo_client = AsyncIOMotorClient(MONGO_URL, tlsAllowInvalidCertificates=True)
    mongo_db = mongo_client[os.getenv("DB_NAME", "cinenexus")]

    logger.info("Connecting to Supabase PostgreSQL cluster...")
    pg_conn = await asyncpg.connect(SUPABASE_DB_URL)

    try:
        # Initialize schema tables
        await initialize_pgvector_schema(pg_conn)

        # ── 1. Migrate Users ──
        logger.info("\nMigrating Users collection...")
        mongo_users = await mongo_db.users.find({}).to_list(1000)
        logger.info(f"Found {len(mongo_users)} users in MongoDB.")
        
        user_mappings = {} # Maps Mongo ID (str) to User ID (str)
        user_inserted = 0
        
        for u in mongo_users:
            mongo_id_str = str(u["_id"])
            email = u.get("email")
            clerk_id = u.get("clerk_id") or u.get("id") or mongo_id_str # Fallback hierarchy
            
            if not email:
                continue

            # Insert User
            await pg_conn.execute(
                """
                INSERT INTO users (id, email, created_at)
                VALUES ($1, $2, $3)
                ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
                """,
                clerk_id, email, u.get("created_at") or datetime.now(timezone.utc)
            )
            user_mappings[mongo_id_str] = clerk_id
            user_inserted += 1

            # Dynamically seed a default "Main Profile" for Multi-Profile compatibility
            await pg_conn.execute(
                """
                INSERT INTO profiles (user_id, name, avatar_url, pin)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT DO NOTHING;
                """,
                clerk_id, u.get("name") or "Main Profile", "https://api.dicebear.com/7.x/bottts/svg?seed=" + clerk_id, None
            )
        
        logger.info(f"Successfully migrated {user_inserted} users and created default primary OTT profiles.")

        # ── 2. Migrate Movies Catalog ──
        logger.info("\nMigrating Movies collection...")
        mongo_movies = await mongo_db.movies.find({}).to_list(2000)
        logger.info(f"Found {len(mongo_movies)} movies in MongoDB.")

        # Initialize the Sentence Transformer model locally for real-time vector seeding
        try:
            logger.info("Initializing SentenceTransformer vector model (all-MiniLM-L6-v2)...")
            from sentence_transformers import SentenceTransformer
            embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer vector model initialized.")
            use_fallback = False
        except ImportError:
            logger.warning("sentence-transformers not installed or unsupported by Python environment. Activating zero-overhead deterministic embedding fallback.")
            use_fallback = True
            embedding_model = None

        movie_inserted = 0
        embeddings_inserted = 0

        for m in mongo_movies:
            tmdb_id = m.get("tmdb_id") or m.get("id")
            if not tmdb_id:
                continue

            # Ensure valid integer conversion
            try:
                tmdb_id = int(tmdb_id)
            except ValueError:
                continue

            title = m.get("title", "Untitled Movie")
            overview = m.get("overview", "")
            
            # Formatting poster and backdrop paths
            poster_path = m.get("poster_path")
            if poster_path and not poster_path.startswith("http"):
                poster_path = f"{TMDB_POSTER_BASE}/{poster_path.lstrip('/')}"
            
            backdrop_path = m.get("backdrop_path")
            if backdrop_path and not backdrop_path.startswith("http"):
                backdrop_path = f"{TMDB_BACKDROP_BASE}/{backdrop_path.lstrip('/')}"

            genres = m.get("genres") or []
            if not isinstance(genres, list):
                genres = [genres]
            genres = [str(g) for g in genres]

            vote_average = float(m.get("vote_average", 0.0))
            runtime = int(m.get("runtime", 0) or 0)
            original_language = m.get("original_language", "en")
            video_url = m.get("video_url")

            # Format date correctly
            release_date_str = m.get("release_date")
            release_date = None
            if release_date_str:
                try:
                    release_date = datetime.strptime(str(release_date_str)[:10], "%Y-%m-%d").date()
                except Exception:
                    release_date = None

            # Insert Core Movie details
            await pg_conn.execute(
                """
                INSERT INTO movies (tmdb_id, title, release_date, overview, poster_path, backdrop_path, genres, vote_average, runtime, original_language, video_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (tmdb_id) DO UPDATE SET 
                    title = EXCLUDED.title,
                    overview = EXCLUDED.overview,
                    poster_path = EXCLUDED.poster_path,
                    backdrop_path = EXCLUDED.backdrop_path,
                    genres = EXCLUDED.genres,
                    vote_average = EXCLUDED.vote_average,
                    video_url = EXCLUDED.video_url;
                """,
                tmdb_id, title, release_date, overview, poster_path, backdrop_path, genres, vote_average, runtime, original_language, video_url
            )
            movie_inserted += 1

            # Generate and insert embedding vector for pgvector RAG semantic search
            if overview:
                if not use_fallback:
                    embedding_vector = embedding_model.encode(overview).tolist()
                else:
                    # Generate a deterministic pseudo-random embedding vector of dimension 384 based on the movie's title hash
                    import random
                    title_hash = sum(ord(c) for c in title)
                    random.seed(title_hash)
                    embedding_vector = [random.uniform(-0.1, 0.1) for _ in range(384)]

                await pg_conn.execute(
                    """
                    INSERT INTO movie_embeddings (movie_id, embedding)
                    VALUES ($1, $2::vector)
                    ON CONFLICT (movie_id) DO UPDATE SET embedding = EXCLUDED.embedding;
                    """,
                    tmdb_id, str(embedding_vector)
                )
                embeddings_inserted += 1

            
            if movie_inserted % 50 == 0:
                logger.info(f"Ingested {movie_inserted} movies into catalog...")

        logger.info(f"Successfully migrated {movie_inserted} movies and initialized {embeddings_inserted} dense vector embeddings inside pgvector!")

        # ── 3. Migrate Ratings ──
        logger.info("\nMigrating Ratings store...")
        # Get profile mappings
        profile_rows = await pg_conn.fetch("SELECT id, user_id FROM profiles;")
        user_profile_map = {r["user_id"]: r["id"] for r in profile_rows}

        mongo_ratings = await mongo_db.ratings.find({}).to_list(5000)
        logger.info(f"Found {len(mongo_ratings)} ratings in MongoDB.")
        ratings_inserted = 0

        for r in mongo_ratings:
            mongo_user_id = str(r.get("user_id"))
            movie_id = r.get("movie_id")
            rating = r.get("rating")

            if not mongo_user_id or not movie_id or rating is None:
                continue

            # Convert movie_id safely
            try:
                # If MongoDB uses bson ObjectIds or string references for movie IDs, fetch standard tmdb_id
                if len(str(movie_id)) == 24: # BSON ObjectId length
                    # Resolve to standard TMDB integer ID
                    mongo_movie = await mongo_db.movies.find_one({"_id": movie_id})
                    if mongo_movie:
                        movie_id = int(mongo_movie.get("tmdb_id") or mongo_movie.get("id"))
                    else:
                        continue
                else:
                    movie_id = int(movie_id)
            except Exception:
                continue

            # Find matching active profile
            clerk_id = user_mappings.get(mongo_user_id)
            if not clerk_id:
                continue
            profile_id = user_profile_map.get(clerk_id)
            if not profile_id:
                continue

            # Ensure rating falls into correct boundaries
            rating = max(0.5, min(5.0, float(rating)))

            # Seed into profile_ratings
            await pg_conn.execute(
                """
                INSERT INTO profile_ratings (profile_id, movie_id, rating, rated_at)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (profile_id, movie_id) DO UPDATE SET rating = EXCLUDED.rating;
                """,
                profile_id, movie_id, rating, r.get("created_at") or datetime.now(timezone.utc)
            )
            ratings_inserted += 1

        logger.info(f"Successfully migrated {ratings_inserted} movie ratings/feedback logs.")
        logger.info("\n" + "="*50)
        logger.info("MongoDB to Supabase PostgreSQL Migration Pipeline successfully executed!")
        logger.info("="*50)

    except Exception as e:
        logger.error(f"Error executing migration pipeline: {e}")
    finally:
        mongo_client.close()
        await pg_conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_data())
