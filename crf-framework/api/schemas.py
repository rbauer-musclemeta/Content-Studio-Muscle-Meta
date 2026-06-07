"""Pydantic models for API request/response schemas.

These schemas define the data contracts for the CRF API, translating
between the API layer and the internal CRF models.
"""

from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# Enums
# -----------------------------------------------------------------------------


class SexInput(str, Enum):
    """Biological sex for risk calculations."""

    MALE = "male"
    FEMALE = "female"


class ActivityLevelInput(str, Enum):
    """Physical activity level classification."""

    SEDENTARY = "sedentary"
    LIGHT = "light"
    MODERATE = "moderate"
    ACTIVE = "active"
    VERY_ACTIVE = "very_active"


class RiskLevelOutput(str, Enum):
    """Risk level classification in response."""

    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"


class RecommendationPriorityOutput(str, Enum):
    """Priority level for recommendations."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RecommendationCategoryOutput(str, Enum):
    """Category of recommendation."""

    NUTRITION = "nutrition"
    EXERCISE = "exercise"
    MEDICAL = "medical"
    LIFESTYLE = "lifestyle"
    MONITORING = "monitoring"


# -----------------------------------------------------------------------------
# Input Schemas
# -----------------------------------------------------------------------------


class SarcFInput(BaseModel):
    """SARC-F questionnaire responses for sarcopenia screening.

    Each item is scored 0 (no difficulty), 1 (some difficulty), or 2 (a lot/unable).
    """

    strength: int = Field(
        ...,
        ge=0,
        le=2,
        description="Difficulty lifting/carrying ~4.5 kg (10 lb): 0=none, 1=some, 2=a lot/unable",
    )
    assistance_walking: int = Field(
        ...,
        ge=0,
        le=2,
        description="Difficulty walking across a room: 0=none, 1=some, 2=a lot/unable",
    )
    rising_from_chair: int = Field(
        ...,
        ge=0,
        le=2,
        description="Difficulty transferring from chair/bed: 0=none, 1=some, 2=a lot/unable",
    )
    climbing_stairs: int = Field(
        ...,
        ge=0,
        le=2,
        description="Difficulty climbing 10 stairs: 0=none, 1=some, 2=a lot/unable",
    )
    falls: int = Field(
        ...,
        ge=0,
        le=2,
        description="Falls in past year: 0=none, 1=1-3 falls, 2=4+ falls",
    )


class PhysicalMeasurementsInput(BaseModel):
    """Objective physical measurements for EWGSOP2 sarcopenia assessment."""

    grip_strength_kg: Optional[float] = Field(
        default=None,
        ge=0,
        description="Maximum handgrip strength (kg)",
    )
    chair_stand_5_sec: Optional[float] = Field(
        default=None,
        ge=0,
        description="Time to complete 5 chair rises (seconds)",
    )
    gait_speed_m_s: Optional[float] = Field(
        default=None,
        ge=0,
        description="Usual 4m gait speed (m/s)",
    )
    appendicular_skeletal_muscle_kg: Optional[float] = Field(
        default=None,
        ge=0,
        description="Appendicular skeletal muscle mass from DXA/BIA (kg)",
    )


class ClinicalContextInput(BaseModel):
    """Acute clinical context for malnutrition screening (MUST)."""

    acutely_ill: bool = Field(
        default=False,
        description="Patient is acutely ill/unstable",
    )
    days_without_nutrition: int = Field(
        default=0,
        ge=0,
        description="Days with little/no nutritional intake (actual or anticipated)",
    )


class PatientProfileInput(BaseModel):
    """Basic patient demographic and physical profile."""

    patient_id: str = Field(
        ...,
        description="Unique patient identifier",
        examples=["P12345"],
    )
    date_of_birth: date = Field(
        ...,
        description="Patient date of birth (YYYY-MM-DD)",
        examples=["1960-05-15"],
    )
    sex: SexInput = Field(
        ...,
        description="Biological sex",
    )
    height_cm: float = Field(
        ...,
        gt=0,
        le=300,
        description="Height in centimeters",
        examples=[175.0],
    )
    weight_kg: float = Field(
        ...,
        gt=0,
        le=500,
        description="Current weight in kilograms",
        examples=[80.0],
    )
    assessment_date: Optional[date] = Field(
        default=None,
        description="Date of assessment (defaults to today if not provided)",
    )


class PatientInput(BaseModel):
    """Complete patient data for assessment.

    This model captures all patient information needed for catabolic risk
    assessment, including demographics, lifestyle factors, and optional
    clinical measurements.
    """

    profile: PatientProfileInput = Field(
        ...,
        description="Basic patient demographics and physical profile",
    )
    activity_level: ActivityLevelInput = Field(
        default=ActivityLevelInput.SEDENTARY,
        description="Current physical activity level",
    )
    protein_intake_g_per_kg: Optional[float] = Field(
        default=None,
        ge=0,
        le=10,
        description="Daily protein intake in g/kg body weight",
        examples=[1.2],
    )
    caloric_intake_kcal: Optional[int] = Field(
        default=None,
        ge=0,
        le=10000,
        description="Daily caloric intake",
        examples=[2000],
    )
    sleep_hours: Optional[float] = Field(
        default=None,
        ge=0,
        le=24,
        description="Average sleep hours per night",
        examples=[7.0],
    )
    chronic_conditions: list[str] = Field(
        default_factory=list,
        description="List of chronic conditions",
        examples=[["type 2 diabetes", "hypertension"]],
    )
    medications: list[str] = Field(
        default_factory=list,
        description="Current medications",
        examples=[["metformin", "lisinopril"]],
    )
    recent_weight_loss_kg: Optional[float] = Field(
        default=None,
        ge=0,
        description="Unintentional weight loss in past 6 months (kg)",
        examples=[3.0],
    )
    stress_level: Optional[int] = Field(
        default=None,
        ge=1,
        le=10,
        description="Perceived stress level (1-10 scale)",
        examples=[5],
    )
    sarcf: Optional[SarcFInput] = Field(
        default=None,
        description="SARC-F questionnaire responses, if administered",
    )
    clinical_context: Optional[ClinicalContextInput] = Field(
        default=None,
        description="Acute clinical context for malnutrition screening",
    )
    physical: Optional[PhysicalMeasurementsInput] = Field(
        default=None,
        description="Objective physical measurements for sarcopenia assessment",
    )


class BiomarkerInput(BaseModel):
    """Optional biomarker values for enhanced assessment.

    All values are optional. Only include biomarkers that have been measured.
    """

    albumin: Optional[float] = Field(
        default=None,
        description="Albumin (g/dL)",
        examples=[4.0],
    )
    prealbumin: Optional[float] = Field(
        default=None,
        description="Prealbumin/Transthyretin (mg/dL)",
        examples=[25.0],
    )
    crp: Optional[float] = Field(
        default=None,
        description="C-Reactive Protein (mg/L)",
        examples=[1.5],
    )
    il6: Optional[float] = Field(
        default=None,
        description="Interleukin-6 (pg/mL)",
        examples=[3.0],
    )
    testosterone: Optional[float] = Field(
        default=None,
        description="Total Testosterone (ng/dL)",
        examples=[500.0],
    )
    cortisol: Optional[float] = Field(
        default=None,
        description="Cortisol AM (mcg/dL)",
        examples=[12.0],
    )
    tsh: Optional[float] = Field(
        default=None,
        description="TSH (mIU/L)",
        examples=[2.0],
    )
    glucose_fasting: Optional[float] = Field(
        default=None,
        description="Fasting Glucose (mg/dL)",
        examples=[95.0],
    )
    hba1c: Optional[float] = Field(
        default=None,
        description="HbA1c (%)",
        examples=[5.5],
    )
    insulin_fasting: Optional[float] = Field(
        default=None,
        description="Fasting Insulin (uIU/mL)",
        examples=[8.0],
    )
    vitamin_d: Optional[float] = Field(
        default=None,
        description="Vitamin D 25-OH (ng/mL)",
        examples=[40.0],
    )
    vitamin_b12: Optional[float] = Field(
        default=None,
        description="Vitamin B12 (pg/mL)",
        examples=[500.0],
    )


class AssessmentRequest(BaseModel):
    """Request body for full catabolic risk assessment."""

    patient: PatientInput = Field(
        ...,
        description="Complete patient data",
    )
    biomarkers: Optional[BiomarkerInput] = Field(
        default=None,
        description="Optional biomarker values for enhanced assessment",
    )


class QuickScreenRequest(BaseModel):
    """Request body for quick screening (no detailed biomarkers)."""

    patient: PatientInput = Field(
        ...,
        description="Patient data for quick screening",
    )


class ValidatedInstrumentsRequest(BaseModel):
    """Request body for running validated instruments only."""

    patient: PatientInput = Field(
        ...,
        description="Patient data for validated instrument screening",
    )


class RecommendationsRequest(BaseModel):
    """Request body for generating intervention recommendations."""

    patient: PatientInput = Field(
        ...,
        description="Patient data for recommendation generation",
    )
    biomarkers: Optional[BiomarkerInput] = Field(
        default=None,
        description="Optional biomarker values",
    )


# -----------------------------------------------------------------------------
# Output Schemas
# -----------------------------------------------------------------------------


class CategoryScoreOutput(BaseModel):
    """Score breakdown for a specific risk category."""

    category: str = Field(description="Risk category name")
    score: float = Field(description="Score for this category")
    max_score: float = Field(description="Maximum possible score")
    percentage: float = Field(description="Percentage of max score")
    contributing_factors: list[str] = Field(
        default_factory=list,
        description="Factors contributing to this category score",
    )


class RiskScoreOutput(BaseModel):
    """Complete risk score with breakdown."""

    total_score: float = Field(description="Raw catabolic burden")
    max_possible_score: float = Field(description="Reference burden (100% risk)")
    percentage: float = Field(description="Risk percentage (0-100)")
    risk_level: RiskLevelOutput = Field(description="Overall risk classification")
    category_scores: list[CategoryScoreOutput] = Field(
        default_factory=list,
        description="Breakdown by risk category",
    )
    top_risk_factors: list[str] = Field(
        default_factory=list,
        description="Top contributing risk factors",
    )
    biomarker_penalty: float = Field(
        default=0.0,
        description="Additional score from abnormal biomarkers",
    )
    confidence: float = Field(
        description="Confidence in assessment (0-1 based on data completeness)",
    )
    is_reliable: bool = Field(
        description="Whether enough data was provided for reliable assessment",
    )
    validation_status: str = Field(
        description="Validation status of the scoring model",
    )


class InstrumentResultOutput(BaseModel):
    """Result from a validated screening instrument."""

    instrument: str = Field(description="Instrument name (e.g., SARC-F, MUST, EWGSOP2)")
    applicable: bool = Field(
        description="Whether required inputs were available to score",
    )
    category: Optional[str] = Field(
        default=None,
        description="Validated outcome category",
    )
    raw_score: Optional[float] = Field(
        default=None,
        description="Raw instrument score",
    )
    interpretation: Optional[str] = Field(
        default=None,
        description="Human-readable interpretation",
    )
    citation: str = Field(description="Source citation for the instrument")
    missing_inputs: list[str] = Field(
        default_factory=list,
        description="Required inputs that were absent",
    )


class ValidatedSummaryOutput(BaseModel):
    """Summary of validated instrument findings."""

    sarcopenia_screen: Optional[str] = Field(
        default=None,
        description="SARC-F screening result",
    )
    sarcopenia_confirmed: Optional[str] = Field(
        default=None,
        description="EWGSOP2 sarcopenia diagnosis",
    )
    malnutrition_risk: Optional[str] = Field(
        default=None,
        description="MUST malnutrition risk category",
    )
    any_positive: bool = Field(
        description="Whether any validated instrument flagged a concern",
    )


class ExploratoryCompositeOutput(BaseModel):
    """Secondary exploratory/heuristic composite score (unvalidated)."""

    screening_signal: str = Field(
        description="User-facing screening signal description",
    )
    top_concerns: list[str] = Field(
        default_factory=list,
        description="Top 3 risk factors identified",
    )
    confidence: float = Field(description="Data completeness confidence (0-1)")
    reliable: bool = Field(description="Whether score is reliable")
    validation_status: str = Field(description="Validation status")
    risk_level: Optional[str] = Field(
        default=None,
        description="Risk level (only shown if reliable)",
    )
    risk_percentage: Optional[float] = Field(
        default=None,
        description="Risk percentage (only shown if reliable)",
    )


class QuickScreenResponse(BaseModel):
    """Response from quick screening endpoint.

    Panel-first output structure: validated instruments are the headline,
    exploratory composite is secondary.
    """

    validated_instruments: list[InstrumentResultOutput] = Field(
        description="Results from validated screening instruments (SARC-F, MUST, EWGSOP2)",
    )
    validated_summary: ValidatedSummaryOutput = Field(
        description="Summary of validated instrument findings",
    )
    exploratory_composite: ExploratoryCompositeOutput = Field(
        description="Secondary heuristic composite score (unvalidated)",
    )
    recommendation: str = Field(
        description="Primary recommendation based on findings",
    )
    disclaimer: str = Field(
        description="Required educational screening aid disclaimer",
    )


class AssessmentResponse(BaseModel):
    """Response from full assessment endpoint."""

    risk_score: RiskScoreOutput = Field(
        description="Complete catabolic risk score",
    )
    validated_instruments: list[InstrumentResultOutput] = Field(
        description="Results from validated screening instruments",
    )
    disclaimer: str = Field(
        description="Required educational screening aid disclaimer",
    )


class ValidatedInstrumentsResponse(BaseModel):
    """Response from validated instruments endpoint."""

    instruments: list[InstrumentResultOutput] = Field(
        description="Results from validated screening instruments",
    )
    summary: ValidatedSummaryOutput = Field(
        description="Summary of findings",
    )
    disclaimer: str = Field(
        description="Required educational screening aid disclaimer",
    )


class RecommendationOutput(BaseModel):
    """Individual intervention recommendation."""

    title: str = Field(description="Short recommendation title")
    description: str = Field(description="Detailed recommendation")
    category: RecommendationCategoryOutput = Field(
        description="Recommendation category",
    )
    priority: RecommendationPriorityOutput = Field(description="Priority level")
    rationale: Optional[str] = Field(
        default=None,
        description="Why this is recommended",
    )
    target_factors: list[str] = Field(
        default_factory=list,
        description="Risk factors this addresses",
    )


class InterventionPlanResponse(BaseModel):
    """Response from recommendations endpoint."""

    patient_id: str = Field(description="Patient identifier")
    risk_level: RiskLevelOutput = Field(description="Current risk level")
    recommendations: list[RecommendationOutput] = Field(
        description="Prioritized intervention recommendations",
    )
    follow_up_interval_days: int = Field(
        description="Recommended follow-up interval",
    )
    summary: str = Field(description="Plan summary")
    disclaimer: str = Field(
        description="Required educational screening aid disclaimer",
    )


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(description="Service status")
    version: str = Field(description="API version")
    service: str = Field(description="Service name")


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str = Field(description="Error type")
    message: str = Field(description="Error message")
    details: Optional[dict] = Field(
        default=None,
        description="Additional error details",
    )
