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

-- Add Role-Based Access Control (RBAC) support to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Compound index for the most common query pattern: genre + sort by vote_average
CREATE INDEX IF NOT EXISTS idx_movies_genre_vote ON movies USING GIN (genres) WHERE vote_average > 6.0;

-- Language filtering (exact match) + popularity sorting
CREATE INDEX IF NOT EXISTS idx_movies_language_popularity ON movies(original_language, vote_average DESC);

-- Watch history: most common query is profile history, newest first
CREATE INDEX IF NOT EXISTS idx_profile_history_profile_watched ON profile_history(profile_id, last_watched DESC);

-- Watchlist: common pattern is EXISTS check
CREATE INDEX IF NOT EXISTS idx_watchlist_profile_movie ON profile_watchlist(profile_id, movie_id);

-- Ratings for CF model: fast profile ratings retrieval
CREATE INDEX IF NOT EXISTS idx_ratings_profile ON profile_ratings(profile_id, rated_at DESC);

-- Full text search on movie titles and overviews using tsvector
ALTER TABLE movies ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_movies_fts ON movies USING GIN (search_vector);

-- Trigger function to keep search_vector updated automatically
CREATE OR REPLACE FUNCTION update_movie_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.overview, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_search_vector_trigger ON movies;
CREATE TRIGGER update_search_vector_trigger
    BEFORE INSERT OR UPDATE ON movies
    FOR EACH ROW EXECUTE FUNCTION update_movie_search_vector();

-- Standard relational indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_history_profile_id ON profile_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_profile_id ON profile_watchlist(profile_id);
CREATE INDEX IF NOT EXISTS idx_ratings_profile_id ON profile_ratings(profile_id);

-- ── 6. Advanced SQL Concept 1: Materialized Views with Concurrent Refresh ──
-- Pre-computes genre rating averages and total engagement counts for fast analytics queries
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_genre_popularity_stats AS
SELECT 
    g.genre,
    COUNT(m.tmdb_id) AS total_movies,
    ROUND(AVG(m.vote_average)::numeric, 2) AS avg_vote,
    SUM(m.runtime) AS total_runtime_minutes
FROM (
    SELECT DISTINCT unnest(genres) AS genre FROM movies
) g
JOIN movies m ON g.genre = ANY(m.genres)
GROUP BY g.genre;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_genre_stats_genre ON mv_genre_popularity_stats(genre);

-- ── 7. Advanced SQL Concept 2: Window Functions (ROW_NUMBER & RANK) ──
-- Fetches top-ranked movies per genre using SQL Windowing (PARTITION BY genre ORDER BY vote_average)
CREATE OR REPLACE VIEW v_top_movies_per_genre AS
WITH ranked_movies AS (
    SELECT 
        m.tmdb_id,
        m.title,
        m.vote_average,
        m.original_language,
        g.genre,
        ROW_NUMBER() OVER (PARTITION BY g.genre ORDER BY m.vote_average DESC, m.popularity DESC) AS genre_rank
    FROM movies m,
    UNNEST(m.genres) AS g(genre)
    WHERE m.vote_average > 0
)
SELECT tmdb_id, title, vote_average, original_language, genre, genre_rank
FROM ranked_movies
WHERE genre_rank <= 10;

-- ── 8. Advanced SQL Concept 3: Recursive Common Table Expressions (Recursive CTEs) ──
-- Navigates movie collection franchise hierarchies (prequels / sequels / spin-offs)
CREATE OR REPLACE VIEW v_movie_franchise_tree AS
WITH RECURSIVE franchise_tree AS (
    -- Anchor member: root movie
    SELECT 
        tmdb_id, 
        title, 
        release_date,
        1 AS timeline_depth,
        ARRAY[tmdb_id] AS path
    FROM movies
    WHERE tmdb_id = 1517102 OR tmdb_id = 550
    
    UNION ALL
    
    -- Recursive member: fetch dependent sequels
    SELECT 
        m.tmdb_id, 
        m.title, 
        m.release_date,
        ft.timeline_depth + 1,
        ft.path || m.tmdb_id
    FROM movies m
    JOIN franchise_tree ft ON m.release_date > ft.release_date
    WHERE ft.timeline_depth < 5 AND m.genres && (SELECT genres FROM movies WHERE tmdb_id = ft.tmdb_id)
)
SELECT * FROM franchise_tree;

