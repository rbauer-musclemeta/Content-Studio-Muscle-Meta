from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid


# Existing models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str


# Course related models
class Course(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: str
    instructor: str
    description: str
    price: float
    original_price: Optional[float] = None
    duration: str
    lessons: int
    level: str = "All Levels"
    featured: bool = False
    pillars: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CourseCreate(BaseModel):
    title: str
    subtitle: str
    instructor: str
    description: str
    price: float
    original_price: Optional[float] = None
    duration: str
    lessons: int
    level: str = "All Levels"
    featured: bool = False
    pillars: List[str] = []


# Payment related models
class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    payment_id: Optional[str] = None
    course_id: Optional[str] = None
    user_email: Optional[str] = None
    amount: float
    currency: str = "usd"
    payment_status: str = "pending"  # pending, paid, failed, expired
    status: str = "initiated"  # initiated, completed, failed, expired
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentTransactionCreate(BaseModel):
    session_id: str
    course_id: Optional[str] = None
    user_email: Optional[str] = None
    amount: float
    currency: str = "usd"
    metadata: Dict[str, Any] = {}


# Checkout request models
class CheckoutRequest(BaseModel):
    course_id: str
    success_url: str
    cancel_url: str
    metadata: Dict[str, str] = {}

    @validator('success_url', 'cancel_url')
    def validate_urls(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URLs must start with http:// or https://')
        return v


# Newsletter related models
class Newsletter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: str
    issue_number: int
    content: Dict[str, Any]
    published_date: datetime = Field(default_factory=datetime.utcnow)
    featured: bool = False
    topics: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class NewsletterCreate(BaseModel):
    title: str
    subtitle: str
    issue_number: int
    content: Dict[str, Any]
    featured: bool = False
    topics: List[str] = []


# User engagement models
class UserEngagement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: Optional[str] = None
    session_id: Optional[str] = None
    newsletter_id: Optional[str] = None
    course_id: Optional[str] = None
    action: str  # view, share, enroll, complete, etc.
    metadata: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class UserEngagementCreate(BaseModel):
    user_email: Optional[str] = None
    session_id: Optional[str] = None
    newsletter_id: Optional[str] = None
    course_id: Optional[str] = None
    action: str
    metadata: Dict[str, Any] = {}


# ============================================
# Assessment Results Dashboard Models
# ============================================

from enum import Enum


class RiskLevel(str, Enum):
    MINIMAL = "minimal"
    LOW_MODERATE = "low-moderate"
    MODERATE_HIGH = "moderate-high"
    HIGH = "high"
    CRITICAL = "critical"


class AlertSeverity(str, Enum):
    WARNING = "warning"
    URGENT = "urgent"
    CRITICAL = "critical"


class TaskCategory(str, Enum):
    NUTRITION = "nutrition"
    EXERCISE = "exercise"
    MONITORING = "monitoring"
    MEDICAL = "medical"


class TaskDifficulty(str, Enum):
    EASY = "easy"
    MODERATE = "moderate"
    CHALLENGING = "challenging"


class DemographicData(BaseModel):
    age: int
    gender: str  # "male", "female", "other"
    height: float  # inches
    weight: float  # pounds


class SectionScores(BaseModel):
    medical_events: int = 0        # 0-85 points
    weight_loss: int = 0           # 0-85 points
    medications: int = 0           # 0-95 points
    neurological: int = 0          # 0-85 points
    functional: int = 0            # 0-85 points
    muscle_balance: int = 0        # 0-75 points
    strength: int = 0              # 0-65 points
    bone_health: int = 0           # 0-75 points
    energy_sleep: int = 0          # 0-60 points
    warning_signs: int = 0         # 0-75 points
    biomarkers: Optional[int] = 0  # Optional: 0-60 points


class PillarScores(BaseModel):
    exercise_mobility: int = 0      # Out of 100
    nutrition_metabolism: int = 0   # Out of 100
    recovery_stress: int = 0        # Out of 100
    balance_brain: int = 0          # Out of 100


class CriticalAlert(BaseModel):
    id: str
    severity: AlertSeverity
    category: str
    message: str
    action: str
    timeframe: str


class CourseCTA(BaseModel):
    title: str
    original_price: float
    launch_price: float
    url: str


class PathwayRecommendation(BaseModel):
    pillar: str
    priority: int  # 1, 2, 3, 4
    risk_score: int
    pathway: str
    description: str
    expected_outcome: str
    timeframe: str
    course_cta: CourseCTA


class Task(BaseModel):
    id: str
    category: TaskCategory
    action: str
    time_required: str
    difficulty: TaskDifficulty
    urgent: bool = False


class DailyAction(BaseModel):
    day: int
    focus: str
    tasks: List[Task]
    success_metric: str


class AssessmentResponse(BaseModel):
    question_id: str
    section_id: str
    value: Any  # string, list, or number
    score: int


class AssessmentResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    assessment_id: str
    user_id: Optional[str] = None

    # Demographics
    demographic_data: DemographicData

    # Raw Scores
    total_score: int
    max_score: int = 200
    percent_score: float
    section_scores: SectionScores

    # Risk Classification
    risk_level: RiskLevel
    risk_category: str
    percentile: int

    # Pillar Breakdown
    pillar_scores: PillarScores

    # Alerts & Flags
    critical_alerts: List[CriticalAlert] = []
    critical_flags: List[str] = []
    high_flags: List[str] = []

    # Recommendations
    pathways: List[PathwayRecommendation] = []
    action_plan: List[DailyAction] = []
    personalized_message: str = ""

    # PDF
    pdf_url: Optional[str] = None
    pdf_generated: bool = False

    # Metadata
    assessment_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AssessmentResultCreate(BaseModel):
    assessment_id: str
    user_id: Optional[str] = None
    demographic_data: DemographicData
    responses: List[AssessmentResponse]


class EmailCapture(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    assessment_id: Optional[str] = None
    first_name: Optional[str] = None
    source: str = "dashboard"
    opted_in: bool = True
    captured_at: datetime = Field(default_factory=datetime.utcnow)


class EmailCaptureCreate(BaseModel):
    email: str
    assessment_id: Optional[str] = None
    first_name: Optional[str] = None