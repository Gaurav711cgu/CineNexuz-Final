FROM python:3.11-slim

# ── Layer 1: System dependencies ──
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Layer 2: Non-root user (HuggingFace + security best practice) ──
RUN useradd -m -u 1000 user
WORKDIR /app

# ── Layer 3: Install PyTorch CPU first (heavy layer, cached separately) ──
COPY requirements.txt .
RUN pip install --no-cache-dir torch==2.1.2 --index-url https://download.pytorch.org/whl/cpu

# ── Layer 4: Install all remaining dependencies ──
RUN pip install --no-cache-dir -r requirements.txt

# ── Layer 5: Copy application code + change ownership ──
COPY --chown=user . .

# ── Layer 6: Switch to non-root user ──
USER user
ENV HOME=/home/user
ENV PATH=/home/user/.local/bin:$PATH

# ── PORT: configurable via env — 7860 for HuggingFace, 8001 for local Docker ──
# Default to 7860 so HuggingFace Space works without any config
ENV PORT=7860
EXPOSE ${PORT}

# ── Health check for Docker Compose orchestration ──
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# ── Entrypoint: reads PORT env at runtime ──
CMD uvicorn server:app --host 0.0.0.0 --port ${PORT} --workers 1
