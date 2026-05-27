from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.deployment import Deployment, DeploymentStatus
from app.models.service import Service
from app.schemas.deployment import DeploymentCreate, DeploymentResponse, DeploymentUpdate

router = APIRouter()


@router.get("/service/{service_id}", response_model=List[DeploymentResponse])
def list_deployments(service_id: UUID, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    deployments = (
        db.query(Deployment)
        .filter(Deployment.service_id == service_id)
        .order_by(Deployment.created_at.desc())
        .all()
    )
    return deployments


@router.get("/{deployment_id}", response_model=DeploymentResponse)
def get_deployment(deployment_id: UUID, db: Session = Depends(get_db)):
    deployment = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment


@router.post("/", response_model=DeploymentResponse, status_code=201)
def create_deployment(deployment_data: DeploymentCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == deployment_data.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    deployment = Deployment(**deployment_data.model_dump())
    deployment.started_at = datetime.utcnow()
    db.add(deployment)
    db.commit()
    db.refresh(deployment)
    return deployment


@router.patch("/{deployment_id}", response_model=DeploymentResponse)
def update_deployment(deployment_id: UUID, deployment_data: DeploymentUpdate, db: Session = Depends(get_db)):
    deployment = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    update_data = deployment_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        # Serialize any enum to its string value before persisting
        if hasattr(value, "value"):
            value = value.value
        setattr(deployment, key, value)

    db.commit()
    db.refresh(deployment)
    return deployment


@router.post("/{deployment_id}/rollback", response_model=DeploymentResponse, status_code=201)
def rollback_deployment(deployment_id: UUID, db: Session = Depends(get_db)):
    """Create a new deployment record based on a previous successful deployment, marked as rolled_back."""
    original = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Deployment not found")

    if original.status != DeploymentStatus.SUCCEEDED.value:
        raise HTTPException(
            status_code=400,
            detail="Can only rollback to a previously succeeded deployment"
        )

    rollback_deployment = Deployment(
        service_id=original.service_id,
        version=original.version,
        image_uri=original.image_uri,
        environment=original.environment,
        status=DeploymentStatus.ROLLED_BACK.value,
        commit_sha=original.commit_sha,
        started_at=datetime.utcnow(),
        finished_at=datetime.utcnow(),
        notes=f"Rollback to deployment {original.id} (version {original.version})",
    )
    db.add(rollback_deployment)
    db.commit()
    db.refresh(rollback_deployment)
    return rollback_deployment
