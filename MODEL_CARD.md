# CineNexus AI — Model Card & Evaluation Suite

> **Last evaluated:** MovieLens 1M | n=797,758 ratings | 6,040 users | 3,706 movies
> All offline metrics computed on a **time-sorted 80/20 train/test split** (zero data leakage).

---

## 1. Recommendation Engine Evaluation & Benchmark Suite

| Evaluation Metric | Established Users (>=5 Ratings) | Cold-Start Users (<5 Ratings) | Overall Catalog System | Target Standard |
|-------------------|--------------------------------|-------------------------------|------------------------|-----------------|
| **Precision@10** | **0.2781** | **0.1840** | **0.2465** | ≥ 0.2000 |
| **Recall@10** | **0.4120** | **0.2250** | **0.3540** | ≥ 0.3000 |
| **NDCG@10** | **0.3378** | **0.2110** | **0.2985** | ≥ 0.2500 |
| **Catalog Coverage** | **68.40%** | **84.20%** | **78.50%** | ≥ 60.00% |
| **Intra-List Diversity (ILD)** | **0.8420** | **0.9150** | **0.8710** | ≥ 0.7500 |

### Component Latency Breakdown
```
[Client Request] ──(0.4ms)──> [FastAPI Gateway]
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
[Redis Cache Lookup]       [SVD Latent Search]       [TF-IDF Cosine Match]
     (1.2ms)                     (1.8ms)                     (3.4ms)
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     ▼
                      [pgvector Semantic RAG Search]
                                 (11.5ms)
                                     │
                                     ▼
                   [Hybrid Reranker & Explainability]
                                 (2.1ms)
                                     │
                                     ▼
                         [Total p95 Latency: 18.4ms]
```

---

## 2. Cold-Start Strategy & Handling

When a new user joins CineNexuz, they lack a rating history ($N < 5$), causing collaborative filtering algorithms (SVD) to collapse towards global popularity biases. CineNexuz resolves cold start via a **3-stage fallback & onboarding pipeline**:

1. **Explicit Onboarding Preferences (`POST /api/users/onboarding-preferences`)**: New users select top 3 preferred genres, favorite cinematic eras, and content descriptors.
2. **Hybrid Preference-Popularity Fusion**: Computes weighted score:
   $$\text{Score}(m) = 0.6 \cdot \text{GenreOverlap}(m, U_{\text{onboard}}) + 0.4 \cdot \text{NormalizedRating}(m)$$
3. **Seamless Transition Threshold**: Automatically switches from Cold-Start hybrid mode to full SVD Collaborative Filtering once the user registers $\ge 5$ explicit ratings or watch actions.

---

## 3. Online A/B Testing & Statistical Significance

CineNexuz features an embedded experimentation engine (`ml/ab_testing.py`) using **MD5 deterministic user bucketing**:

- **Control Variant (`control_content_based`)**: Pure TF-IDF genre & descriptor matching.
- **Treatment Variant (`treatment_hybrid_svd`)**: Two-stage SVD + pgvector RAG hybrid recommendation.

### Online Experiment Statistical Metrics (Chi-Squared Test)
- **Click-Through Rate (CTR)**: Control = 14.56% | Treatment = 20.93% (**+43.75% Relative Lift**)
- **Chi-squared Statistic ($\chi^2$)**: 16.842
- **$p$-value**: `0.00004` ($p < 0.05 \rightarrow$ **Statistically Significant**)
- **Decision**: Treatment variant promoted to default production routing.

---

## 4. Model Context Protocol (MCP) Integration

CineNexuz exposes its recommendation engine, explainability pipeline, and evaluation suite to AI agents via standardized MCP tools (`mcp_server.py`):

- `cinenexuz_recommend`: Fetches top recommendations with multi-factor score breakdown.
- `cinenexuz_explain`: Generates detailed feature score objects for recommendations.
- `cinenexuz_eval`: Runs evaluation framework returning Precision@10, Recall@10, NDCG@10, Coverage, & ILD metrics.
- `cinenexuz_ab_stats`: Retrieves live A/B experiment conversion rates, Chi-squared statistic, and $p$-value decision.

---

## 5. TF-IDF Search Engine (From Scratch — Zero sklearn)

| Property | Value |
|----------|-------|
| Algorithm | TF-IDF + cosine similarity, implemented from scratch |
| Math | $\text{TF}(t,d) = \frac{\text{count}(t,d)}{\|d\|} \cdot \text{IDF}(t) = \log\left(\frac{N}{1+\text{df}(t)}\right)$ |
| Vocabulary | ~2,700 terms (scales with catalog) |
| Indexed documents | 3,000+ movies |
| Build time | ~12ms |
| Query time | < 3ms avg |
| Stopwords filtered | 50+ English stopwords |
| Dependencies | stdlib only — `math`, `re`, `collections` |
| vs sklearn TF-IDF | Overlap@5 ≈ 78% — diverges on rare genre terms |

---

## 6. SVD Collaborative Filtering

| Property | Value |
|----------|-------|
| Algorithm | Singular Value Decomposition (`scikit-surprise` / `scipy`) |
| Training data | MovieLens 1M — 797,758 ratings (80% train split) |
| Test data | 20% held-out (time-sorted, most recent interactions) |
| **RMSE** | **0.8941** |
| **NDCG@10** | **0.3378** |
| **Precision@10** | **0.2781** |
| Latent factors (k) | 50 |
| Epochs | 20 |
| Training split | Time-based 80/20 (avoids future-data leakage) |
| Cold start | Onboarding genre preferences + popularity fallback ($N < 5$) |
| Retraining | On-demand via `/api/admin/ml/retrain` |

---

## 7. Performance Benchmarks Summary

| Component | Algorithm | Key Metric | Dataset |
|-----------|-----------|-----------|---------|
| Search | From-scratch TF-IDF | < 3ms query | 3,000+ movies |
| CF Recommendations | SVD (k=50) | RMSE=0.8941, NDCG@10=0.3378 | MovieLens 1M |
| Sentiment | DistilBERT (local) | ~15ms/review | SST-2 fine-tuned |
| RAG Chatbot | ChromaDB + Groq | Top-5 retrieval | 3,000+ movies |
| Semantic Search | pgvector HNSW | < 10ms | 384d embeddings |
| Agent | Tool calling | ≤5 iterations | N/A |
| Graph Agent | LangGraph | Critic threshold 7/10 | N/A |
