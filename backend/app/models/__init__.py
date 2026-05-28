# Import all models here so SQLAlchemy registers them with Base.metadata
# before create_all() is called in main.py
from app.models.service import Service  # noqa: F401
from app.models.deployment import Deployment  # noqa: F401
from app.models.health_check import HealthCheck  # noqa: F401
from app.models.user import User  # noqa: F401
