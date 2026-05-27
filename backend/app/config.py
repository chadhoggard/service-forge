import os

from dotenv import load_dotenv

load_dotenv()

def _build_database_url() -> str:
    # If a full DATABASE_URL is provided (local Docker Compose), use it directly
    if url := os.getenv("DATABASE_URL"):
        return url
    # Otherwise assemble from individual vars injected by ECS / Secrets Manager
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "serviceforge")
    user = os.getenv("DB_USERNAME", "serviceforge")
    password = os.getenv("DB_PASSWORD", "serviceforge")
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"

DATABASE_URL: str = _build_database_url()

GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
GITHUB_WORKFLOW_FILE: str = os.getenv("GITHUB_WORKFLOW_FILE", "deploy.yml")
