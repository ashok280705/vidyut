"""
VIDYUT Backend — FastAPI Application
AI-powered Smart Electricity Intelligence Platform
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.api import router as api_router
from app.db.supabase import init_supabase

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup."""
    init_supabase()
    print("[VIDYUT] Backend started successfully")
    yield
    print("[VIDYUT] Backend shutting down")

app = FastAPI(
    title="VIDYUT API",
    description="AI-Powered Smart Electricity Intelligence Platform for BESCOM",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "vidyut-backend", "version": "2.0.0"}
