"""
Migration script to fix movie schema mismatches from bulk TMDB ingestion.

Issues fixed:
1. poster_path → poster_url (with TMDB base URL prepended)
2. backdrop_path → backdrop_url (with TMDB base URL prepended)
3. original_language → language (if language is missing)
4. Ensure all movies have canonical fields for UI compatibility
"""

import asyncio
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from logging_utils import log_event

# Load environment variables
load_dotenv()

TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500"
TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/original"

async def migrate_movies():
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        log_event(logging.ERROR, "MONGO_URL not found in environment", "migrate_movie_fields")
        return
    
    client = AsyncIOMotorClient(mongo_url, tlsAllowInvalidCertificates=True)
    db = client['cinenexus']
    
    print("Starting migration of movie fields...")
    
    # Count total movies
    total_movies = await db.movies.count_documents({})
    print(f"Total movies in database: {total_movies}")
    
    # Initialize counters
    updated_count = 0
    poster_fixed = 0
    backdrop_fixed = 0
    language_fixed = 0
    
    # Process all movies in batches
    batch_size = 100
    cursor = db.movies.find({})
    
    async for movie in cursor:
        updates = {}
        
        # Fix poster_url
        if not movie.get('poster_url') and movie.get('poster_path'):
            poster_path = movie['poster_path']
            if poster_path and not poster_path.startswith('http'):
                # Ensure path starts with /
                if not poster_path.startswith('/'):
                    poster_path = '/' + poster_path
                updates['poster_url'] = f"{TMDB_POSTER_BASE}{poster_path}"
                poster_fixed += 1
        
        # Fix backdrop_url
        if not movie.get('backdrop_url') and movie.get('backdrop_path'):
            backdrop_path = movie['backdrop_path']
            if backdrop_path and not backdrop_path.startswith('http'):
                # Ensure path starts with /
                if not backdrop_path.startswith('/'):
                    backdrop_path = '/' + backdrop_path
                updates['backdrop_url'] = f"{TMDB_BACKDROP_BASE}{backdrop_path}"
                backdrop_fixed += 1
        
        # Fix language field
        if not movie.get('language') and movie.get('original_language'):
            updates['language'] = movie['original_language']
            language_fixed += 1
        
        # Apply updates if any
        if updates:
            await db.movies.update_one(
                {"_id": movie["_id"]},
                {"$set": updates}
            )
            updated_count += 1
            
            # Progress indicator
            if updated_count % 100 == 0:
                print(f"Processed {updated_count} movies...")
    
    print("\n" + "="*60)
    print("Migration completed!")
    print("="*60)
    print(f"Total movies: {total_movies}")
    print(f"Movies updated: {updated_count}")
    print(f"  - Poster URLs fixed: {poster_fixed}")
    print(f"  - Backdrop URLs fixed: {backdrop_fixed}")
    print(f"  - Language fields fixed: {language_fixed}")
    
    # Verify results
    print("\nVerifying results...")
    movies_with_poster_url = await db.movies.count_documents({'poster_url': {'$ne': None, '$exists': True}})
    movies_with_language = await db.movies.count_documents({'language': {'$ne': None, '$exists': True}})
    
    print(f"Movies with poster_url: {movies_with_poster_url}")
    print(f"Movies with language: {movies_with_language}")
    
    # Sample check
    print("\nSample movie after migration:")
    sample = await db.movies.find_one({'poster_url': {'$ne': None}}, {'title': 1, 'poster_url': 1, 'language': 1})
    if sample:
        print(f"  Title: {sample.get('title')}")
        print(f"  Poster URL: {sample.get('poster_url')}")
        print(f"  Language: {sample.get('language')}")
    
    client.close()
    print("\nMigration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_movies())
