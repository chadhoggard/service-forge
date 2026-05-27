from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate

router = APIRouter()


@router.get("/", response_model=List[ServiceResponse])
def list_services(db: Session = Depends(get_db)):
    services = db.query(Service).order_by(Service.created_at.desc()).all()
    return services


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: UUID, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.post("/", response_model=ServiceResponse, status_code=201)
def create_service(service_data: ServiceCreate, db: Session = Depends(get_db)):
    existing = db.query(Service).filter(Service.name == service_data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Service with this name already exists")

    service = Service(**service_data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(service_id: UUID, service_data: ServiceUpdate, db: Session = Depends(get_db)):
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
def delete_service(service_id: UUID, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    db.delete(service)
    db.commit()
    return None
