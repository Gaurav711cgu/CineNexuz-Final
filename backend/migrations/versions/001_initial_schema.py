"""Initial schema migration: Users, Movies, Ratings, and Vector Embeddings

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-08 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS movies (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        genre VARCHAR(100),
        popularity FLOAT DEFAULT 0.0,
        vote_average FLOAT DEFAULT 0.0,
        release_date VARCHAR(50),
        synopsis TEXT
    );

    CREATE TABLE IF NOT EXISTS ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        movie_id VARCHAR(100) NOT NULL,
        rating FLOAT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """)

def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS ratings; DROP TABLE IF EXISTS movies; DROP TABLE IF EXISTS users;")
