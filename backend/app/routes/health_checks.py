import time
from datetime import datetime
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.health_check import HealthCheck
from app.models.service import Service
from app.models.user import User
from app.schemas.health_check import HealthCheckResponse
from app.utils.auth import get_current_user

router = APIRouter()


@router.post("/service/{service_id}", response_model=HealthCheckResponse, status_code=201)
def check_service_health(service_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Perform a health check on the service's health check URL."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    if not service.health_check_url:
        raise HTTPException(status_code=400, detail="Service does not have a health check URL configured")

    status = "unhealthy"
    response_time_ms = None

    try:
        start = time.time()
        response = httpx.get(service.health_check_url, timeout=10.0)
        elapsed = (time.time() - start) * 1000
        response_time_ms = f"{elapsed:.0f}"
        status = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        status = "unhealthy"
        response_time_ms = None

    health_check = HealthCheck(
        service_id=service_id,
        status=status,
        response_time_ms=response_time_ms,
        checked_at=datetime.utcnow(),
    )
    db.add(health_check)
    db.commit()
    db.refresh(health_check)
    return health_check


@router.get("/service/{service_id}/latest", response_model=HealthCheckResponse)
def get_latest_health_check(service_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Get the latest health check result for a service."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    health_check = (
        db.query(HealthCheck)
        .filter(HealthCheck.service_id == service_id)
        .order_by(HealthCheck.checked_at.desc())
        .first()
    )
    if not health_check:
        raise HTTPException(status_code=404, detail="No health check records found for this service")

    return health_check
