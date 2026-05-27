from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    repo_url: str = Field(..., min_length=1, max_length=500)
    environment: str = Field(default="development", max_length=50)
    health_check_url: Optional[str] = None
    description: Optional[str] = None


class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    repo_url: Optional[str] = Field(None, max_length=500)
    environment: Optional[str] = Field(None, max_length=50)
    health_check_url: Optional[str] = None
    description: Optional[str] = None


class ServiceResponse(BaseModel):
    id: UUID
    name: str
    repo_url: str
    environment: str
    health_check_url: Optional[str]
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
