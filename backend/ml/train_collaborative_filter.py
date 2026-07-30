"""
MovieLens 1M -> SVD Collaborative Filter.

Run once:
    python -m backend.ml.train_collaborative_filter

Outputs:
    backend/ml/artifacts/user_factors.npy
    backend/ml/artifacts/item_factors.npy
    backend/ml/artifacts/mappings.json
"""
import io
import json
import logging
import os
import urllib.request
import zipfile

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds
from sklearn.metrics import ndcg_score
from sklearn.model_selection import train_test_split

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)


def download_movielens_1m():
    url = "https://files.grouplens.org/datasets/movielens/ml-1m.zip"
    logger.info("Downloading MovieLens 1M...")
    with urllib.request.urlopen(url) as response:  # nosec B310 — URL is a hardcoded https constant sourced from a trusted variable, not user input
        archive = zipfile.ZipFile(io.BytesIO(response.read()))

    ratings = pd.read_csv(
        archive.open("ml-1m/ratings.dat"),
        sep="::",
        engine="python",
        names=["userId", "movieId", "rating", "timestamp"],
    )
    movies = pd.read_csv(
        archive.open("ml-1m/movies.dat"),
        sep="::",
        engine="python",
        names=["movieId", "title", "genres"],
        encoding="latin-1",
    )
    logger.info("Loaded %s ratings, %s movies", len(ratings), len(movies))
    return ratings, movies


def train_svd(ratings: pd.DataFrame, n_factors: int = 50):
    train_parts, test_parts = [], []
    for _, group in ratings.groupby("userId"):
        train, test = train_test_split(group, test_size=0.2, random_state=42)
        train_parts.append(train)
        test_parts.append(test)

    train_df = pd.concat(train_parts)
    test_df = pd.concat(test_parts)

    user_ids = sorted(ratings["userId"].unique())
    movie_ids = sorted(ratings["movieId"].unique())
    user_idx = {user_id: idx for idx, user_id in enumerate(user_ids)}
    movie_idx = {movie_id: idx for idx, movie_id in enumerate(movie_ids)}

    rows = [user_idx[user_id] for user_id in train_df["userId"]]
    cols = [movie_idx[movie_id] for movie_id in train_df["movieId"]]
    data = train_df["rating"].values.astype(np.float32)
    matrix = csr_matrix((data, (rows, cols)), shape=(len(user_ids), len(movie_ids)))
    logger.info("Training matrix: %s, sparsity: %.4f", matrix.shape, 1 - matrix.nnz / (matrix.shape[0] * matrix.shape[1]))

    logger.info("Running SVD with %s factors...", n_factors)
    users, sigma, items_t = svds(matrix.astype(np.float64), k=n_factors)
    user_factors = users @ np.diag(sigma)
    item_factors = items_t.T
    predicted = user_factors @ item_factors.T
    seen_by_user = {
        user_id: {movie_idx[movie_id] for movie_id in group["movieId"] if movie_id in movie_idx}
        for user_id, group in train_df.groupby("userId")
    }

    ndcg_scores, precision_scores = [], []
    for user_id, group in test_df.groupby("userId"):
        relevant = {
            movie_idx[movie_id]
            for movie_id in group[group["rating"] >= 4]["movieId"]
            if movie_id in movie_idx
        }
        if not relevant:
            continue
        scores = predicted[user_idx[user_id]].copy()
        floor = float(scores.min()) - 1.0
        for seen_idx in seen_by_user.get(user_id, set()):
            scores[seen_idx] = floor
        top_indices = np.argsort(scores)[::-1][:10]
        precision_scores.append(sum(1 for idx in top_indices if idx in relevant) / 10)

        truth = np.zeros(len(movie_ids))
        for idx in relevant:
            truth[idx] = 1
        ndcg_scores.append(ndcg_score(truth.reshape(1, -1), scores.reshape(1, -1), k=10))

    metrics = {
        "ndcg_at_10": round(float(np.mean(ndcg_scores)) if ndcg_scores else 0.0, 4),
        "precision_at_10": round(float(np.mean(precision_scores)) if precision_scores else 0.0, 4),
        "n_users": len(user_ids),
        "n_items": len(movie_ids),
        "n_ratings": len(train_df),
        "n_factors": n_factors,
    }
    logger.info("Evaluation results: %s", metrics)
    return user_factors, item_factors, user_idx, movie_idx, metrics


def save_artifacts(user_factors, item_factors, user_idx, movie_idx, metrics, movies_df):
    np.save(os.path.join(ARTIFACTS_DIR, "user_factors.npy"), user_factors)
    np.save(os.path.join(ARTIFACTS_DIR, "item_factors.npy"), item_factors)
    idx_to_movie = {int(idx): int(movie_id) for movie_id, idx in movie_idx.items()}
    title_lookup = {int(movie_id): title for movie_id, title in zip(movies_df["movieId"], movies_df["title"])}
    with open(os.path.join(ARTIFACTS_DIR, "mappings.json"), "w", encoding="utf-8") as handle:
        json.dump({
            "user_idx": {str(int(key)): int(value) for key, value in user_idx.items()},
            "movie_idx": {str(int(key)): int(value) for key, value in movie_idx.items()},
            "idx_to_movie": {str(key): value for key, value in idx_to_movie.items()},
            "title_lookup": {str(key): value for key, value in title_lookup.items()},
            "metrics": metrics,
        }, handle)
    logger.info("Artifacts saved to %s", ARTIFACTS_DIR)


if __name__ == "__main__":
    ratings_frame, movies_frame = download_movielens_1m()
    artifacts = train_svd(ratings_frame)
    save_artifacts(*artifacts, movies_frame)
    print("\nTraining complete")
    print(f"   NDCG@10:      {artifacts[-1]['ndcg_at_10']}")
    print(f"   Precision@10: {artifacts[-1]['precision_at_10']}")
