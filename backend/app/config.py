"""
Configuration settings for local-first legal triage system.
All network bindings are strictly restricted to 127.0.0.1 (loopback).
Cloud calls, remote telemetries, and external model APIs are strictly prohibited.
"""

import os
from pathlib import Path
from pydantic import BaseModel, Field


class Settings(BaseModel):
    # Network and Host Security (Strict Loopback Only)
    HOST: str = Field(default_factory=lambda: os.getenv("APP_HOST", "127.0.0.1"))
    PORT: int = Field(default_factory=lambda: int(os.getenv("APP_PORT", "8000")))
    ALLOWED_ORIGINS: list[str] = [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ]

    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "backend" / "app" / "storage" / "data"
    MODELS_DIR: Path = BASE_DIR / "models"
    DATA_DIR: Path = BASE_DIR / "data"

    # Document Ingestion limits
    MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB max
    ALLOWED_EXTENSIONS: set[str] = {".pdf", ".txt"}

    # BM25 Retrieval Configuration
    BM25_TOP_K: int = 5
    BM25_MIN_SCORE_THRESHOLD: float = 0.5
    MAX_CONTEXT_TOKENS: int = 2048

    # Local Gemma Model Runtime
    # Target: Gemma 3n E2B / E4B or edge quantized GGUF
    GEMMA_MODEL_NAME: str = "gemma-3-e2b-it"
    GEMMA_MODEL_PATH: Path = MODELS_DIR / "gemma-3-e2b-it-q4_k_m.gguf"
    GEMMA_CONTEXT_WINDOW: int = 4096
    GEMMA_MAX_OUTPUT_TOKENS: int = 1024
    GEMMA_TEMPERATURE: float = 0.0  # Greedy decoding for deterministic evidence extraction
    DEVICE: str = "cpu"  # Or "cuda" if locally available

    # Privacy and Logging
    # Logs MUST NEVER record document text, user questions, names, or model answers
    SANITIZE_LOGS: bool = True
    ENABLE_TELEMETRY: bool = False  # Hard enforced false


settings = Settings()
