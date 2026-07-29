"""
CineNexus AI Module
Exports all AI components for use in server.py
"""

from .cf_svd import CollaborativeFilteringEngine, cf_engine
from .tfidf_scratch import ScratchTFIDF, scratch_tfidf
from .sentiment_hf import SentimentClassifier, sentiment_classifier
from .rag_chroma import MovieVectorStore, vector_store
from .agent_tools import CineNexusAgent, cinenexus_agent, CINENEXUS_TOOLS
from .evals import EvalRunner, eval_runner, EVAL_DATASET
from .langchain_rag import LangChainRAGChain, langchain_rag
from .langgraph_agent import LangGraphAgent, langgraph_agent

__all__ = [
    # Collaborative Filtering
    "CollaborativeFilteringEngine",
    "cf_engine",
    # TF-IDF
    "ScratchTFIDF",
    "scratch_tfidf",
    # Sentiment
    "SentimentClassifier",
    "sentiment_classifier",
    # RAG
    "MovieVectorStore",
    "vector_store",
    # Agent
    "CineNexusAgent",
    "cinenexus_agent",
    "CINENEXUS_TOOLS",
    # Evals
    "EvalRunner",
    "eval_runner",
    "EVAL_DATASET",
    # LangChain
    "LangChainRAGChain",
    "langchain_rag",
    # LangGraph
    "LangGraphAgent",
    "langgraph_agent",
]
