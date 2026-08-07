# ADR-0001: Two-Tower Neural Retrieval vs LightGCN Candidate Generation

## Status
Accepted

## Context & Problem Statement
CineNexuz required a candidate retrieval architecture capable of selecting top 100 relevant items out of a catalog of 10,000,000+ movies in under 10ms. We evaluated Two-Tower Deep Learning Neural Networks (YouTube/Pinterest model) versus LightGCN Graph Neural Networks.

## Decision Drivers
- Sub-10ms $O(\log N)$ serving latency at scale.
- Cold-start handling for new items without user interaction history.
- Compatibility with Approximate Nearest Neighbor (ANN / HNSW) indexing.

## Considered Options
1. **Option 1:** PyTorch Two-Tower Deep Neural Network (User & Item Towers exporting to HNSW vectors).
2. **Option 2:** Pure LightGCN Graph Neural Network with neighborhood message passing.
3. **Option 3:** Single-stage Collaborative Filtering SVD matrix factorization.

## Decision Outcome
Chosen **Option 1 (Two-Tower Architecture)** as the primary candidate generator, supported by LightGCN for offline graph embedding enrichment.

### Positive Consequences
- Enables $O(\log N)$ Candidate Retrieval via dot-product inner product matching against HNSW vector indices.
- Decouples User and Item embedding generation, allowing Item embeddings to be pre-computed offline.
- Easily incorporates static item metadata (genres, director, actors) to eliminate cold-start item drop.

### Negative Consequences
- Requires dual-tower training pipeline and negative sampling tuning (in-batch softmax with log-Q correction).
