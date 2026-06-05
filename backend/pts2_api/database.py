"""Database configuration and session management."""

from __future__ import annotations

import os
from typing import Generator
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Load .env variables
load_dotenv()

# Database configuration from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://gasnova:gasnova_secret@postgres:5432/gasnovalocal",
)

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=10,
    max_overflow=20,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for FastAPI to provide database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)
