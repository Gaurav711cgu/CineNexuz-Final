"""
CineNexus Resilient AI Service Manager
======================================
Implements lazy loading, graceful degradation, and health probes for all AI/ML components.
Prevents top-level module startup crashes when optional dependencies, environment keys,
or model artifacts are missing.
"""

import sys
import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("ai_service_manager")


class AIServiceManager:
    """Singleton lazy-loading manager for CineNexus AI & ML services."""

    _svd_recommender = None
    _vector_store = None
    _faiss_retriever = None
    _sentiment_classifier = None
    _langgraph_agent = None
    _langchain_rag = None
    _eval_runner = None
    _embedding_engine = None
    _two_stage_pipeline = None
    _cf_engine = None
    _scratch_tfidf = None
    _feature_store = None

    _component_status: Dict[str, Dict[str, Any]] = {
        "svd": {"status": "uninitialized", "error": None},
        "rag_chroma": {"status": "uninitialized", "error": None},
        "faiss": {"status": "uninitialized", "error": None},
        "sentiment": {"status": "uninitialized", "error": None},
        "langgraph": {"status": "uninitialized", "error": None},
        "langchain": {"status": "uninitialized", "error": None},
        "embedding": {"status": "uninitialized", "error": None},
        "two_stage": {"status": "uninitialized", "error": None},
        "tfidf": {"status": "uninitialized", "error": None},
        "feature_store": {"status": "uninitialized", "error": None},
    }

    @classmethod
    def get_svd_recommender(cls):
        """Lazy loads SVD recommender."""
        if cls._svd_recommender is None:
            try:
                from ml.model_server import svd_recommender
                cls._svd_recommender = svd_recommender
                cls._component_status["svd"] = {"status": "ok" if getattr(svd_recommender, "ready", False) else "degraded", "error": None}
            except Exception as e:
                logger.warning(f"Failed to load SVD recommender: {e}")
                cls._component_status["svd"] = {"status": "degraded", "error": str(e)}
                cls._svd_recommender = None
        return cls._svd_recommender

    @classmethod
    def get_vector_store(cls):
        """Lazy loads ChromaDB RAG Vector Store."""
        if cls._vector_store is None:
            try:
                from ai.rag_chroma import vector_store
                cls._vector_store = vector_store
                cls._component_status["rag_chroma"] = {"status": "ok" if getattr(vector_store, "ready", False) else "degraded", "error": None}
            except Exception as e:
                logger.warning(f"Failed to load Chroma vector store: {e}")
                cls._component_status["rag_chroma"] = {"status": "degraded", "error": str(e)}
                cls._vector_store = None
        return cls._vector_store

    @classmethod
    def get_faiss_retriever(cls):
        """Lazy loads FAISS vector index."""
        if cls._faiss_retriever is None:
            try:
                from retrieval.faiss_index import faiss_retriever
                cls._faiss_retriever = faiss_retriever
                cls._component_status["faiss"] = {"status": "ok" if getattr(faiss_retriever, "ready", False) else "degraded", "error": None}
            except Exception as e:
                logger.warning(f"Failed to load FAISS retriever: {e}")
                cls._component_status["faiss"] = {"status": "degraded", "error": str(e)}
                cls._faiss_retriever = None
        return cls._faiss_retriever

    @classmethod
    def get_sentiment_classifier(cls):
        """Lazy loads DistilBERT sentiment classifier."""
        if cls._sentiment_classifier is None:
            try:
                from ai.sentiment_hf import sentiment_classifier
                cls._sentiment_classifier = sentiment_classifier
                cls._component_status["sentiment"] = {"status": "ok", "error": None}
            except Exception as e:
                logger.warning(f"Failed to load DistilBERT sentiment classifier: {e}")
                cls._component_status["sentiment"] = {"status": "degraded", "error": str(e)}
                cls._sentiment_classifier = None
        return cls._sentiment_classifier

    @classmethod
    def get_langgraph_agent(cls):
        """Lazy loads LangGraph stateful agent."""
        if cls._langgraph_agent is None:
            try:
                from ai.langgraph_agent import langgraph_agent
                cls._langgraph_agent = langgraph_agent
                cls._component_status["langgraph"] = {"status": "ok", "error": None}
            except Exception as e:
                logger.warning(f"Failed to load LangGraph agent: {e}")
                cls._component_status["langgraph"] = {"status": "degraded", "error": str(e)}
                cls._langgraph_agent = None
        return cls._langgraph_agent

    @classmethod
    def get_langchain_rag(cls):
        """Lazy loads LangChain LCEL RAG."""
        if cls._langchain_rag is None:
            try:
                from ai.langchain_rag import langchain_rag
                cls._langchain_rag = langchain_rag
                cls._component_status["langchain"] = {"status": "ok", "error": None}
            except Exception as e:
                logger.warning(f"Failed to load LangChain RAG: {e}")
                cls._component_status["langchain"] = {"status": "degraded", "error": str(e)}
                cls._langchain_rag = None
        return cls._langchain_rag

    @classmethod
    def get_embedding_engine(cls):
        """Lazy loads embedding search engine."""
        if cls._embedding_engine is None:
            try:
                from ml.embedding_search import embedding_engine
                cls._embedding_engine = embedding_engine
                cls._component_status["embedding"] = {"status": "ok", "error": None}
            except Exception as e:
                logger.warning(f"Failed to load embedding engine: {e}")
                cls._component_status["embedding"] = {"status": "degraded", "error": str(e)}
                cls._embedding_engine = None
        return cls._embedding_engine

    @classmethod
    def get_two_stage_pipeline(cls):
        """Lazy loads Two-Stage FAISS + SVD pipeline."""
        if cls._two_stage_pipeline is None:
            try:
                from retrieval.two_stage import two_stage_pipeline
                cls._two_stage_pipeline = two_stage_pipeline
                cls._component_status["two_stage"] = {"status": "ok", "error": None}
            except Exception as e:
                logger.warning(f"Failed to load two-stage pipeline: {e}")
                cls._component_status["two_stage"] = {"status": "degraded", "error": str(e)}
                cls._two_stage_pipeline = None
        return cls._two_stage_pipeline

    @classmethod
    def get_scratch_tfidf(cls):
        """Lazy loads from-scratch TF-IDF engine."""
        if cls._scratch_tfidf is None:
            try:
                from ai.tfidf_scratch import scratch_tfidf
                cls._scratch_tfidf = scratch_tfidf
                cls._component_status["tfidf"] = {"status": "ok" if getattr(scratch_tfidf, "ready", False) else "degraded", "error": None}
            except Exception as e:
                logger.warning(f"Failed to load scratch TF-IDF engine: {e}")
                cls._component_status["tfidf"] = {"status": "degraded", "error": str(e)}
                cls._scratch_tfidf = None
        return cls._scratch_tfidf

    @classmethod
    def get_feature_store(cls):
        """Lazy loads feature store."""
        if cls._feature_store is None:
            try:
                from feature_store.feature_store import feature_store
                cls._feature_store = feature_store
                cls._component_status["feature_store"] = {"status": "ok", "error": None}
            except Exception as e:
                logger.warning(f"Failed to load feature store: {e}")
                cls._component_status["feature_store"] = {"status": "degraded", "error": str(e)}
                cls._feature_store = None
        return cls._feature_store

    @classmethod
    def get_health_status(cls) -> Dict[str, Any]:
        """Performs non-blocking diagnostics and returns health status breakdown."""
        # Touch getters to ensure status is populated
        cls.get_svd_recommender()
        cls.get_vector_store()
        cls.get_faiss_retriever()
        cls.get_scratch_tfidf()

        statuses = {name: info["status"] for name, info in cls._component_status.items()}
        overall = "ok" if all(s in ["ok", "uninitialized"] for s in statuses.values()) else "degraded"

        return {
            "overall_status": overall,
            "components": cls._component_status,
        }


ai_service_manager = AIServiceManager
