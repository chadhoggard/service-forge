from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class DeploymentStatusEnum(str, Enum):
    PENDING = "pending"
    BUILDING = "building"
    DEPLOYING = "deploying"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class DeploymentCreate(BaseModel):
    service_id: UUID
    version: str = Field(..., min_length=1, max_length=100)
    image_uri: Optional[str] = None
    environment: str = Field(default="development", max_length=50)
    status: DeploymentStatusEnum = DeploymentStatusEnum.PENDING
    commit_sha: Optional[str] = Field(None, max_length=40)
    notes: Optional[str] = None


class DeploymentUpdate(BaseModel):
    status: Optional[DeploymentStatusEnum] = None
    finished_at: Optional[datetime] = None
    notes: Optional[str] = None


class DeploymentResponse(BaseModel):
    id: UUID
    service_id: UUID
    version: str
    image_uri: Optional[str]
    environment: str
    status: str
    commit_sha: Optional[str]
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TriggerDeploymentRequest(BaseModel):
    version: str = Field(..., min_length=1, max_length=100)
    environment: str = Field(..., max_length=50)
    ref: str = Field(default="main", max_length=255)
    image_uri: Optional[str] = None
    notes: Optional[str] = None


class TriggerDeploymentResponse(BaseModel):
    success: bool
    message: str
    deployment: DeploymentResponse
