"""
CineNexus LangChain LCEL RAG Chain
LangChain Expression Language (LCEL) RAG pipeline.

Architecture:
  Query → HuggingFace Embedder → ChromaDB retriever → Prompt template → LLM → Response

Uses same chroma_db/ directory as the existing MovieVectorStore.
LCEL chains are composable and inspectable.
"""
import os
import logging
from typing import Dict, Any, List, Optional
try:
    from logging_utils import log_event
except ImportError:
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from logging_utils import log_event

try:
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.runnables import RunnablePassthrough, RunnableLambda
    from langchain_core.output_parsers import StrOutputParser
    from langchain_openai import ChatOpenAI
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

try:
    from langchain_chroma import Chroma
    LANGCHAIN_CHROMA_AVAILABLE = True
except ImportError:
    LANGCHAIN_CHROMA_AVAILABLE = False

try:
    from langchain_huggingface import HuggingFaceEmbeddings
    LANGCHAIN_HF_AVAILABLE = True
except ImportError:
    LANGCHAIN_HF_AVAILABLE = False

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")


class LangChainRAGChain:
    """
    LangChain LCEL RAG pipeline for CineNexus.

    Architecture:
      Query → HuggingFace Embedder → ChromaDB retriever → Prompt template → LLM → Response

    Uses same chroma_db/ directory as the existing MovieVectorStore.
    LCEL (LangChain Expression Language) chains are composable and inspectable.
    """
    
    def __init__(self):
        self.chain = None
        self.retriever = None
        self.vectorstore = None
        self.is_ready = False
        self.persist_dir = "./chroma_db"
        self.collection_name = "cinenexus_movies"
        self.model_name = "all-MiniLM-L6-v2"

    def build(self) -> Dict[str, Any]:
        """
        Build the LCEL RAG chain.
        """
        if not LANGCHAIN_AVAILABLE:
            return {"status": "error", "message": "langchain not installed"}
        if not LANGCHAIN_CHROMA_AVAILABLE:
            return {"status": "error", "message": "langchain-chroma not installed"}
        if not LANGCHAIN_HF_AVAILABLE:
            return {"status": "error", "message": "langchain-huggingface not installed"}
        if not EMERGENT_LLM_KEY:
            return {"status": "error", "message": "EMERGENT_LLM_KEY not set"}
        
        try:
            # Initialize embeddings
            embeddings = HuggingFaceEmbeddings(model_name=self.model_name)
            
            # Connect to existing ChromaDB
            self.vectorstore = Chroma(
                persist_directory=self.persist_dir,
                collection_name=self.collection_name,
                embedding_function=embeddings
            )
            
            # Create retriever
            self.retriever = self.vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 5}
            )
            
            # Prompt template
            prompt = ChatPromptTemplate.from_template(
                """You are CineNexus AI. Answer ONLY based on the retrieved movies below.
Do not recommend movies not listed here. Always include title, rating, and why it matches.

Retrieved Movies:
{context}

User Question: {question}

Answer:"""
            )
            
            # Initialize LLM with Emergent proxy
            llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.3,
                openai_api_key=EMERGENT_LLM_KEY,
                openai_api_base="https://api.emergentai.xyz/v1"
            )
            
            # Format documents helper
            def format_docs(docs):
                return "\n\n".join(
                    f"- {doc.metadata.get('title', 'Unknown')}: {doc.page_content[:200]}"
                    for doc in docs
                )
            
            # Build LCEL chain
            self.chain = (
                {"context": self.retriever | RunnableLambda(format_docs), "question": RunnablePassthrough()}
                | prompt
                | llm
                | StrOutputParser()
            )
            
            self.is_ready = True
            log_event(logging.INFO, "LangChain RAG chain built successfully", "langchain_rag")
            
            return {
                "status": "ready",
                "chain_type": "LangChain_LCEL_RAG",
                "retriever": "ChromaDB",
                "llm": "gpt-4o-mini"
            }
            
        except Exception as e:
            self.is_ready = False
            log_event(logging.ERROR, f"LangChain RAG chain build error: {e}", "langchain_rag")
            return {"status": "error", "message": str(e)}

    async def invoke(self, message: str) -> Dict[str, Any]:
        """
        Invoke the RAG chain with a user message.
        """
        if not self.is_ready or self.chain is None:
            build_result = self.build()
            if build_result.get("status") == "error":
                return {"response": f"Chain not ready: {build_result.get('message')}", "error": True}
        
        try:
            # Get retrieved documents for transparency
            retrieved_docs = []
            if self.retriever:
                docs = self.retriever.invoke(message)
                retrieved_docs = [
                    {
                        "title": doc.metadata.get("title", "Unknown"),
                        "score": doc.metadata.get("vote_average", 0),
                        "preview": doc.page_content[:150]
                    }
                    for doc in docs
                ]
            
            # Invoke chain
            response = await self.chain.ainvoke(message)
            
            return {
                "response": response,
                "chain_type": "LangChain_LCEL_RAG",
                "retrieved_documents": retrieved_docs,
                "retrieval_count": len(retrieved_docs)
            }
            
        except Exception as e:
            return {"response": f"Chain error: {str(e)}", "error": True}

    def get_stats(self) -> Dict[str, Any]:
        """Return chain statistics."""
        count = 0
        if self.vectorstore:
            try:
                count = self.vectorstore._collection.count()
            except:
                pass
        
        return {
            "is_ready": self.is_ready,
            "chain_type": "LangChain_LCEL_RAG",
            "embedding_model": self.model_name,
            "vector_db": "ChromaDB",
            "indexed_documents": count,
            "llm": "gpt-4o-mini"
        }


# Global instance
langchain_rag = LangChainRAGChain()
