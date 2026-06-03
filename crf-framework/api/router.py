"""CRF router for mounting into the main product backend.

This module exports a pre-configured APIRouter that can be included
in any FastAPI application to add the CRF assessment endpoints.

Usage:
    from crf_framework.api.router import crf_router
    app.include_router(crf_router, prefix="/api/crf")
"""

from fastapi import APIRouter

from api.routes.assessments import router as assessments_router
from api.routes.recommendations import router as recommendations_router
from api import __version__

# Create the main CRF router
crf_router = APIRouter(tags=["CRF Clinical Engine"])


@crf_router.get(
    "/",
    summary="CRF API info",
    description="Returns CRF API version and status.",
)
async def crf_root():
    """CRF API root endpoint."""
    return {
        "service": "Catabolic Risk Framework",
        "version": __version__,
        "status": "healthy",
        "endpoints": {
            "assess": "/assess - Full assessment with biomarkers",
            "quick_screen": "/quick-screen - Panel-first quick screening",
            "validated_instruments": "/validated-instruments - Run SARC-F, MUST, EWGSOP2",
            "recommendations": "/recommendations - Generate intervention plan",
        },
        "disclaimer": "EDUCATIONAL SCREENING AID — NOT A MEDICAL DEVICE",
    }


@crf_router.get(
    "/health",
    summary="CRF health check",
)
async def crf_health():
    """Health check for CRF service."""
    return {"status": "healthy", "service": "CRF", "version": __version__}


# Include the assessment and recommendation routes
crf_router.include_router(assessments_router)
crf_router.include_router(recommendations_router)
