import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    repo_url = Column(String(500), nullable=False)
    environment = Column(String(50), nullable=False, default="development")
    health_check_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    deployments = relationship("Deployment", back_populates="service", cascade="all, delete-orphan")
    health_checks = relationship("HealthCheck", back_populates="service", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Service(name={self.name}, env={self.environment})>"
