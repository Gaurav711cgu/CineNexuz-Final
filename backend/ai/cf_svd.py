"""
CineNexus Collaborative Filtering Engine
SVD-based collaborative filtering using the Surprise library.

Latent factors: 50 | Epochs: 20 | LR: 0.005 | Regularization: 0.02
Falls back to popularity when insufficient data (<50 interactions).
"""
import os
import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import numpy as np
try:
    from logging_utils import log_event
except ImportError:
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from logging_utils import log_event

try:
    from surprise import SVD, Dataset, Reader, accuracy
    from surprise.model_selection import train_test_split
    import pandas as pd
    SURPRISE_AVAILABLE = True
except ImportError:
    SURPRISE_AVAILABLE = False


class CollaborativeFilteringEngine:
    """
    SVD-based collaborative filtering using the Surprise library.
    Trained on user watch history + explicit ratings from MongoDB.
    Falls back to popularity when insufficient data (<50 interactions).

    Latent factors: 50 | Epochs: 20 | LR: 0.005 | Regularization: 0.02
    """
    def __init__(self):
        self.model = None
        self.trainset = None
        self.is_trained = False
        self.movie_id_map = {}
        self.reverse_movie_map = {}
        self.min_interactions = 5
        self.last_trained = None
        self.training_stats = {}
        self.model_params = {
            "n_factors": 50,
            "n_epochs": 20,
            "lr_all": 0.005,
            "reg_all": 0.02
        }

    async def train(self, db) -> Dict[str, Any]:
        """
        Train SVD model on watch history + ratings from MongoDB.
        Uses a time-based train/test split (80/20) and computes
        RMSE, MAE, Precision@10, and NDCG@10.
        
        Rating mapping:
        - watched (no explicit rating) = implicit 3.5
        - user explicit rating (1-5) = use as-is
        - skipped = implicit 1.5
        """
        if not SURPRISE_AVAILABLE:
            return {"status": "error", "message": "scikit-surprise not installed"}

        try:
            # 1. Pull all watch_history + ratings from MongoDB with timestamps
            interactions = []
            
            # Get watch history
            users = await db.users.find({"watch_history": {"$exists": True, "$ne": []}}).to_list(10000)
            for user in users:
                user_id = str(user["_id"])
                for item in user.get("watch_history", []):
                    movie_id = item.get("movie_id", item) if isinstance(item, dict) else item
                    progress = item.get("progress", 100) if isinstance(item, dict) else 100
                    if progress > 80:
                        rating = 4.0  # Completed
                    elif progress > 50:
                        rating = 3.5  # Watched most
                    elif progress > 20:
                        rating = 2.5  # Partially watched
                    else:
                        rating = 1.5  # Skipped/abandoned
                    
                    # Extract timestamp
                    watched_at = item.get("watched_at") if isinstance(item, dict) else None
                    dt = None
                    if watched_at:
                        try:
                            if isinstance(watched_at, datetime):
                                dt = watched_at
                            else:
                                dt = datetime.fromisoformat(str(watched_at).replace('Z', '+00:00'))
                        except Exception:
                            pass
                    if not dt:
                        dt = datetime.now(timezone.utc)
                    
                    interactions.append((user_id, str(movie_id), rating, dt))
            
            # Get explicit ratings
            ratings = await db.ratings.find({}).to_list(10000)
            for r in ratings:
                user_id = str(r.get("user_id"))
                movie_id = str(r.get("movie_id"))
                rating = float(r.get("rating", 3.5))
                if rating > 5:
                    rating = min(rating / 2, 5.0)
                
                # Extract timestamp
                created_at = r.get("created_at")
                dt = None
                if created_at:
                    try:
                        if isinstance(created_at, datetime):
                            dt = created_at
                        else:
                            dt = datetime.fromisoformat(str(created_at).replace('Z', '+00:00'))
                    except Exception:
                        pass
                if not dt:
                    dt = datetime.now(timezone.utc)
                
                interactions.append((user_id, movie_id, rating, dt))
            
            # 2. Check minimum interactions
            n_interactions = len(interactions)
            if n_interactions < self.min_interactions:
                self.is_trained = False
                self.training_stats = {
                    "status": "insufficient_data",
                    "n_interactions": n_interactions,
                    "min_required": self.min_interactions,
                    "trained_at": datetime.now(timezone.utc).isoformat()
                }
                try:
                    await db.cf_training_history.insert_one({
                        "status": "insufficient_data",
                        "n_interactions": n_interactions,
                        "min_required": self.min_interactions,
                        "trained_at": datetime.now(timezone.utc)
                    })
                except Exception as db_err:
                    log_event(logging.ERROR, f"Failed to save CF insufficient data status to DB: {db_err}", "cf_svd")
                return self.training_stats
            
            # Offload heavy ML matrix factorization & evaluation to thread pool executor
            loop = asyncio.get_running_loop()
            stats_result, candidate_model, trainset, train_df, is_promoted = await loop.run_in_executor(
                None, self._fit_and_evaluate_sync, interactions
            )
            
            if is_promoted and candidate_model is not None:
                self.model = candidate_model
                self.trainset = trainset
                self.is_trained = True
                self.last_trained = datetime.now(timezone.utc)
                unique_movies = train_df["movie_id"].unique()
                self.movie_id_map = {mid: idx for idx, mid in enumerate(unique_movies)}
                self.reverse_movie_map = {idx: mid for mid, idx in self.movie_id_map.items()}

            self.training_stats = stats_result
            
            try:
                await db.cf_training_history.insert_one(stats_result)
            except Exception as db_err:
                log_event(logging.ERROR, f"Failed to save CF training status to DB: {db_err}", "cf_svd")
                
            log_event(logging.INFO, f"CF Engine training completed (status: {stats_result.get('status')}): {stats_result.get('n_interactions')} interactions, RMSE={stats_result.get('rmse')}", "cf_svd")
            return self.training_stats

        except Exception as e:
            self.is_trained = False
            self.training_stats = {
                "status": "error",
                "error": str(e),
                "trained_at": datetime.now(timezone.utc).isoformat()
            }
            log_event(logging.ERROR, f"CF Engine training failed: {e}", "cf_svd")
            return self.training_stats

    def _fit_and_evaluate_sync(self, interactions):
        """Synchronous CPU-intensive SVD training & evaluation executed off main event loop."""
        grouped = {}
        for user_id, movie_id, rating, dt in sorted(interactions, key=lambda x: x[3]):
            key = (user_id, movie_id)
            if key not in grouped:
                grouped[key] = {"ratings": [], "dts": []}
            grouped[key]["ratings"].append(rating)
            grouped[key]["dts"].append(dt)
        
        aggregated_interactions = []
        for (user_id, movie_id), data in grouped.items():
            mean_rating = sum(data["ratings"]) / len(data["ratings"])
            max_dt = max(data["dts"])
            aggregated_interactions.append((user_id, movie_id, mean_rating, max_dt))
        
        aggregated_interactions.sort(key=lambda x: x[3])
        split_idx = int(len(aggregated_interactions) * 0.8)
        train_data = aggregated_interactions[:split_idx]
        test_data = aggregated_interactions[split_idx:]
        
        if not train_data or not test_data:
            train_data, test_data = train_test_split(aggregated_interactions, test_size=0.2, random_state=42)
        
        train_df = pd.DataFrame([(u, m, r) for u, m, r, _ in train_data], columns=["user_id", "movie_id", "rating"])
        
        reader = Reader(rating_scale=(1, 5))
        train_dataset = Dataset.load_from_df(train_df[["user_id", "movie_id", "rating"]], reader)
        trainset = train_dataset.build_full_trainset()
        
        testset = [(str(u), str(m), float(r)) for u, m, r, _ in test_data]
        
        candidate_model = SVD(**self.model_params)
        candidate_model.fit(trainset)
        
        predictions = candidate_model.test(testset)
        rmse = accuracy.rmse(predictions, verbose=False)
        mae = accuracy.mae(predictions, verbose=False)
        
        from collections import defaultdict
        user_est_true = defaultdict(list)
        for uid, iid, r_ui, est, _ in predictions:
            user_est_true[uid].append((est, r_ui))
        
        threshold = 3.0
        k = 10
        precisions = []
        for uid, user_ratings in user_est_true.items():
            user_ratings.sort(key=lambda x: x[0], reverse=True)
            top_k = user_ratings[:k]
            n_rel = sum(1 for est, r_ui in top_k if r_ui >= threshold)
            precisions.append(n_rel / len(top_k) if top_k else 0.0)
        precision_at_10 = float(np.mean(precisions)) if precisions else 0.0
        
        ndcgs = []
        for uid, user_ratings in user_est_true.items():
            user_ratings.sort(key=lambda x: x[0], reverse=True)
            dcg = sum(1.0 / np.log2(idx + 2) for idx, (_, r_ui) in enumerate(user_ratings[:k]) if r_ui >= threshold)
            
            user_ratings_actual = sorted(user_ratings, key=lambda x: x[1], reverse=True)
            idcg = sum(1.0 / np.log2(idx + 2) for idx, (_, r_ui) in enumerate(user_ratings_actual[:k]) if r_ui >= threshold)
            
            ndcgs.append(dcg / idcg if idcg > 0 else 0.0)
        ndcg_at_10 = float(np.mean(ndcgs)) if ndcgs else 0.0
        
        is_promoted = True
        promotion_reason = "Initial training or baseline comparison passed."
        
        if self.is_trained and self.model is not None:
            try:
                current_predictions = self.model.test(testset)
                current_user_est_true = defaultdict(list)
                for uid, iid, r_ui, est, _ in current_predictions:
                    current_user_est_true[uid].append((est, r_ui))
                    
                current_ndcgs = []
                for uid, user_ratings in current_user_est_true.items():
                    user_ratings.sort(key=lambda x: x[0], reverse=True)
                    dcg = sum(1.0 / np.log2(idx + 2) for idx, (_, r_ui) in enumerate(user_ratings[:k]) if r_ui >= threshold)
                    user_ratings_actual = sorted(user_ratings, key=lambda x: x[1], reverse=True)
                    idcg = sum(1.0 / np.log2(idx + 2) for idx, (_, r_ui) in enumerate(user_ratings_actual[:k]) if r_ui >= threshold)
                    current_ndcgs.append(dcg / idcg if idcg > 0 else 0.0)
                current_ndcg_at_10 = float(np.mean(current_ndcgs)) if current_ndcgs else 0.0
                
                if ndcg_at_10 < current_ndcg_at_10 * 0.95:
                    is_promoted = False
                    promotion_reason = f"Candidate NDCG@10 ({ndcg_at_10:.4f}) dropped >5% vs Active ({current_ndcg_at_10:.4f})"
                else:
                    promotion_reason = f"Candidate NDCG@10 ({ndcg_at_10:.4f}) passed gate vs Active ({current_ndcg_at_10:.4f})"
            except Exception as eval_err:
                promotion_reason = f"Promoted fallback: {eval_err}"

        epoch_losses = []
        max_epochs = self.model_params.get("n_epochs", 20)
        for ep in range(1, max_epochs + 1):
            model_ep = SVD(n_epochs=ep, n_factors=self.model_params["n_factors"],
                           lr_all=self.model_params["lr_all"], reg_all=self.model_params["reg_all"],
                           random_state=42)
            model_ep.fit(trainset)
            pred_ep = model_ep.test(testset)
            rmse_ep = accuracy.rmse(pred_ep, verbose=False)
            epoch_losses.append(round(rmse_ep, 4))

        status_str = "trained" if is_promoted else "rejected_shadow"
        n_users = train_df["user_id"].nunique()
        n_movies = train_df["movie_id"].nunique()
        
        stats = {
            "status": status_str,
            "n_interactions": len(aggregated_interactions),
            "n_users": n_users,
            "n_movies": n_movies,
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
            "precision_at_10": round(precision_at_10, 4),
            "ndcg_at_10": round(ndcg_at_10, 4),
            "epoch_losses": epoch_losses,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "model_params": self.model_params,
            "promotion_reason": promotion_reason
        }
        return stats, candidate_model, trainset, train_df, is_promoted

    def predict_for_user(self, user_id: str, candidate_movie_ids: List[str], top_n: int = 20) -> List[Dict]:
        """
        Predict ratings for candidate movies for a specific user.
        Returns sorted list of movie recommendations with predicted ratings.
        """
        if not self.is_trained or self.model is None:
            # Popularity fallback
            return [
                {"movie_id": mid, "predicted_rating": 0.0, "fallback": True}
                for mid in candidate_movie_ids[:top_n]
            ]
        
        predictions = []
        for movie_id in candidate_movie_ids:
            try:
                pred = self.model.predict(str(user_id), str(movie_id))
                predictions.append({
                    "movie_id": movie_id,
                    "predicted_rating": round(pred.est, 3),
                    "details": {
                        "was_impossible": pred.details.get("was_impossible", False)
                    }
                })
            except Exception:
                predictions.append({
                    "movie_id": movie_id,
                    "predicted_rating": 3.0,  # Default
                    "error": True
                })
        
        # Sort by predicted rating descending
        predictions.sort(key=lambda x: x["predicted_rating"], reverse=True)
        return predictions[:top_n]

    def get_similar_movies(self, movie_id: str, all_movie_ids: List[str], top_n: int = 10) -> List[Dict]:
        """
        Find similar movies using SVD latent factors (model.qi matrix).
        Compute cosine similarity of target movie vector vs all others.
        """
        if not self.is_trained or self.model is None:
            return []
        
        try:
            # Get inner id for target movie
            target_inner_id = self.trainset.to_inner_iid(str(movie_id))
            target_vector = self.model.qi[target_inner_id]
            
            similarities = []
            for mid in all_movie_ids:
                if mid == movie_id:
                    continue
                try:
                    inner_id = self.trainset.to_inner_iid(str(mid))
                    movie_vector = self.model.qi[inner_id]
                    
                    # Cosine similarity
                    dot = np.dot(target_vector, movie_vector)
                    norm_t = np.linalg.norm(target_vector)
                    norm_m = np.linalg.norm(movie_vector)
                    
                    if norm_t > 0 and norm_m > 0:
                        sim = dot / (norm_t * norm_m)
                        similarities.append({
                            "movie_id": mid,
                            "similarity_score": round(float(sim), 4)
                        })
                except Exception:
                    continue
            
            similarities.sort(key=lambda x: x["similarity_score"], reverse=True)
            return similarities[:top_n]
            
        except Exception as e:
            log_event(logging.ERROR, f"Similar movies error: {e}", "cf_svd")
            return []

    def get_stats(self) -> Dict[str, Any]:
        """Return current engine statistics."""
        return {
            "is_trained": self.is_trained,
            "training_stats": self.training_stats,
            "model_params": self.model_params,
            "last_trained": self.last_trained.isoformat() if self.last_trained else None,
            "algorithm": "SVD_collaborative_filtering",
            "library": "scikit-surprise"
        }


# Global instance
cf_engine = CollaborativeFilteringEngine()
