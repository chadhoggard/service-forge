from datetime import datetime
from typing import List
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import config
from app.database import get_db
from app.models.deployment import Deployment, DeploymentStatus
from app.models.service import Service
from app.models.user import User
from app.schemas.deployment import TriggerDeploymentRequest, TriggerDeploymentResponse
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate
from app.utils.auth import get_current_user
from app.utils.github import parse_github_repo

router = APIRouter()


@router.get("/", response_model=List[ServiceResponse])
def list_services(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    services = db.query(Service).order_by(Service.created_at.desc()).all()
    return services


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.post("/", response_model=ServiceResponse, status_code=201)
def create_service(service_data: ServiceCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    existing = db.query(Service).filter(Service.name == service_data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Service with this name already exists")

    service = Service(**service_data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: UUID,
    service_data: ServiceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    update_data = service_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(service, key, value)

    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}", status_code=204)
def delete_service(service_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    db.delete(service)
    db.commit()
    return None


@router.post("/{service_id}/trigger-deployment", response_model=TriggerDeploymentResponse, status_code=201)
def trigger_deployment(
    service_id: UUID,
    body: TriggerDeploymentRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Dispatch a GitHub Actions workflow and record a deployment with status 'building'."""
    if not config.GITHUB_TOKEN:
        raise HTTPException(status_code=500, detail="GITHUB_TOKEN is not configured on the server")

    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    try:
        owner, repo = parse_github_repo(service.repo_url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    image_uri = body.image_uri or f"{repo}:{body.version}"
    deployment = Deployment(
        service_id=service_id,
        version=body.version,
        image_uri=image_uri,
        environment=body.environment,
        status=DeploymentStatus.BUILDING.value,
        commit_sha=None,
        started_at=datetime.utcnow(),
        notes=body.notes or "Triggered via GitHub Actions",
    )
    db.add(deployment)
    db.commit()
    db.refresh(deployment)

    gh_url = (
        f"https://api.github.com/repos/{owner}/{repo}"
        f"/actions/workflows/{config.GITHUB_WORKFLOW_FILE}/dispatches"
    )
    payload = {
        "ref": body.ref,
        "inputs": {
            "version": body.version,
            "environment": body.environment,
            "deployment_id": str(deployment.id),
        },
    }
    headers = {
        "Authorization": f"Bearer {config.GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    try:
        gh_response = httpx.post(gh_url, json=payload, headers=headers, timeout=15.0)
    except httpx.TimeoutException:
        _fail_deployment(deployment, "GitHub API request timed out", db)
        raise HTTPException(status_code=504, detail="GitHub API request timed out")
    except httpx.RequestError as exc:
        _fail_deployment(deployment, f"GitHub API connection error: {exc}", db)
        raise HTTPException(status_code=502, detail=f"GitHub API connection error: {exc}")

    if gh_response.status_code != 204:
        error_detail = _github_error_message(gh_response.status_code, owner, repo, body.ref)
        _fail_deployment(deployment, f"GitHub API error {gh_response.status_code}: {error_detail}", db)
        raise HTTPException(status_code=gh_response.status_code, detail=error_detail)

    return TriggerDeploymentResponse(
        success=True,
        message=f"GitHub Actions workflow dispatched — {owner}/{repo} @ {body.ref} ({body.version})",
        deployment=deployment,
    )


def _fail_deployment(deployment: Deployment, reason: str, db: Session) -> None:
    deployment.status = DeploymentStatus.FAILED.value
    deployment.notes = reason
    deployment.finished_at = datetime.utcnow()
    db.commit()


def _github_error_message(status_code: int, owner: str, repo: str, ref: str) -> str:
    messages = {
        401: "GitHub token is invalid or expired — check GITHUB_TOKEN",
        403: "GitHub token lacks required permissions — ensure Actions: Read/Write is granted",
        404: (
            f"Repository '{owner}/{repo}' or workflow file not found — "
            "verify GITHUB_WORKFLOW_FILE and that the repo exists"
        ),
        422: f"Invalid ref '{ref}' or workflow inputs rejected by GitHub",
    }
    return messages.get(status_code, f"GitHub returned HTTP {status_code}")
