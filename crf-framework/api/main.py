"""FastAPI application for the Catabolic Risk Framework (CRF) API.

This module provides the main FastAPI application instance with CORS
configuration, health endpoints, and route registration.

Run with:
    uvicorn api.main:app --reload

Or from the crf-framework directory:
    python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
"""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import __version__
from api.routes.assessments import router as assessments_router
from api.routes.recommendations import router as recommendations_router
from api.schemas import ErrorResponse, HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan handler for startup/shutdown events."""
    # Startup: Initialize calculator and recommendation engine eagerly
    from api.dependencies import get_calculator, get_recommendation_engine

    get_calculator()
    get_recommendation_engine()
    yield
    # Shutdown: Clean up resources if needed


app = FastAPI(
    title="Catabolic Risk Framework API",
    description="""
## Muscle-Meta Matrix Assessment API

The Catabolic Risk Framework (CRF) API provides clinical intelligence for
active aging through validated screening instruments and risk assessment.

### Core Features

- **Validated Screening Instruments**: SARC-F, MUST, EWGSOP2
- **Panel-First Output**: Validated instruments are the headline
- **Comprehensive Risk Assessment**: 22 risk factors across 6 categories
- **Personalized Recommendations**: Prioritized intervention plans

### Assessment Endpoints

- **POST /assessments/assess**: Full assessment with optional biomarkers
- **POST /assessments/quick-screen**: Quick screening with panel-first output
- **POST /assessments/validated-instruments**: Run validated instruments only
- **POST /recommendations**: Generate intervention plan

### Validated Instruments

| Instrument | Purpose | Citation |
|------------|---------|----------|
| SARC-F | Sarcopenia screening | Malmstrom & Morley 2013 |
| MUST | Malnutrition screening | BAPEN 2003 |
| EWGSOP2 | Sarcopenia diagnosis | Cruz-Jentoft et al. 2019 |

### 5-Tier Risk Stratification

| Tier | Score Range | Label |
|------|-------------|-------|
| 1 | 0-20% | Optimal / Minimal Risk |
| 2 | 21-40% | Functional / Low Risk |
| 3 | 41-60% | Declining / Moderate Risk |
| 4 | 61-80% | At Risk / High Risk |
| 5 | 81-100% | Critical / Severe Risk |

---

**DISCLAIMER**: This is an EDUCATIONAL SCREENING AID, not a medical device.
Outputs are not validated against clinical outcomes and must not be used to
diagnose, treat, or rule out any condition. Consult a qualified healthcare
professional for medical advice.

---

Created by Randy Bauer, PT — Muscle-Meta Matrix
""",
    version=__version__,
    contact={
        "name": "Randy Bauer, PT",
        "email": "rbauer@bauerpt.com",
    },
    license_info={
        "name": "Proprietary",
    },
    lifespan=lifespan,
    responses={
        422: {
            "model": ErrorResponse,
            "description": "Validation Error",
        },
        500: {
            "model": ErrorResponse,
            "description": "Internal Server Error",
        },
    },
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://musclemetamatrix.com",  # Production
        "https://www.musclemetamatrix.com",
        "https://app.musclemetamatrix.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register routers
app.include_router(assessments_router)
app.include_router(recommendations_router)


@app.get(
    "/",
    response_model=HealthResponse,
    summary="API root",
    description="Returns basic API information and health status.",
    tags=["Health"],
)
async def root() -> HealthResponse:
    """API root endpoint."""
    return HealthResponse(
        status="healthy",
        version=__version__,
        service="Catabolic Risk Framework API",
    )


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns the health status of the API service.",
    tags=["Health"],
)
async def health_check() -> HealthResponse:
    """Health check endpoint for monitoring and load balancers."""
    return HealthResponse(
        status="healthy",
        version=__version__,
        service="Catabolic Risk Framework API",
    )


@app.get(
    "/ready",
    response_model=HealthResponse,
    summary="Readiness check",
    description="Returns whether the API is ready to accept requests.",
    tags=["Health"],
)
async def readiness_check() -> HealthResponse:
    """Readiness check endpoint for Kubernetes probes."""
    # Could add checks for database connections, external services, etc.
    return HealthResponse(
        status="ready",
        version=__version__,
        service="Catabolic Risk Framework API",
    )
