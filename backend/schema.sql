-- CineNexuz Unified PostgreSQL & pgvector Schema Specification
-- Enable the pgvector extension for high-performance dense embedding semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Users & Profiles (Clerk/Supabase Auth Integration) ──
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY, -- Clerk User ID reference
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    pin VARCHAR(4) DEFAULT NULL, -- Netflix-style Profile Lock PIN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. Movie Catalog Schema ──
CREATE TABLE IF NOT EXISTS movies (
    tmdb_id INT PRIMARY KEY, -- Standard TMDB Unique ID
    title VARCHAR(255) NOT NULL,
    release_date DATE,
    overview TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    genres TEXT[] DEFAULT '{}',
    vote_average DOUBLE PRECISION DEFAULT 0.0,
    runtime INT DEFAULT 0,
    original_language VARCHAR(10) DEFAULT 'en',
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. pgvector Dense Semantic Embedding Store ──
CREATE TABLE IF NOT EXISTS movie_embeddings (
    movie_id INT PRIMARY KEY REFERENCES movies(tmdb_id) ON DELETE CASCADE,
    embedding vector(384) NOT NULL -- 384 dimensions matching all-MiniLM-L6-v2 model
);

-- Create a high-performance Hierarchical Navigable Small World (HNSW) vector index
-- This optimizes cosine similarity lookup times from O(N) to O(log N) at scale
CREATE INDEX IF NOT EXISTS movie_embeddings_hnsw_idx 
ON movie_embeddings USING hnsw (embedding vector_cosine_ops);

-- ── 4. Profile Activity & Watch Logs (Multi-Profile Support) ──
CREATE TABLE IF NOT EXISTS profile_history (
    id SERIAL PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    movie_id INT NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
    progress_seconds INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_watched TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, movie_id)
);

CREATE TABLE IF NOT EXISTS profile_watchlist (
    id SERIAL PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    movie_id INT NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, movie_id)
);

-- ── 5. Ratings Store (Collaborative Filtering Feed for SVD Model) ──
CREATE TABLE IF NOT EXISTS profile_ratings (
    id SERIAL PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    movie_id INT NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
    rating DOUBLE PRECISION NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
    rated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, movie_id)
);

-- Create standard indexes for relational queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_history_profile_id ON profile_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_profile_id ON profile_watchlist(profile_id);
CREATE INDEX IF NOT EXISTS idx_ratings_profile_id ON profile_ratings(profile_id);
