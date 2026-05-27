from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
import app.models  # noqa: F401 — registers all ORM models with Base.metadata
from app.routes import services, deployments, health_checks

# Create tables on startup (no-op if they already exist)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ServiceForge API",
    description="Self-service deployment platform for containerized applications.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(deployments.router, prefix="/api/deployments", tags=["Deployments"])
app.include_router(health_checks.router, prefix="/api/health-checks", tags=["Health Checks"])


@app.get("/api/health", tags=["Meta"])
def api_health():
    """Liveness probe."""
    return {"status": "healthy", "service": "serviceforge-api"}
