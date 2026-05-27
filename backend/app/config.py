import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql://serviceforge:serviceforge@localhost:5432/serviceforge",
)
