import asyncio
import random
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def seed():
    client = AsyncIOMotorClient('mongodb+srv://Gauravnayak711:Gaurav3412@cinenexuz.uoyossj.mongodb.net/?appName=CineNexuz')
    db = client.cinenexus

    print("Fetching active movies...")
    movies = await db.movies.find({}, {'_id': 1}).to_list(100)
    movie_ids = [str(m['_id']) for m in movies]
    if not movie_ids:
        print("No movies found in catalog! Please seed movies first.")
        return

    print(f"Found {len(movie_ids)} movies. Seeding mock ratings and watch histories...")

    # Define some user IDs
    mock_users = [
        {"email": f"demo_user_{i}@cinenexus.ai", "name": f"Demo User {i}"}
        for i in range(1, 16)
    ]

    interactions_count = 0
    for user_info in mock_users:
        # Check if user already exists
        user = await db.users.find_one({"email": user_info["email"]})
        if not user:
            user_id = ObjectId()
            await db.users.insert_one({
                "_id": user_id,
                "email": user_info["email"],
                "name": user_info["name"],
                "role": "user",
                "watch_history": [],
                "created_at": datetime.now(timezone.utc)
            })
        else:
            user_id = user["_id"]

        # Add 3-8 watch history items & ratings for this user
        n_items = random.randint(3, 8)
        selected_movies = random.sample(movie_ids, min(n_items, len(movie_ids)))
        
        watch_history = []
        for m_id in selected_movies:
            rating_val = random.choice([3.0, 3.5, 4.0, 4.5, 5.0])
            progress = random.choice([25, 60, 90, 100])
            
            # Watch history subdocument inside user
            watch_history.append({
                "movie_id": m_id,
                "progress": progress,
                "watched_at": datetime.now(timezone.utc)
            })

            # Explicit rating in ratings collection
            await db.ratings.update_one(
                {"user_id": str(user_id), "movie_id": m_id},
                {
                    "$set": {
                        "user_id": str(user_id),
                        "movie_id": m_id,
                        "rating": rating_val,
                        "created_at": datetime.now(timezone.utc)
                    }
                },
                upsert=True
            )
            interactions_count += 1

        # Update user watch history
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"watch_history": watch_history}}
        )

    print(f"Successfully seeded {len(mock_users)} mock users and {interactions_count} movie interactions/ratings!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
