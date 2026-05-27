import time
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker, declarative_base

from app.config import DATABASE_URL

MAX_RETRIES = 5
RETRY_DELAY = 3


def _create_engine_with_retry() -> Engine:
    """Create a SQLAlchemy engine, retrying until the database is ready."""
    last_exc: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            eng = create_engine(DATABASE_URL, pool_pre_ping=True)
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            print(f"[db] Connected on attempt {attempt}.")
            return eng
        except Exception as exc:
            last_exc = exc
            if attempt < MAX_RETRIES:
                print(f"[db] Attempt {attempt} failed: {exc}. Retrying in {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)

    print(f"[db] Could not connect after {MAX_RETRIES} attempts: {last_exc}. Proceeding anyway.")
    return create_engine(DATABASE_URL, pool_pre_ping=True)


engine: Engine = _create_engine_with_retry()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
