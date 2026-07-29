"""
CineNexuz Two-Stage Recommendation Pipeline
Stage 1: FAISS ANN candidate generation (reduces catalog from N -> K=200) [<10ms]
Stage 2: Collaborative Filtering SVD + Session Recency Reranking [<35ms]
Total p99 SLA < 50ms.
"""
import time
import logging
from typing import List, Dict, Any

from retrieval.faiss_index import faiss_retriever
from ai.cf_svd import cf_engine
from feature_store.feature_store import feature_store

try:
    from logging_utils import log_event
except ImportError:
    def log_event(level, msg, ep="two_stage"):
        logging.log(level, f"[{ep}] {msg}")


class TwoStagePipeline:
    """Orchestrates Stage 1 Candidate Retrieval and Stage 2 Reranking."""

    def __init__(self, db=None):
        self.db = db

    def set_db(self, db):
        self.db = db

    async def recommend(self, user_id: str, user_embedding: Any = None, limit: int = 20) -> Dict[str, Any]:
        """Executes two-stage recommendation pipeline."""
        start_time = time.perf_counter()
        
        # 1. Fetch user features from Feature Store (<5ms)
        user_features = await feature_store.get_user_features(user_id)
        
        # 2. Stage 1: Candidate Generation (FAISS / Vector retrieval -> 200 items) [<10ms]
        candidates: List[str] = []
        if user_embedding is not None and faiss_retriever.is_built:
            candidates = faiss_retriever.retrieve_candidates(user_embedding, top_k=200)

        # Fallback: if candidates empty, pull 200 most popular movie IDs
        if not candidates and self.db:
            try:
                pop_movies = await self.db.movies.find({}, {"_id": 1}).sort("popularity", -1).limit(200).to_list(200)
                candidates = [str(m["_id"]) for m in pop_movies]
            except Exception as db_err:
                log_event(logging.WARNING, f"Fallback candidate fetch error: {db_err}", "two_stage")

        retrieval_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # 3. Stage 2: Reranking (SVD Collaborative Filter + Session Context) [<35ms]
        rerank_start = time.perf_counter()
        ranked_predictions = []
        if cf_engine.is_trained and candidates:
            ranked_predictions = cf_engine.predict_for_user(user_id, candidates, top_n=limit)
        else:
            # Cold-start fallback
            ranked_predictions = [{"movie_id": cid, "predicted_rating": 3.5, "explanation": "Popularity fallback"} for cid in candidates[:limit]]

        rerank_ms = round((time.perf_counter() - rerank_start) * 1000, 2)
        total_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "user_id": user_id,
            "recommendations": ranked_predictions,
            "pipeline_telemetry": {
                "stage1_retrieval_ms": retrieval_ms,
                "stage2_rerank_ms": rerank_ms,
                "total_pipeline_ms": total_ms,
                "candidates_count": len(candidates),
                "user_features": user_features
            }
        }


# Global instance
two_stage_pipeline = TwoStagePipeline()
