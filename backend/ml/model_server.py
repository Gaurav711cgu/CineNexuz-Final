"""SVD model server: load pre-trained factors and serve recommendations."""
import json
import logging
import os

import numpy as np

logger = logging.getLogger(__name__)
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")


class SVDRecommender:
    def __init__(self):
        self.ready = False
        self.user_factors = None
        self.item_factors = None
        self.user_idx = {}
        self.movie_idx = {}
        self.idx_to_movie = {}
        self.title_lookup = {}
        self.metrics = {}

    def load(self):
        try:
            self.user_factors = np.load(os.path.join(ARTIFACTS_DIR, "user_factors.npy"))
            self.item_factors = np.load(os.path.join(ARTIFACTS_DIR, "item_factors.npy"))
            with open(os.path.join(ARTIFACTS_DIR, "mappings.json"), encoding="utf-8") as handle:
                data = json.load(handle)
            self.user_idx = {int(key): value for key, value in data["user_idx"].items()}
            self.movie_idx = {int(key): value for key, value in data["movie_idx"].items()}
            self.idx_to_movie = {int(key): value for key, value in data["idx_to_movie"].items()}
            self.title_lookup = {int(key): value for key, value in data.get("title_lookup", {}).items()}
            self.metrics = data.get("metrics", {})
            self.ready = True
            logger.info("SVD model loaded. NDCG@10=%s", self.metrics.get("ndcg_at_10"))
        except Exception as exc:
            self.ready = False
            logger.warning("SVD model not loaded: %s", exc)

    def recommend_by_movielens_user(self, ml_user_id: int, top_k: int = 20) -> list:
        if not self.ready or ml_user_id not in self.user_idx:
            return []
        scores = self.user_factors[self.user_idx[ml_user_id]] @ self.item_factors.T
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [self.idx_to_movie[idx] for idx in top_indices if idx in self.idx_to_movie]

    def recommend_similar_movies(self, ml_movie_id: int, top_k: int = 10) -> list:
        if not self.ready or ml_movie_id not in self.movie_idx:
            return []
        movie_idx = self.movie_idx[ml_movie_id]
        query = self.item_factors[movie_idx]
        norms = np.linalg.norm(self.item_factors, axis=1)
        sims = (self.item_factors @ query) / (norms * np.linalg.norm(query) + 1e-9)
        top_indices = np.argsort(sims)[::-1][1:top_k + 1]
        return [self.idx_to_movie[idx] for idx in top_indices if idx in self.idx_to_movie]


svd_recommender = SVDRecommender()
