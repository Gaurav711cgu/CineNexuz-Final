"""Seed MongoDB with MovieLens-derived synthetic watch history for demos."""
import asyncio
import io
import os
import random
import re
import urllib.request
import zipfile
from datetime import datetime, timezone

import bcrypt
import pandas as pd
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()


def normalize_title(title: str) -> str:
    title = re.sub(r"\s+\(\d{4}\)$", "", title or "")
    return re.sub(r"[^a-z0-9]+", "", title.lower())


async def seed():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"], tlsAllowInvalidCertificates=True)
    db = client[os.environ.get("DB_NAME", "cinenexus")]

    print("Downloading MovieLens 1M...")
    with urllib.request.urlopen("https://files.grouplens.org/datasets/movielens/ml-1m.zip") as response:
        archive = zipfile.ZipFile(io.BytesIO(response.read()))
    ratings = pd.read_csv(
        archive.open("ml-1m/ratings.dat"),
        sep="::",
        engine="python",
        names=["userId", "movieId", "rating", "timestamp"],
    )
    movies_df = pd.read_csv(
        archive.open("ml-1m/movies.dat"),
        sep="::",
        engine="python",
        names=["movieId", "title", "genres"],
        encoding="latin-1",
    )

    catalog = await db.movies.find({}).to_list(10000)
    normalized_catalog = {normalize_title(movie.get("title", "")): movie for movie in catalog}
    ml_to_mongo = {}
    for _, movie in movies_df.iterrows():
        match = normalized_catalog.get(normalize_title(movie["title"]))
        if match:
            ml_to_mongo[int(movie["movieId"])] = str(match["_id"])
            await db.movies.update_one({"_id": match["_id"]}, {"$set": {"movielens_id": int(movie["movieId"])}})
    print(f"Matched {len(ml_to_mongo)} MovieLens titles to catalog movies")

    inserted = 0
    password = bcrypt.hashpw("synthetic-demo".encode(), bcrypt.gensalt()).decode()
    top_users = ratings["userId"].value_counts().head(500).index.tolist()
    for ml_user_id in top_users:
        email = f"ml_user_{ml_user_id}@synthetic.cinenexus"
        user = await db.users.find_one({"email": email})
        if not user:
            result = await db.users.insert_one({
                "email": email,
                "password": password,
                "name": f"MovieLens User {ml_user_id}",
                "role": "user",
                "created_at": datetime.now(timezone.utc),
                "subscription": None,
                "watch_history": [],
                "taste_vector": {},
                "synthetic": True,
            })
            user = await db.users.find_one({"_id": result.inserted_id})
        user_id = str(user["_id"])

        for _, row in ratings[ratings["userId"] == ml_user_id].iterrows():
            mongo_id = ml_to_mongo.get(int(row["movieId"]))
            if not mongo_id:
                continue
            completed = float(row["rating"]) >= 3.5
            event = {
                "user_id": user_id,
                "movie_id": mongo_id,
                "progress_seconds": random.randint(3600, 7200) if completed else random.randint(600, 3000),
                "total_duration": 7200,
                "completed": completed,
                "updated_at": datetime.fromtimestamp(int(row["timestamp"]), timezone.utc),
                "watched_at": datetime.fromtimestamp(int(row["timestamp"]), timezone.utc),
            }
            await db.watch_history.update_one(
                {"user_id": user_id, "movie_id": mongo_id},
                {"$set": event},
                upsert=True,
            )
            inserted += 1
    print(f"Seeded {inserted} watch history entries from MovieLens ratings")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
