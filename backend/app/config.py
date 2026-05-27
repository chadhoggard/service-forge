import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql://serviceforge:serviceforge@localhost:5432/serviceforge",
)

GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
GITHUB_WORKFLOW_FILE: str = os.getenv("GITHUB_WORKFLOW_FILE", "deploy.yml")
