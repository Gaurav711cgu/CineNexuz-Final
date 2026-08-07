"""
Unit Test Suite for Zero-Roast Staff Upgrade Modules
===================================================
Verifies ONNX Runtime model engine, PySpark Feature ETL pipeline,
and HNSW Atomic Index Swapper.
"""
import sys
import os
import pytest
import numpy as np

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
SCRIPTS_DIR = os.path.join(ROOT_DIR, "scripts")
for d in [BACKEND_DIR, SCRIPTS_DIR]:
    if d not in sys.path:
        sys.path.insert(0, d)

from ml.onnx_server import onnx_engine
from retrieval.hnsw_indexer import HNSWVectorIndexer, AtomicIndexSwapper
from spark_feature_pipeline import spark_pipeline

class TestONNXInferenceEngine:
    @pytest.mark.asyncio
    async def test_async_embedding_prediction(self):
        dummy_feat = np.random.randn(1, 32).astype(np.float32)
        emb = await onnx_engine.predict_embedding_async(dummy_feat)
        assert emb is not None
        assert len(emb.shape) >= 1

class TestPySparkETLPipeline:
    def test_spark_interaction_batch_processing(self):
        raw = [
            {"user_id": "u1", "genre": "Action", "watch_pct": 0.8},
            {"user_id": "u1", "genre": "Action", "watch_pct": 1.0},
            {"user_id": "u2", "genre": "Comedy", "watch_pct": 0.5}
        ]
        out = spark_pipeline.process_interaction_batch(raw)
        assert len(out) == 2
        u1_feat = next(x for x in out if x["user_id"] == "u1")
        assert u1_feat["avg_watch_pct"] == 0.9
        assert u1_feat["top_genre"] == "Action"

class TestHNSWVectorIndexer:
    def test_atomic_index_swapping(self):
        idx1 = HNSWVectorIndexer(dim=4)
        idx1.build_index({"m1": np.array([1.0, 0.0, 0.0, 0.0])})
        swapper = AtomicIndexSwapper(idx1)

        res1 = swapper.query(np.array([1.0, 0.0, 0.0, 0.0]), top_k=1)
        assert res1[0][0] == "m1"

        idx2 = HNSWVectorIndexer(dim=4)
        idx2.build_index({"m99": np.array([0.0, 1.0, 0.0, 0.0])})
        swapper.swap_index(idx2)

        res2 = swapper.query(np.array([0.0, 1.0, 0.0, 0.0]), top_k=1)
        assert res2[0][0] == "m99"
