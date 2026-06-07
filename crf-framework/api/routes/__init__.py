"""API route modules."""

from api.routes.assessments import router as assessments_router
from api.routes.recommendations import router as recommendations_router

__all__ = ["assessments_router", "recommendations_router"]
