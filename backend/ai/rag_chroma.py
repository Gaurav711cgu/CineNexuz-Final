"""
CineNexus RAG Pipeline with ChromaDB
Semantic vector store for movie catalog with retrieval-augmented generation.

Embedding model: all-MiniLM-L6-v2 (22M params, CPU-friendly, 384-dim)
Vector DB: ChromaDB persistent (./chroma_db/)
Similarity: Cosine via HNSW index
"""
import os
import time
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
try:
    from logging_utils import log_event
except ImportError:
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from logging_utils import log_event

try:
    import chromadb
    from chromadb.config import Settings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False


class MovieVectorStore:
    """
    Semantic vector store for CineNexus movie catalog.

    Embedding model: all-MiniLM-L6-v2 (22M params, CPU-friendly, 384-dim)
    Vector DB: ChromaDB persistent (./chroma_db/)
    Similarity: Cosine via HNSW index
    Rebuild trigger: when MongoDB movie count differs from index by >10%
    """
    
    def __init__(self):
        self.embedder = None
        self.client = None
        self.collection = None
        self.is_ready = False
        self.model_name = "all-MiniLM-L6-v2"
        self.persist_dir = "./chroma_db"
        self.collection_name = "cinenexus_movies"
        self.build_time_ms = 0
        self.last_built = None

    def _init_embedder(self):
        """Initialize the sentence transformer embedder."""
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise RuntimeError("sentence-transformers not installed")
        if self.embedder is None:
            log_event(logging.INFO, f"Loading embedding model: {self.model_name}", "rag_chroma")
            self.embedder = SentenceTransformer(self.model_name)
            log_event(logging.INFO, "Embedding model loaded", "rag_chroma")

    def _init_client(self):
        """Initialize ChromaDB client."""
        if not CHROMADB_AVAILABLE:
            raise RuntimeError("chromadb not installed")
        if self.client is None:
            # Ensure persist directory exists
            os.makedirs(self.persist_dir, exist_ok=True)
            self.client = chromadb.PersistentClient(path=self.persist_dir)
            log_event(logging.INFO, f"ChromaDB client initialized at {self.persist_dir}", "rag_chroma")

    async def build(self, db, force_rebuild: bool = False) -> Dict[str, Any]:
        """
        Build or update the vector index from MongoDB movies.
        
        Args:
            db: MongoDB database connection
            force_rebuild: If True, rebuild even if counts match
        """
        start_time = time.time()
        
        try:
            self._init_embedder()
            self._init_client()
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            
            # Get current counts
            current_count = self.collection.count()
            movie_count = await db.movies.count_documents({})
            
            # Check if rebuild needed
            if not force_rebuild and current_count > 0:
                diff_ratio = abs(movie_count - current_count) / max(movie_count, 1)
                if diff_ratio < 0.1:  # Less than 10% difference
                    self.is_ready = True
                    log_event(logging.INFO, f"Vector store already up to date: {current_count} documents", "rag_chroma")
                    return {
                        "status": "up_to_date",
                        "indexed_count": current_count,
                        "mongo_count": movie_count
                    }
            
            # Fetch all movies
            movies = await db.movies.find(
                {},
                {"_id": 1, "title": 1, "overview": 1, "genres": 1, "cast_names": 1, "vote_average": 1, "tmdb_id": 1}
            ).to_list(10000)
            
            if not movies:
                return {"status": "error", "message": "No movies found in database"}
            
            # Clear existing collection if rebuilding
            if current_count > 0:
                self.client.delete_collection(self.collection_name)
                self.collection = self.client.create_collection(
                    name=self.collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
            
            # Process movies in batches
            batch_size = 100
            total_indexed = 0
            
            for i in range(0, len(movies), batch_size):
                batch = movies[i:i + batch_size]
                
                ids = []
                documents = []
                metadatas = []
                
                for movie in batch:
                    movie_id = str(movie["_id"])
                    title = movie.get("title", "")
                    overview = movie.get("overview", "")[:500]
                    genres = movie.get("genres", [])
                    cast = movie.get("cast_names", [])[:5]
                    
                    # Build document text
                    doc_text = f"{title}. Genres: {', '.join(genres)}. {overview}. Cast: {', '.join(cast)}"
                    
                    ids.append(movie_id)
                    documents.append(doc_text)
                    metadatas.append({
                        "title": title,
                        "genres_str": ", ".join(genres),
                        "vote_average": movie.get("vote_average", 0),
                        "tmdb_id": movie.get("tmdb_id", 0)
                    })
                
                # Embed batch
                embeddings = self.embedder.encode(documents, show_progress_bar=False).tolist()
                
                # Add to collection
                self.collection.add(
                    ids=ids,
                    embeddings=embeddings,
                    documents=documents,
                    metadatas=metadatas
                )
                
                total_indexed += len(batch)
            
            self.build_time_ms = int((time.time() - start_time) * 1000)
            self.last_built = datetime.now(timezone.utc)
            self.is_ready = True
            
            log_event(logging.INFO, f"Vector store ready: {total_indexed} movies indexed in {self.build_time_ms}ms", "rag_chroma")
            
            return {
                "status": "built",
                "indexed_count": total_indexed,
                "build_time_ms": self.build_time_ms,
                "model": self.model_name
            }
            
        except Exception as e:
            self.is_ready = False
            log_event(logging.ERROR, f"Vector store build error: {e}", "rag_chroma")
            return {"status": "error", "message": str(e)}

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve similar movies for a query.
        
        Returns:
            List of {"movie_id": str, "title": str, "distance": float, "vote_average": float}
        """
        if not self.is_ready or self.collection is None:
            return []
        
        try:
            # Embed query
            query_embedding = self.embedder.encode([query])[0].tolist()
            
            # Query collection
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=["metadatas", "distances", "documents"]
            )
            
            # Format results
            retrieved = []
            if results and results["ids"] and results["ids"][0]:
                for i, movie_id in enumerate(results["ids"][0]):
                    metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                    distance = results["distances"][0][i] if results["distances"] else 0
                    document = results["documents"][0][i] if results["documents"] else ""
                    
                    retrieved.append({
                        "movie_id": movie_id,
                        "title": metadata.get("title", ""),
                        "distance": round(distance, 4),
                        "vote_average": metadata.get("vote_average", 0),
                        "genres_str": metadata.get("genres_str", ""),
                        "document_preview": document[:200] if document else ""
                    })
            
            return retrieved
            
        except Exception as e:
            log_event(logging.ERROR, f"Vector retrieval error: {e}", "rag_chroma")
            return []

    def get_stats(self) -> Dict[str, Any]:
        """Return vector store statistics."""
        count = 0
        if self.collection is not None:
            try:
                count = self.collection.count()
            except:
                pass
        
        return {
            "total_indexed": count,
            "embedding_model": self.model_name,
            "embedding_dimensions": 384,
            "vector_db": "ChromaDB",
            "similarity_metric": "cosine",
            "index_type": "HNSW",
            "persist_dir": self.persist_dir,
            "is_ready": self.is_ready,
            "build_time_ms": self.build_time_ms,
            "last_built": self.last_built.isoformat() if self.last_built else None
        }


# Global instance
vector_store = MovieVectorStore()
