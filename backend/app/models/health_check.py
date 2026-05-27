import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class HealthCheck(Base):
    __tablename__ = "health_checks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    status = Column(String(20), nullable=False)  # healthy, unhealthy
    response_time_ms = Column(String(20), nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)

    service = relationship("Service", back_populates="health_checks")

    def __repr__(self):
        return f"<HealthCheck(service_id={self.service_id}, status={self.status})>"
