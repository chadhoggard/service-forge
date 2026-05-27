import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class DeploymentStatus(str, enum.Enum):
    PENDING = "pending"
    BUILDING = "building"
    DEPLOYING = "deploying"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    version = Column(String(100), nullable=False)
    image_uri = Column(String(500), nullable=True)
    environment = Column(String(50), nullable=False, default="development")
    status = Column(String(20), nullable=False, default=DeploymentStatus.PENDING.value)
    commit_sha = Column(String(40), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    service = relationship("Service", back_populates="deployments")

    def __repr__(self):
        return f"<Deployment(service_id={self.service_id}, version={self.version}, status={self.status})>"
