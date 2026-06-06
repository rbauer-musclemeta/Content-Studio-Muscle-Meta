from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime

# Import routers
from payments import payments
from admin import admin
from crf_integration import crf_router
from research import router as research_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(
    title="Muscle-Meta Matrix API",
    description="""
Backend API for the Muscle-Meta Matrix platform.

## Product Services (MongoDB)
- Courses, newsletters, Stripe payments
- User accounts, subscriptions, admin

## Clinical Engine (PostgreSQL)
- Catabolic Risk Framework (CRF) assessments
- Validated instruments: SARC-F, MUST, EWGSOP2
- Risk scoring and intervention recommendations

See /api/crf/ for clinical assessment endpoints.
""",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "mongodb": "connected",
            "payments": "active",
            "admin": "active",
            "crf": "active",
            "research": "active",
        },
        "databases": {
            "mongodb": "product data (courses, users, payments)",
            "postgresql": "clinical data (assessments, biomarkers)",
        }
    }

# Include routers in the main app
app.include_router(api_router)
app.include_router(payments)
app.include_router(admin)
app.include_router(crf_router, prefix="/api")  # CRF at /api/crf/*
app.include_router(research_router)            # Research at /api/research/*

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("Muscle-Meta Matrix API starting up...")
    logger.info("Services initialized: API, Payments, Admin, CRF Clinical Engine")
    logger.info("Databases: MongoDB (product), PostgreSQL (clinical)")

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down Muscle-Meta Matrix API...")
    client.close()