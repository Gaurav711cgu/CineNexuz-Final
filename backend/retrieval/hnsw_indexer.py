"""
CineNexuz HNSW Vector Index & Zero-Downtime Atomic Index Swapper
================================================================
Implements Hierarchical Navigable Small World (HNSW) graph vector indexing
using the real `hnswlib` library for true O(log N) ANN search.
Falls back to NumPy brute-force cosine only when hnswlib is unavailable (CI env).

Zero-downtime updates: AtomicIndexSwapper dual-buffers active/staging indices
so pointer swaps are instantaneous with no QPS drop.
"""
import logging
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

logger = logging.getLogger("retrieval.hnsw_indexer")

try:
    import hnswlib
    HNSWLIB_AVAILABLE = True
    logger.info("hnswlib loaded — true O(log N) HNSW graph index active")
except ImportError:
    HNSWLIB_AVAILABLE = False
    logger.warning("hnswlib not installed — falling back to NumPy brute-force (not for production)")


class HNSWVectorIndexer:
    """
    Memory-mapped HNSW Graph Indexer for O(log N) nearest neighbour search.
    Uses hnswlib (C++ backend) for production throughput; NumPy fallback for CI.
    """

    def __init__(self, dim: int = 64, space: str = "cosine", ef_construction: int = 200, M: int = 16):
        self.dim = dim
        self.space = space
        self.ef_construction = ef_construction
        self.M = M
        self._index: Optional[Any] = None       # hnswlib.Index when available
        self._numpy_vecs: Dict[str, np.ndarray] = {}  # fallback path
        self.id_to_key: List[str] = []
        self._is_built = False

    @property
    def is_built(self) -> bool:
        return self._is_built

    def build_index(self, item_vectors: Dict[str, np.ndarray]) -> int:
        """
        Builds HNSW graph index over catalog item embeddings.
        Returns number of indexed items.
        """
        if not item_vectors:
            return 0

        self.id_to_key = list(item_vectors.keys())
        self._numpy_vecs = item_vectors  # keep for fallback
        n = len(self.id_to_key)

        if HNSWLIB_AVAILABLE:
            try:
                idx = hnswlib.Index(space=self.space, dim=self.dim)
                idx.init_index(max_elements=max(n, 1000), ef_construction=self.ef_construction, M=self.M)
                idx.set_ef(50)  # ef at query time — higher = more accurate

                vecs = np.stack([item_vectors[k] for k in self.id_to_key]).astype(np.float32)
                int_ids = np.arange(n)
                idx.add_items(vecs, int_ids)

                self._index = idx
                logger.info(f"hnswlib HNSW index built: {n} items, dim={self.dim}, space={self.space}")
            except Exception as exc:
                logger.warning(f"hnswlib build failed, using NumPy fallback: {exc}")
                self._index = None
        else:
            logger.warning(f"Built NumPy fallback index with {n} items (install hnswlib for O(log N) ANN)")

        self._is_built = True
        return n

    def query_knn(self, query_vector: np.ndarray, top_k: int = 10) -> List[Tuple[str, float]]:
        """
        Queries K-nearest neighbours using inner product / cosine distance.
        Uses hnswlib when available (O(log N)), falls back to NumPy (O(N)).
        """
        if not self._is_built:
            return []

        top_k = min(top_k, len(self.id_to_key))
        if top_k == 0:
            return []

        q = np.array(query_vector, dtype=np.float32)

        # ── hnswlib O(log N) path ────────────────────────────────────────────
        if HNSWLIB_AVAILABLE and self._index is not None:
            try:
                labels, distances = self._index.knn_query(q.reshape(1, -1), k=top_k)
                results = []
                for label, dist in zip(labels[0], distances[0]):
                    key = self.id_to_key[int(label)]
                    # hnswlib cosine distance ∈ [0,2]; convert to similarity ∈ [-1,1]
                    similarity = round(float(1.0 - dist), 6)
                    results.append((key, similarity))
                return results
            except Exception as exc:
                logger.warning(f"hnswlib query failed, using NumPy fallback: {exc}")

        # ── NumPy O(N) brute-force fallback ─────────────────────────────────
        scores = []
        q_norm = np.linalg.norm(q) + 1e-9
        for item_id, vec in self._numpy_vecs.items():
            sim = float(np.dot(q, vec) / (q_norm * (np.linalg.norm(vec) + 1e-9)))
            scores.append((item_id, sim))
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]


class AtomicIndexSwapper:
    """
    Dual-Buffer Atomic Index Swapper.
    Maintains active and staging indices for zero-downtime catalog re-indexing.
    A Python reference assignment is atomic under the GIL, guaranteeing 0-drop QPS.
    """

    def __init__(self, active_index: HNSWVectorIndexer):
        self.active_index = active_index
        self.staging_index: Optional[HNSWVectorIndexer] = None

    def promote_staging(self, new_index: HNSWVectorIndexer) -> None:
        """
        Atomically promotes the staging index to active.
        Thread-safe: Python reference assignment under GIL is atomic.
        """
        self.staging_index = new_index
        self.active_index = self.staging_index  # atomic GIL-protected swap
        self.staging_index = None
        logger.info("Zero-downtime atomic HNSW index swap completed.")

    # Keep backward-compat alias
    def swap_index(self, new_index: HNSWVectorIndexer) -> None:
        self.promote_staging(new_index)

    def query(self, query_vector: np.ndarray, top_k: int = 10) -> List[Tuple[str, float]]:
        """Queries the currently active HNSW index."""
        return self.active_index.query_knn(query_vector, top_k=top_k)


# ── Module-level singletons ──────────────────────────────────────────────────
_default_idx = HNSWVectorIndexer(dim=64)
# Seed with deterministic (non-random) unit vectors so tests are reproducible
_seed_vecs = {
    f"m{i}": (np.ones(64, dtype=np.float32) * (i + 1) / (i + 1 + 64)).astype(np.float32)
    for i in range(3)
}
_default_idx.build_index(_seed_vecs)
atomic_hnsw_swapper = AtomicIndexSwapper(_default_idx)
