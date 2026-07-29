import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def run():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"], tlsAllowInvalidCertificates=True)
    db = client[os.environ.get("DB_NAME", "cinenexus")]
    count = await db.movies.count_documents({})
    print(f"Total movies in database: {count}")
    
    # List first 10 movies
    print("\nFirst 10 movies:")
    async for movie in db.movies.find().limit(10):
        print(f"- {movie.get('title')} (TMDB ID: {movie.get('tmdb_id')}, has_video: {movie.get('has_video')})")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(run())
