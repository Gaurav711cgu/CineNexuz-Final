# C4 Model Architecture Specification for CineNexuz

This document outlines the software architecture of **CineNexuz** using the **C4 Model** (Context, Containers, Components, Code) rendered via standard Mermaid.js.

---

## 🌐 Level 1: System Context Diagram

The System Context diagram shows the high-level actors and external systems interacting with CineNexuz.

```mermaid
graph TD
    User["👤 End User / Subscriber"]
    CineNexuz["🎬 CineNexuz Platform System"]
    TMDB["🎥 TMDB Metadata API"]
    Supabase["⚡ Supabase Postgres DB"]
    Stripe["💳 Stripe Payment Gateway"]
    OpenAI["🤖 OpenAI / Groq AI APIs"]

    User -->|Browses catalog, streams video, queries AI| CineNexuz
    CineNexuz -->|Fetches movie metadata & poster URLs| TMDB
    CineNexuz -->|Persists transactional user data| Supabase
    CineNexuz -->|Processes checkout & subscription events| Stripe
    CineNexuz -->|Executes LLM RAG & sentiment analysis| OpenAI
```

---

## 📦 Level 2: Container Architecture Diagram

The Container diagram illustrates the high-level technical choices and data flow between client applications, API gateways, caches, and microservices.

```mermaid
graph TD
    Client["📱 React 18 + Vite SPA Frontend"]
    Ingress["🌐 NGINX Kubernetes Ingress (TLS)"]
    FastAPI["⚡ FastAPI API Gateway (<100L App Factory)"]
    Redis["🚀 Redis L2 Cache & Feature Store"]
    ONNX["🧠 ONNX Runtime Neural Engine (Two-Tower / SASRec)"]
    HNSW["🔍 HNSW Vector Index Swapper"]
    Mongo["🍃 MongoDB Catalog Database"]
    Postgres["🐘 PostgreSQL Transactional DB"]

    Client -->|HTTPS / WSS| Ingress
    Ingress -->|ClusterIP Port 80| FastAPI
    FastAPI -->|Singleflight Cache Query| Redis
    FastAPI -->|Async Threadpool Inference| ONNX
    FastAPI -->|KNN Vector Candidate Retrieval| HNSW
    FastAPI -->|Read/Write Movie Catalog| Mongo
    FastAPI -->|User Auth & Subscriptions| Postgres
```

---

## 🧩 Level 3: Component Architecture Diagram

The Component diagram breaks down the internal architecture of the `Recommendations APIRouter` and Multi-Stage ML Pipeline.

```mermaid
graph TD
    RecRouter["GET /api/v1/recommendations"]
    TwoStagePipe["retrieval/two_stage.py Pipeline"]
    TwoTower["ml/two_tower.py Candidate Generator"]
    SVD["ai/cf_svd.py Collaborative Filtering"]
    MMR["ml/mmr_reranker.py Diversity Reranker"]
    Explain["ml/explainability.py Feature Attribution"]

    RecRouter --> TwoStagePipe
    TwoStagePipe -->|Retrieve Top 100 Candidates| TwoTower
    TwoStagePipe -->|Retrieve Top 100 Candidates| SVD
    TwoStagePipe -->|Diversify Top 10 Items| MMR
    RecRouter -->|Annotate Feature Importance| Explain
```
