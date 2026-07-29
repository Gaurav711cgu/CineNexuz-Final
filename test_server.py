#!/usr/bin/env python3
"""
Simple test server to check if basic FastAPI is working
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CineNexus Test API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "CineNexus Test API is running"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "message": "Test server is working"}

@app.post("/api/auth/bypass")
async def bypass_login():
    return {"token": "test_token", "user": {"id": "test", "email": "test@test.com", "name": "Test User", "role": "user"}}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)