"""
CineNexus TF-IDF From Scratch
TF-IDF implementation from first principles — zero sklearn dependency.

Math:
  TF(t,d)  = count(t in d) / total_terms(d)
  IDF(t)   = log(N / (1 + df(t)))   [smoothed to avoid division by zero]
  TF-IDF   = TF * IDF
  Sim      = cosine similarity (dot product of L2-normalized vectors)

Built to demonstrate understanding of information retrieval fundamentals.
"""
import math
import time
import re
from collections import Counter
from typing import List, Dict, Tuple, Any


class ScratchTFIDF:
    """
    TF-IDF implementation from first principles — zero sklearn dependency.

    Vocabulary: uncapped | Stopwords: hardcoded top-50 English
    """
    
    STOPWORDS = {
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
        "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did",
        "not", "this", "that", "it", "its", "from", "by", "as", "into", "than", "then",
        "so", "if", "up", "out", "no", "we", "he", "she", "they", "you", "i", "my", "your",
        "his", "her", "their", "who", "which", "what", "when", "where", "why", "how",
        "all", "each", "every", "both", "few", "more", "most", "other", "some", "such",
        "only", "own", "same", "very", "can", "will", "just", "should", "now", "also"
    }

    def __init__(self):
        self.vocabulary = {}        # term -> index
        self.idf_scores = {}        # term -> IDF score
        self.doc_vectors = []       # list of sparse {term_idx: tfidf_score} dicts
        self.doc_ids = []           # parallel list of movie _id strings
        self.doc_norms = []         # L2 norm per document (for fast cosine)
        self.ready = False
        self.build_time_ms = 0
        self.doc_texts = []         # Store original texts for debugging

    def _tokenize(self, text: str) -> List[str]:
        """
        Tokenize text: lowercase, remove non-alpha chars, filter stopwords.
        """
        if not text:
            return []
        # Lowercase and extract words
        text = text.lower()
        # Keep only alphanumeric and spaces
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        # Split on whitespace
        tokens = text.split()
        # Filter: len >= 2, not in STOPWORDS
        return [t for t in tokens if len(t) >= 2 and t not in self.STOPWORDS]

    def _compute_tf(self, tokens: List[str]) -> Dict[str, float]:
        """
        Compute term frequency for a document.
        TF(t,d) = count(t in d) / total_terms(d)
        """
        if not tokens:
            return {}
        counts = Counter(tokens)
        total = len(tokens)
        return {term: count / total for term, count in counts.items()}

    def build_index(self, documents: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Build TF-IDF index from documents.
        
        Args:
            documents: List of {"_id": str, "text": str}
        
        Returns:
            Build statistics
        """
        start_time = time.time()
        
        if not documents:
            self.ready = False
            return {"status": "error", "message": "No documents provided"}
        
        # Reset state
        self.vocabulary = {}
        self.idf_scores = {}
        self.doc_vectors = []
        self.doc_ids = []
        self.doc_norms = []
        self.doc_texts = []
        
        # 1. Tokenize all documents and build vocabulary + document frequency
        all_doc_tokens = []
        df_counts = Counter()  # document frequency per term
        vocab_set = set()
        
        for doc in documents:
            doc_id = doc.get("_id", "")
            text = doc.get("text", "")
            tokens = self._tokenize(text)
            
            all_doc_tokens.append(tokens)
            self.doc_ids.append(doc_id)
            self.doc_texts.append(text[:200])  # Store preview
            
            # Unique terms in this document
            unique_terms = set(tokens)
            for term in unique_terms:
                df_counts[term] += 1
                vocab_set.add(term)
        
        N = len(documents)
        
        # 2. Build vocabulary (term -> index)
        self.vocabulary = {term: idx for idx, term in enumerate(sorted(vocab_set))}
        
        # 3. Compute IDF scores: log(N / (1 + df[term]))
        self.idf_scores = {
            term: math.log(N / (1 + df_counts[term]))
            for term in vocab_set
        }
        
        # 4. Compute TF-IDF vectors for each document
        for tokens in all_doc_tokens:
            tf = self._compute_tf(tokens)
            
            # Sparse vector: {term_idx: tfidf_score}
            sparse_vec = {}
            for term, tf_val in tf.items():
                if term in self.vocabulary:
                    idx = self.vocabulary[term]
                    tfidf = tf_val * self.idf_scores[term]
                    sparse_vec[idx] = tfidf
            
            self.doc_vectors.append(sparse_vec)
        
        # 5. Compute L2 norms for each document
        for vec in self.doc_vectors:
            norm = math.sqrt(sum(v * v for v in vec.values())) if vec else 1.0
            self.doc_norms.append(norm if norm > 0 else 1.0)
        
        # 6. Normalize vectors (pre-compute for faster search)
        for i, vec in enumerate(self.doc_vectors):
            norm = self.doc_norms[i]
            self.doc_vectors[i] = {idx: val / norm for idx, val in vec.items()}
        
        self.ready = True
        self.build_time_ms = int((time.time() - start_time) * 1000)
        
        print(f"Scratch TF-IDF index built: {N} docs, {len(self.vocabulary)} terms, {self.build_time_ms}ms")
        
        return {
            "status": "ready",
            "documents": N,
            "vocabulary_size": len(self.vocabulary),
            "build_time_ms": self.build_time_ms
        }

    def search(self, query: str, top_n: int = 20) -> List[Tuple[str, float]]:
        """
        Search for documents matching query.
        
        Returns:
            List of (doc_id, score) tuples, sorted by score descending
        """
        if not self.ready:
            return []
        
        start_time = time.time()
        
        # 1. Tokenize query
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []
        
        # 2. Build query TF-IDF vector
        query_tf = self._compute_tf(query_tokens)
        query_vec = {}
        for term, tf_val in query_tf.items():
            if term in self.vocabulary:
                idx = self.vocabulary[term]
                # Use stored IDF (unknown terms are ignored)
                tfidf = tf_val * self.idf_scores.get(term, 0)
                query_vec[idx] = tfidf
        
        if not query_vec:
            return []
        
        # 3. L2-normalize query vector
        query_norm = math.sqrt(sum(v * v for v in query_vec.values()))
        if query_norm > 0:
            query_vec = {idx: val / query_norm for idx, val in query_vec.items()}
        
        # 4. Compute cosine similarity with each document
        # Since both vectors are normalized, cosine = dot product
        results = []
        for i, doc_vec in enumerate(self.doc_vectors):
            # Sparse dot product
            dot = sum(query_vec.get(idx, 0) * val for idx, val in doc_vec.items())
            if dot > 0:
                results.append((self.doc_ids[i], dot))
        
        # 5. Sort and return top_n
        results.sort(key=lambda x: x[1], reverse=True)
        
        search_time = int((time.time() - start_time) * 1000)
        
        return results[:top_n]

    def get_stats(self) -> Dict[str, Any]:
        """Return index statistics."""
        return {
            "vocabulary_size": len(self.vocabulary),
            "indexed_documents": len(self.doc_ids),
            "algorithm": "from_scratch_tfidf",
            "similarity_metric": "cosine",
            "normalization": "L2",
            "build_time_ms": self.build_time_ms,
            "ready": self.ready,
            "stopwords_count": len(self.STOPWORDS)
        }

    def get_top_idf_terms(self, n: int = 20) -> List[Dict[str, Any]]:
        """Get terms with highest IDF scores (most distinctive)."""
        sorted_terms = sorted(self.idf_scores.items(), key=lambda x: x[1], reverse=True)
        return [
            {"term": term, "idf": round(idf, 4)}
            for term, idf in sorted_terms[:n]
        ]


# Global instance
scratch_tfidf = ScratchTFIDF()
