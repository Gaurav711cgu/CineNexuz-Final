import numpy as np
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    logger.warning("PyTorch not installed. Two-Tower model running in mock mode.")


if HAS_TORCH:
    class QueryTower(nn.Module):
        """
        User/Query Tower: Encodes a user + their current context into a 128-dim embedding.

        WHY SEPARATE TOWERS:
        The key insight of Two-Tower models (used by YouTube, Amazon Prime Video, Google Play)
        is that the candidate tower (movies) can be computed OFFLINE for all items.
        At serving time, only the query tower runs in the critical path.
        The online recommendation is then a single dot-product ANN search (sub-millisecond).

        Input features:
        - user_id: int -> 64-dim learned embedding
        - watch_history_len: normalized count of watched movies
        - time_of_day: [0,1] normalized hour (captures morning vs late-night taste shift)
        - device_type: one-hot [mobile, tablet, tv] - affects content-length preference
        """
        def __init__(self, num_users: int = 100000, embed_dim: int = 64, output_dim: int = 128):
            super().__init__()
            self.user_embedding = nn.Embedding(num_users, embed_dim, padding_idx=0)
            context_dim = 3  # watch_history_len, time_of_day, device_type_encoded

            self.network = nn.Sequential(
                nn.Linear(embed_dim + context_dim, 256),
                nn.BatchNorm1d(256),  # Prevents embedding collapse during training
                nn.ReLU(),
                nn.Dropout(0.1),
                nn.Linear(256, output_dim),
            )

        def forward(self, user_ids: torch.Tensor, context: torch.Tensor) -> torch.Tensor:
            user_emb = self.user_embedding(user_ids)  # [B, 64]
            combined = torch.cat([user_emb, context], dim=-1)  # [B, 67]
            return F.normalize(self.network(combined), dim=-1)  # L2 normalize to unit hypersphere


    class CandidateTower(nn.Module):
        """
        Movie/Candidate Tower: Encodes a movie + its metadata into the same 128-dim space.

        This tower is run OFFLINE for all movies in the catalog.
        Results are stored in a vector database (Pinecone/Milvus/FAISS).

        Input features:
        - movie_id: int -> 64-dim learned embedding
        - genre_vec: multi-hot genre vector (18 genres)
        - avg_rating: float [0,10]
        - release_decade: normalized [0,1]
        """
        def __init__(self, num_movies: int = 50000, embed_dim: int = 64, output_dim: int = 128):
            super().__init__()
            self.movie_embedding = nn.Embedding(num_movies, embed_dim, padding_idx=0)
            content_dim = 20  # 18 genre one-hot + avg_rating + release_decade

            self.network = nn.Sequential(
                nn.Linear(embed_dim + content_dim, 256),
                nn.BatchNorm1d(256),
                nn.ReLU(),
                nn.Dropout(0.1),
                nn.Linear(256, output_dim),
            )

        def forward(self, movie_ids: torch.Tensor, content: torch.Tensor) -> torch.Tensor:
            movie_emb = self.movie_embedding(movie_ids)  # [B, 64]
            combined = torch.cat([movie_emb, content], dim=-1)  # [B, 84]
            return F.normalize(self.network(combined), dim=-1)


    class TwoTowerModel(nn.Module):
        """
        Full Two-Tower Model.

        Training uses InfoNCE (NT-Xent) Contrastive Loss:
            L = -log( exp(sim(q,k+)/tau) / sum_j(exp(sim(q,kj)/tau)) )

        Where:
        - q = query (user) embedding
        - k+ = positive candidate (movie the user watched/liked)
        - kj = in-batch negatives (other movies in the batch)
        - tau = temperature hyperparameter (default 0.07)

        In-batch negatives: Every other movie in the training batch is treated as a
        negative example. With batch_size=512, each user gets 511 hard negatives for free.
        """
        def __init__(self, num_users=100000, num_movies=50000):
            super().__init__()
            self.query_tower = QueryTower(num_users=num_users)
            self.candidate_tower = CandidateTower(num_movies=num_movies)
            self.temperature = nn.Parameter(torch.tensor(0.07))  # Learnable temperature

        def forward(self, user_ids, user_context, movie_ids, movie_context):
            q_emb = self.query_tower(user_ids, user_context)       # [B, 128]
            c_emb = self.candidate_tower(movie_ids, movie_context)  # [B, 128]
            # Cosine similarity (embeddings are L2-normalized so dot product = cosine sim)
            scores = torch.sum(q_emb * c_emb, dim=-1)             # [B]
            return scores, q_emb, c_emb

        def infonce_loss(self, q_emb, pos_c_emb, neg_c_emb):
            """In-batch InfoNCE contrastive loss."""
            # Positive pair similarity
            pos_sim = torch.sum(q_emb * pos_c_emb, dim=-1) / self.temperature  # [B]

            # All-pairs similarity matrix (q vs all negatives)
            all_candidates = torch.cat([pos_c_emb, neg_c_emb], dim=0)         # [B+N, 128]
            all_sim = torch.matmul(q_emb, all_candidates.T) / self.temperature  # [B, B+N]

            # Labels: positive is always index 0..B-1
            labels = torch.arange(q_emb.size(0), device=q_emb.device)
            return F.cross_entropy(all_sim, labels)


class AnnRetrievalEngine:
    """
    Approximate Nearest Neighbor (ANN) Retrieval Engine.

    Stores pre-computed movie embeddings from the offline CandidateTower pass.
    At serving time, the user embedding from QueryTower is computed in real-time,
    then this engine finds the top-k most similar movies in milliseconds.

    Production systems use FAISS (Facebook AI Similarity Search) with HNSW index
    for O(log N) retrieval across hundreds of millions of items.
    """
    def __init__(self):
        self.movie_embeddings: Optional[np.ndarray] = None
        self.movie_ids: Optional[List[int]] = None

    def build_index(self, movie_embeddings: np.ndarray, movie_ids: List[int]):
        """Stores pre-computed candidate embeddings (run offline, not in serving path)."""
        # L2 normalize for cosine similarity via dot product
        norms = np.linalg.norm(movie_embeddings, axis=1, keepdims=True)
        self.movie_embeddings = movie_embeddings / np.maximum(norms, 1e-9)
        self.movie_ids = movie_ids
        logger.info(f"ANN index built with {len(movie_ids)} movie embeddings.")

    def retrieve_top_k(self, query_embedding: np.ndarray, k: int = 20) -> List[Dict[str, Any]]:
        """O(N) brute-force cosine similarity (use FAISS HNSW in production for O(log N))."""
        if self.movie_embeddings is None:
            return []

        # Normalize query
        q = query_embedding / np.maximum(np.linalg.norm(query_embedding), 1e-9)

        # Dot product = cosine similarity (since both sides are L2-normalized)
        similarities = np.dot(self.movie_embeddings, q)  # [N]

        # Get top-k indices
        top_k_idx = np.argpartition(similarities, -k)[-k:]
        top_k_idx = top_k_idx[np.argsort(similarities[top_k_idx])[::-1]]

        return [
            {"movie_id": self.movie_ids[i], "score": float(similarities[i])}
            for i in top_k_idx
        ]
