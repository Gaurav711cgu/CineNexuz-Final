import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load env variables from backend/.env
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

MONGO_URL = os.environ.get("MONGO_URL", os.environ.get("MONGO_URI", "mongodb://localhost:27017"))
DB_NAME = os.environ.get("DB_NAME", os.environ.get("MONGO_DB", "cinenexus"))

async def main():
    print(f"Connecting to MongoDB (bypassing SSL verification for macOS client local issuer)...")
    # Added tlsAllowInvalidCertificates=True to bypass local CA certificate verify issues on macOS Python builds
    client = AsyncIOMotorClient(MONGO_URL, tlsAllowInvalidCertificates=True)
    db = client[DB_NAME]
    
    # 1. Update collections
    col_count = await db.collections.count_documents({"emoji": {"$ne": None}})
    print(f"Found {col_count} collections with emojis. Stripping...")
    
    if col_count > 0:
        result = await db.collections.update_many(
            {"emoji": {"$ne": None}},
            {"$set": {"emoji": None}}
        )
        print(f"Successfully updated {result.modified_count} collections.")
    else:
        print("No collections needed updating.")

    # 2. Update movies (if any has an emoji field)
    movie_count = await db.movies.count_documents({"emoji": {"$exists": True}})
    print(f"Found {movie_count} movies with an emoji field. Removing...")
    
    if movie_count > 0:
        result = await db.movies.update_many(
            {"emoji": {"$exists": True}},
            {"$unset": {"emoji": ""}}
        )
        print(f"Successfully updated {result.modified_count} movies.")
    else:
        print("No movies needed updating.")
        
    client.close()
    print("Database migration complete.")

if __name__ == "__main__":
    asyncio.run(main())
