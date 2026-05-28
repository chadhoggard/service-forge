from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
import app.models  # noqa: F401 — registers all ORM models with Base.metadata
from app.routes import auth, deployments, health_checks, services

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ServiceForge API",
    description="Self-service deployment platform for containerized applications.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend:3000",
        "http://serviceforge-production-alb-1977889151.us-east-1.elb.amazonaws.com",
        "https://serviceforge.dev",
        "https://www.serviceforge.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(deployments.router, prefix="/api/deployments", tags=["Deployments"])
app.include_router(health_checks.router, prefix="/api/health-checks", tags=["Health Checks"])


@app.get("/api/health", tags=["Meta"])
def api_health():
    """Liveness probe."""
    return {"status": "healthy", "service": "serviceforge-api"}
