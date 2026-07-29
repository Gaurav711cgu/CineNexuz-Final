FROM python:3.11-slim

# Create a non-root user with UID 1000 (recommended by Hugging Face)
RUN useradd -m -u 1000 user
WORKDIR /app

# Install torch CPU version first to minimize memory footprints
COPY requirements.txt .
RUN pip install torch==2.1.2 --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application files and change ownership to user
COPY --chown=user . .

# Switch to the non-root user
USER user
ENV HOME=/home/user
ENV PATH=/home/user/.local/bin:$PATH

# Expose the mandatory Hugging Face port
EXPOSE 7860

# Run FastAPI server on port 7860
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
