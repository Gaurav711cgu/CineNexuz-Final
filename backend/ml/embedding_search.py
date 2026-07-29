"""Dense embedding search using sentence-transformers."""
import logging

import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingSearchEngine:
    def __init__(self):
        self.model = None
        self.embeddings = None
        self.movie_ids = []
        self.ready = False

    def load_model(self):
        try:
            from sentence_transformers import SentenceTransformer

            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Sentence transformer loaded (all-MiniLM-L6-v2)")
        except ImportError:
            logger.warning("sentence-transformers not installed; falling back to TF-IDF")
        except Exception as exc:
            logger.warning("Embedding model load failed: %s", exc)

    def build_index(self, movies: list):
        if not self.model:
            return
        texts = []
        self.movie_ids = []
        for movie in movies:
            text = " ".join([
                movie.get("title", ""),
                movie.get("overview", "")[:300],
                " ".join(movie.get("genres", [])),
                " ".join(movie.get("cast_names", [])[:5]),
                movie.get("director", ""),
            ])
            texts.append(text)
            self.movie_ids.append(str(movie["_id"]))
        if not texts:
            return
        logger.info("Building embeddings for %s movies...", len(texts))
        self.embeddings = self.model.encode(
            texts,
            batch_size=64,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        self.ready = True
        logger.info("Embedding index built. Shape: %s", self.embeddings.shape)

    def search(self, query: str, top_k: int = 20) -> list:
        if not self.ready or not self.model:
            return []
        query_embedding = self.model.encode([query], normalize_embeddings=True)
        scores = (self.embeddings @ query_embedding.T).squeeze()
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [(self.movie_ids[idx], float(scores[idx])) for idx in top_indices]

    def similar_to_movie(self, movie_id: str, top_k: int = 10) -> list:
        if not self.ready or movie_id not in self.movie_ids:
            return []
        movie_idx = self.movie_ids.index(movie_id)
        scores = self.embeddings @ self.embeddings[movie_idx]
        top_indices = np.argsort(scores)[::-1][1:top_k + 1]
        return [(self.movie_ids[idx], float(scores[idx])) for idx in top_indices]


embedding_engine = EmbeddingSearchEngine()
