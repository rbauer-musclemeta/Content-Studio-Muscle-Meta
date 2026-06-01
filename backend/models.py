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


# Knowledge Base models
KB_CATEGORIES = [
    "muscle-strength",
    "metabolic-health",
    "sleep-recovery",
    "sport-performance",
    "physical-therapy",
    "exercise-science",
    "evidence-based",
    "general"
]

class ArticleRelationship(BaseModel):
    target_id: str
    target_title: str
    relation_type: str  # supports | contradicts | extends | part-of | instance-of | related

class KnowledgeArticle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    summary: Optional[str] = None
    category: str = "general"
    tags: List[str] = []
    source_type: str = "manual"  # manual, upload, newsletter
    source_reference: Optional[str] = None
    word_count: int = 0
    # PAI-inspired workflow fields
    status: str = "draft"  # draft | pending_review | verified | approved
    extracted_insights: Optional[List[str]] = None
    insights_approved: bool = False
    relationships: List[ArticleRelationship] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    verified_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None

class KnowledgeArticleCreate(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    category: str = "general"
    tags: List[str] = []
    source_type: str = "manual"
    source_reference: Optional[str] = None

class KBStatusUpdate(BaseModel):
    status: str  # draft | pending_review | verified | approved

class ArticleRelationshipCreate(BaseModel):
    target_id: str
    target_title: str
    relation_type: str

class KBQuery(BaseModel):
    question: str
    category: Optional[str] = None
    max_context_articles: int = 5

# Randy's Telos — clinical identity and mission (PAI-inspired)
class RandyTelos(BaseModel):
    mission: str = ""
    clinical_philosophy: str = ""
    expertise_domains: List[str] = []
    professional_goals: List[str] = []
    evidence_principles: List[str] = []
    content_guidelines: str = ""
    updated_at: datetime = Field(default_factory=datetime.utcnow)