"""CRF Integration Module for Product Backend.

This module bridges the CRF clinical engine with the main product backend,
providing assessment endpoints under /api/crf/.

The CRF engine uses PostgreSQL for clinical data persistence, separate from
the product app's MongoDB. This dual-database architecture keeps clinical
assessment data isolated from commerce/content data.

Environment Variables:
    CRF_DATABASE_URL: PostgreSQL connection string for clinical data
                      (e.g., postgresql://user:pass@localhost/crf_db)
"""

import sys
from pathlib import Path

# Add crf-framework to path for imports
CRF_FRAMEWORK_PATH = Path(__file__).parent.parent / "crf-framework" / "src"
if str(CRF_FRAMEWORK_PATH) not in sys.path:
    sys.path.insert(0, str(CRF_FRAMEWORK_PATH))

CRF_API_PATH = Path(__file__).parent.parent / "crf-framework"
if str(CRF_API_PATH) not in sys.path:
    sys.path.insert(0, str(CRF_API_PATH))

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
from enum import Enum

# Import CRF components
from crf.assessment.calculator import CatabolicRiskCalculator
from crf.assessment.recommendations import RecommendationEngine
from crf.assessment.scoring import DISCLAIMER
from crf.models.patient import Patient, PatientProfile, Sex, ActivityLevel
from crf.models.biomarkers import Biomarkers
from crf.models.measurements import PhysicalMeasurements, SarcFResponses


# -----------------------------------------------------------------------------
# Schemas (inline to avoid import complexity)
# -----------------------------------------------------------------------------

class SexInput(str, Enum):
    MALE = "male"
    FEMALE = "female"


class ActivityLevelInput(str, Enum):
    SEDENTARY = "sedentary"
    LIGHT = "light"
    MODERATE = "moderate"
    ACTIVE = "active"
    VERY_ACTIVE = "very_active"


class SarcFInput(BaseModel):
    strength: int = Field(..., ge=0, le=2)
    assistance_walking: int = Field(..., ge=0, le=2)
    rising_from_chair: int = Field(..., ge=0, le=2)
    climbing_stairs: int = Field(..., ge=0, le=2)
    falls: int = Field(..., ge=0, le=2)


class PhysicalMeasurementsInput(BaseModel):
    grip_strength_kg: Optional[float] = None
    chair_stand_5_sec: Optional[float] = None
    gait_speed_m_s: Optional[float] = None
    appendicular_skeletal_muscle_kg: Optional[float] = None


class PatientProfileInput(BaseModel):
    patient_id: str
    date_of_birth: date
    sex: SexInput
    height_cm: float = Field(..., gt=0, le=300)
    weight_kg: float = Field(..., gt=0, le=500)
    assessment_date: Optional[date] = None


class PatientInput(BaseModel):
    profile: PatientProfileInput
    activity_level: ActivityLevelInput = ActivityLevelInput.SEDENTARY
    protein_intake_g_per_kg: Optional[float] = None
    caloric_intake_kcal: Optional[int] = None
    sleep_hours: Optional[float] = None
    chronic_conditions: list[str] = []
    medications: list[str] = []
    recent_weight_loss_kg: Optional[float] = None
    stress_level: Optional[int] = None
    sarcf: Optional[SarcFInput] = None
    physical: Optional[PhysicalMeasurementsInput] = None


class BiomarkerInput(BaseModel):
    albumin: Optional[float] = None
    crp: Optional[float] = None
    testosterone: Optional[float] = None
    cortisol: Optional[float] = None
    glucose_fasting: Optional[float] = None
    hba1c: Optional[float] = None
    vitamin_d: Optional[float] = None
    vitamin_b12: Optional[float] = None


class AssessmentRequest(BaseModel):
    patient: PatientInput
    biomarkers: Optional[BiomarkerInput] = None


class QuickScreenRequest(BaseModel):
    patient: PatientInput


# -----------------------------------------------------------------------------
# Conversion helpers
# -----------------------------------------------------------------------------

def convert_patient_input(input_data: PatientInput) -> Patient:
    """Convert API PatientInput to internal Patient model."""
    profile = PatientProfile(
        patient_id=input_data.profile.patient_id,
        date_of_birth=input_data.profile.date_of_birth,
        sex=Sex(input_data.profile.sex.value),
        height_cm=input_data.profile.height_cm,
        weight_kg=input_data.profile.weight_kg,
        assessment_date=input_data.profile.assessment_date or date.today(),
    )

    # Build physical measurements if provided
    physical = None
    if input_data.physical:
        physical = PhysicalMeasurements(
            grip_strength_kg=input_data.physical.grip_strength_kg,
            chair_stand_5_sec=input_data.physical.chair_stand_5_sec,
            gait_speed_m_s=input_data.physical.gait_speed_m_s,
            appendicular_skeletal_muscle_kg=input_data.physical.appendicular_skeletal_muscle_kg,
        )

    # Build SARC-F responses if provided
    sarcf = None
    if input_data.sarcf:
        sarcf = SarcFResponses(
            strength=input_data.sarcf.strength,
            assistance_walking=input_data.sarcf.assistance_walking,
            rising_from_chair=input_data.sarcf.rising_from_chair,
            climbing_stairs=input_data.sarcf.climbing_stairs,
            falls=input_data.sarcf.falls,
        )

    return Patient(
        profile=profile,
        activity_level=ActivityLevel(input_data.activity_level.value),
        protein_intake_g_per_kg=input_data.protein_intake_g_per_kg,
        caloric_intake_kcal=input_data.caloric_intake_kcal,
        sleep_hours=input_data.sleep_hours,
        chronic_conditions=input_data.chronic_conditions,
        medications=input_data.medications,
        recent_weight_loss_kg=input_data.recent_weight_loss_kg,
        stress_level=input_data.stress_level,
        sarcf_responses=sarcf,
        physical_measurements=physical,
    )


def convert_biomarker_input(input_data: Optional[BiomarkerInput]) -> Optional[Biomarkers]:
    """Convert API BiomarkerInput to internal Biomarkers model."""
    if input_data is None:
        return None

    biomarkers = Biomarkers()
    if input_data.albumin is not None:
        biomarkers.albumin.value = input_data.albumin
    if input_data.crp is not None:
        biomarkers.crp.value = input_data.crp
    if input_data.testosterone is not None:
        biomarkers.testosterone.value = input_data.testosterone
    if input_data.cortisol is not None:
        biomarkers.cortisol.value = input_data.cortisol
    if input_data.glucose_fasting is not None:
        biomarkers.glucose_fasting.value = input_data.glucose_fasting
    if input_data.hba1c is not None:
        biomarkers.hba1c.value = input_data.hba1c
    if input_data.vitamin_d is not None:
        biomarkers.vitamin_d.value = input_data.vitamin_d
    if input_data.vitamin_b12 is not None:
        biomarkers.vitamin_b12.value = input_data.vitamin_b12

    return biomarkers


# -----------------------------------------------------------------------------
# Singleton dependencies
# -----------------------------------------------------------------------------

_calculator: Optional[CatabolicRiskCalculator] = None
_recommendation_engine: Optional[RecommendationEngine] = None


def get_calculator() -> CatabolicRiskCalculator:
    global _calculator
    if _calculator is None:
        _calculator = CatabolicRiskCalculator()
    return _calculator


def get_recommendation_engine() -> RecommendationEngine:
    global _recommendation_engine
    if _recommendation_engine is None:
        _recommendation_engine = RecommendationEngine()
    return _recommendation_engine


# -----------------------------------------------------------------------------
# Router
# -----------------------------------------------------------------------------

crf_router = APIRouter(prefix="/crf", tags=["CRF Clinical Engine"])


@crf_router.get("/")
async def crf_root():
    """CRF API information and status."""
    return {
        "service": "Catabolic Risk Framework",
        "version": "1.0.0",
        "status": "healthy",
        "database": "PostgreSQL (clinical data)",
        "endpoints": [
            "/crf/assess",
            "/crf/quick-screen",
            "/crf/validated-instruments",
            "/crf/recommendations",
        ],
        "disclaimer": DISCLAIMER,
    }


@crf_router.get("/health")
async def crf_health():
    """CRF health check endpoint."""
    return {"status": "healthy", "service": "crf", "version": "1.0.0"}


@crf_router.post("/assess")
async def full_assessment(
    request: AssessmentRequest,
    calculator: CatabolicRiskCalculator = Depends(get_calculator),
):
    """Full catabolic risk assessment with optional biomarkers.

    Returns validated instrument results (SARC-F, MUST, EWGSOP2) plus
    exploratory composite risk score.
    """
    try:
        patient = convert_patient_input(request.patient)
        biomarkers = convert_biomarker_input(request.biomarkers)

        risk_score = calculator.assess_patient(patient, biomarkers=biomarkers)
        instrument_results = calculator.run_validated_screens(patient)

        return {
            "risk_score": {
                "total_score": risk_score.total_score,
                "max_possible_score": risk_score.max_possible_score,
                "percentage": risk_score.percentage,
                "risk_level": risk_score.risk_level.value,
                "top_risk_factors": risk_score.top_risk_factors,
                "confidence": risk_score.confidence,
                "is_reliable": risk_score.is_reliable,
            },
            "validated_instruments": [
                {
                    "instrument": r.instrument,
                    "applicable": r.applicable,
                    "category": r.category,
                    "raw_score": r.raw_score,
                    "interpretation": r.interpretation,
                    "citation": r.citation,
                    "missing_inputs": r.missing_inputs,
                }
                for r in instrument_results
            ],
            "disclaimer": DISCLAIMER,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@crf_router.post("/quick-screen")
async def quick_screen(
    request: QuickScreenRequest,
    calculator: CatabolicRiskCalculator = Depends(get_calculator),
):
    """Quick screening with panel-first output.

    Validated instruments (SARC-F, MUST, EWGSOP2) are the headline.
    Exploratory composite is secondary.
    """
    try:
        patient = convert_patient_input(request.patient)
        result = calculator.quick_screen(patient)

        return {
            "validated_instruments": result["validated_instruments"],
            "validated_summary": result["validated_summary"],
            "exploratory_composite": result["exploratory_composite"],
            "recommendation": result["recommendation"],
            "disclaimer": result["disclaimer"],
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@crf_router.post("/validated-instruments")
async def validated_instruments(
    request: QuickScreenRequest,
    calculator: CatabolicRiskCalculator = Depends(get_calculator),
):
    """Run validated instruments only (SARC-F, MUST, EWGSOP2).

    No exploratory composite scoring — just the peer-reviewed instruments.
    """
    try:
        patient = convert_patient_input(request.patient)
        instrument_results = calculator.run_validated_screens(patient)

        summary = {
            "sarcopenia_screen": None,
            "sarcopenia_confirmed": None,
            "malnutrition_risk": None,
            "any_positive": False,
        }

        instruments = []
        for r in instrument_results:
            instruments.append({
                "instrument": r.instrument,
                "applicable": r.applicable,
                "category": r.category,
                "raw_score": r.raw_score,
                "interpretation": r.interpretation,
                "citation": r.citation,
                "missing_inputs": r.missing_inputs,
            })

            if not r.applicable:
                continue

            if r.instrument == "SARC-F":
                summary["sarcopenia_screen"] = r.category
                if r.category and "positive" in r.category.lower():
                    summary["any_positive"] = True
            elif r.instrument == "EWGSOP2":
                summary["sarcopenia_confirmed"] = r.category
                if r.category and r.category not in ["No sarcopenia", "Probable sarcopenia"]:
                    summary["any_positive"] = True
            elif r.instrument == "MUST":
                summary["malnutrition_risk"] = r.category
                if r.category in ["Medium risk", "High risk"]:
                    summary["any_positive"] = True

        return {
            "instruments": instruments,
            "summary": summary,
            "disclaimer": DISCLAIMER,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@crf_router.post("/recommendations")
async def generate_recommendations(
    request: AssessmentRequest,
    calculator: CatabolicRiskCalculator = Depends(get_calculator),
    engine: RecommendationEngine = Depends(get_recommendation_engine),
):
    """Generate personalized intervention recommendations.

    Based on risk assessment results, returns prioritized recommendations
    across nutrition, exercise, medical, and lifestyle categories.
    """
    try:
        patient = convert_patient_input(request.patient)
        biomarkers = convert_biomarker_input(request.biomarkers)

        risk_score = calculator.assess_patient(patient, biomarkers=biomarkers)
        plan = engine.generate_plan(patient, risk_score)

        return {
            "patient_id": request.patient.profile.patient_id,
            "risk_level": risk_score.risk_level.value,
            "recommendations": [
                {
                    "title": rec.title,
                    "description": rec.description,
                    "category": rec.category.value,
                    "priority": rec.priority.value,
                    "rationale": rec.rationale,
                    "target_factors": rec.target_factors,
                }
                for rec in plan.recommendations
            ],
            "follow_up_interval_days": plan.follow_up_interval_days,
            "summary": plan.summary,
            "disclaimer": DISCLAIMER,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
