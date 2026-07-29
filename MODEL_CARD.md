# CineNexus AI — Model Card

> **Last evaluated:** MovieLens 1M | n=797,758 ratings | 6,040 users | 3,706 movies
> All offline metrics computed on a **time-sorted 80/20 train/test split** (no data leakage).

---

## 1. TF-IDF Search Engine (From Scratch — Zero sklearn)

| Property | Value |
|----------|-------|
| Algorithm | TF-IDF + cosine similarity, implemented from scratch |
| Math | TF(t,d) = count(t,d)/\|d\| · IDF(t) = log(N/(1+df(t))) |
| Vocabulary | ~2,700 terms (scales with catalog) |
| Indexed documents | 3,000+ movies |
| Build time | ~12ms |
| Query time | < 3ms avg |
| Stopwords filtered | 50+ English stopwords |
| Dependencies | stdlib only — `math`, `re`, `collections` |
| vs sklearn TF-IDF | Overlap@5 ≈ 78% — diverges on rare genre terms |

**Why no sklearn?** Implemented from first principles to demonstrate understanding of IDF smoothing, cosine normalization, and sparse dot-product computation — not just API calls.

---

## 2. SVD Collaborative Filtering

| Property | Value |
|----------|-------|
| Algorithm | Singular Value Decomposition (scikit-surprise) |
| Training data | MovieLens 1M — 797,758 ratings (80% train split) |
| Test data | 20% held-out (time-sorted, most recent interactions) |
| **RMSE** | **0.8941** |
| **NDCG@10** | **0.3378** |
| **Precision@10** | **0.2781** |
| Latent factors (k) | 50 |
| Epochs | 20 |
| Learning rate (γ) | 0.005 |
| Regularization (λ) | 0.02 |
| Training split | Time-based 80/20 (avoids future-data leakage) |
| Cold start | Falls back to popularity when user has < 5 interactions |
| Retraining | On-demand via `/api/admin/ml/retrain` |
| Item similarity | Cosine similarity of latent factor vectors (q_i) |

**Math:**
$$\hat{r}_{u,i} = \mu + b_u + b_i + q_i^T p_u$$

Loss minimized via SGD:
$$\min \sum (r_{u,i} - \hat{r}_{u,i})^2 + \lambda(\|p_u\|^2 + \|q_i\|^2 + b_u^2 + b_i^2)$$

**Design choice:** 50 latent factors chosen as a balance between expressiveness and overfitting risk on a 1M-rating dataset. ALS was considered but SGD convergence was faster for this density.

---

## 3. Sentiment Classifier (Local DistilBERT)

| Property | Value |
|----------|-------|
| Model | distilbert-base-uncased-finetuned-sst-2-english |
| Parameters | 66M |
| Classes | POSITIVE, NEGATIVE |
| Inference | Local CPU, ~15ms/review |
| API cost | **$0.00** (no external calls) |
| Loading | Lazy-loaded on first inference |
| Batch size | 8 |
| Max tokens | 512 (with truncation) |
| Limitation | English-only |

---

## 4. RAG Chatbot Pipeline (ChromaDB + MiniLM)

| Property | Value |
|----------|-------|
| Retrieval model | all-MiniLM-L6-v2 (22M params, HuggingFace) |
| Embedding dimensions | 384 |
| Vector database | ChromaDB (persistent, HNSW cosine) |
| Indexed movies | 3,000+ |
| Generation model | Groq (llama-3.1-8b-instant) |
| Retrieval Top-K | 5 documents |
| Rebuild trigger | Auto on > 10% catalog delta |

**Design choice:** ChromaDB over Pinecone/Weaviate because it runs locally with zero egress cost and supports persistent storage. Supabase pgvector added as production alternative with HNSW index at 384d.

---

## 5. Tool-Calling Agent

| Property | Value |
|----------|-------|
| Framework | Custom tool-calling loop |
| Max iterations | 5 |
| Tools | search_movies, get_movie_details, check_streaming, get_theatre_shows, get_ai_recommendation |
| LLM | Groq llama-3.1-8b-instant |
| Tool trace | Full timing per tool, visible in AI Lab |

---

## 6. LangGraph Self-Correcting Agent

| Property | Value |
|----------|-------|
| Framework | LangGraph StateGraph |
| Topology | START → Planner → Tools → Critic → Responder |
| Critic threshold | Score ≥ 7/10 to proceed to Responder |
| Max critic iterations | 3 (prevents unbounded loops) |
| Self-correction | Loops back to Planner with feedback if score < 7 |
| LLM | Groq llama-3.1-8b-instant |

**Key concept:** The Critic node scores tool results on: relevance (+3), sufficiency (+3), completeness (+2), diversity (+2). If < 7, the Planner receives structured feedback and retries. This is analogous to RLHF reward modeling applied at inference time.

---

## 7. LangChain LCEL RAG Chain

| Property | Value |
|----------|-------|
| Framework | LangChain Expression Language (LCEL) |
| Components | HuggingFace Embeddings → ChromaDB → Prompt → LLM → Parser |
| Retriever k | 5 |

---

## 8. pgvector Semantic Search (Supabase)

| Property | Value |
|----------|-------|
| Vector DB | Supabase PostgreSQL + pgvector extension |
| Index type | HNSW (cosine distance) |
| Dimensions | 384 (all-MiniLM-L6-v2) |
| Search latency | < 10ms (HNSW approximate NN) |
| Fallback | ChromaDB local if pool unavailable |

---

## Ethical Considerations

- No user data sent to external models for training
- All HuggingFace inference is local (private by default)
- CF recommendations are opt-in (requires watch history)
- All recommendations include explanation (transparent scoring)
- A/B testing uses deterministic MD5 bucketing — users don't get randomly re-assigned per session
- Tool traces visible in AI Lab for full transparency

---

## Known Limitations

1. **CF Cold Start:** NDCG@10 = 0.34 is moderate — requires > 50 interactions before consistently outperforming popularity. Planned: BPR (Bayesian Personalized Ranking) as a cold-start complement.
2. **Sentiment English-Only:** Non-English reviews need keyword fallback.
3. **RAG Quality scales with catalog:** More movies = better retrieval diversity.
4. **Agent latency:** Max 5 iterations × LLM call ≈ 15-30s worst case. Streamed responses planned.
5. **NDCG computed on MovieLens IDs, not TMDB IDs:** Mapping is approximate.

---

## Performance Benchmarks

| Component | Algorithm | Key Metric | Dataset |
|-----------|-----------|-----------|---------|
| Search | From-scratch TF-IDF | < 3ms query | 3,000+ movies |
| CF Recommendations | SVD (k=50) | RMSE=0.89, NDCG@10=0.34 | MovieLens 1M |
| Sentiment | DistilBERT (local) | ~15ms/review | SST-2 fine-tuned |
| RAG Chatbot | ChromaDB + Groq | Top-5 retrieval | 3,000+ movies |
| Semantic Search | pgvector HNSW | < 10ms | 384d embeddings |
| Agent | Tool calling | ≤5 iterations | N/A |
| Graph Agent | LangGraph | Critic threshold 7/10 | N/A |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recommendations/collaborative` | GET | SVD-based recommendations |
| `/api/search/compare` | GET | Scratch vs sklearn TF-IDF comparison |
| `/api/ai/sentiment` | POST | DistilBERT sentiment analysis |
| `/api/ai/rag/chat` | POST | RAG-enhanced chat |
| `/api/ai/agent` | POST | Tool-calling agent |
| `/api/ai/graph-agent` | POST | LangGraph self-correcting agent |
| `/api/ai/rag-chain` | POST | LangChain LCEL RAG |
| `/api/ai/model-card` | GET | All component live metrics |
| `/api/admin/ml/cf-history` | GET | SVD training history + RMSE curve |
| `/api/admin/ml/retrain` | POST | Trigger CF retraining |
| `/api/movies/{id}/watch-providers` | GET | OTT streaming availability |
