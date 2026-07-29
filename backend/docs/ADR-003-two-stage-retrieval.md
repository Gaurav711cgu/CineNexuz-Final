# ADR-003: Two-Stage Candidate Retrieval -> Reranking

## Status
Accepted

## Context
Direct matrix factorization or exhaustive scoring over the entire catalog on every request is $O(N)$. At scale, this violates serving SLAs.

## Decision
Implement a Two-Stage Retrieval pipeline:
- **Stage 1 (Candidate Retrieval):** FAISS IVF/Flat Index performs Approximate Nearest Neighbor (ANN) search over embeddings to reduce catalog size $N$ to $K=200$ candidates in $<10\text{ms}$.
- **Stage 2 (Reranking):** SVD Collaborative Filter and Session Recency Reranker score only the top 200 candidates in $<35\text{ms}$.

## Consequences
- Reduces computational complexity from $O(N)$ to $O(K)$ where $K \ll N$.
- Preserves top-20 precision while ensuring $p99 < 50\text{ms}$ overall recommendation latency.
