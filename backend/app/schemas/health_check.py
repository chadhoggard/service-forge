from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class HealthCheckResponse(BaseModel):
    id: UUID
    service_id: UUID
    status: str
    response_time_ms: Optional[str]
    checked_at: datetime

    class Config:
        from_attributes = True
