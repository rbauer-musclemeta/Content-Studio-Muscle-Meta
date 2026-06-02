"""Dependency injection for the CRF API.

This module provides FastAPI dependencies for calculator and recommendation
engine instances, enabling easy testing and configuration.
"""

from datetime import date
from typing import Optional

from crf.assessment.calculator import CatabolicRiskCalculator
from crf.assessment.recommendations import RecommendationEngine
from crf.models.biomarkers import Biomarkers
from crf.models.measurements import (
    ClinicalContext,
    PhysicalMeasurements,
    SarcFResponses,
)
from crf.models.patient import ActivityLevel, Patient, PatientProfile, Sex

from api.schemas import (
    ActivityLevelInput,
    BiomarkerInput,
    PatientInput,
    SexInput,
)


# Singleton instances for dependency injection
_calculator: Optional[CatabolicRiskCalculator] = None
_recommendation_engine: Optional[RecommendationEngine] = None


def get_calculator() -> CatabolicRiskCalculator:
    """Get the catabolic risk calculator instance.

    Returns:
        CatabolicRiskCalculator: Singleton calculator instance.
    """
    global _calculator
    if _calculator is None:
        _calculator = CatabolicRiskCalculator()
    return _calculator


def get_recommendation_engine() -> RecommendationEngine:
    """Get the recommendation engine instance.

    Returns:
        RecommendationEngine: Singleton recommendation engine instance.
    """
    global _recommendation_engine
    if _recommendation_engine is None:
        _recommendation_engine = RecommendationEngine()
    return _recommendation_engine


def convert_patient_input(patient_input: PatientInput) -> Patient:
    """Convert API patient input to internal Patient model.

    Args:
        patient_input: Patient data from API request.

    Returns:
        Patient: Internal patient model for assessment.
    """
    # Convert enums
    sex_map = {
        SexInput.MALE: Sex.MALE,
        SexInput.FEMALE: Sex.FEMALE,
    }
    activity_map = {
        ActivityLevelInput.SEDENTARY: ActivityLevel.SEDENTARY,
        ActivityLevelInput.LIGHT: ActivityLevel.LIGHT,
        ActivityLevelInput.MODERATE: ActivityLevel.MODERATE,
        ActivityLevelInput.ACTIVE: ActivityLevel.ACTIVE,
        ActivityLevelInput.VERY_ACTIVE: ActivityLevel.VERY_ACTIVE,
    }

    # Build profile
    profile = PatientProfile(
        patient_id=patient_input.profile.patient_id,
        date_of_birth=patient_input.profile.date_of_birth,
        sex=sex_map[patient_input.profile.sex],
        height_cm=patient_input.profile.height_cm,
        weight_kg=patient_input.profile.weight_kg,
        assessment_date=patient_input.profile.assessment_date or date.today(),
    )

    # Build SARC-F responses if provided
    sarcf = None
    if patient_input.sarcf:
        sarcf = SarcFResponses(
            strength=patient_input.sarcf.strength,
            assistance_walking=patient_input.sarcf.assistance_walking,
            rising_from_chair=patient_input.sarcf.rising_from_chair,
            climbing_stairs=patient_input.sarcf.climbing_stairs,
            falls=patient_input.sarcf.falls,
        )

    # Build clinical context if provided
    clinical_context = ClinicalContext()
    if patient_input.clinical_context:
        clinical_context = ClinicalContext(
            acutely_ill=patient_input.clinical_context.acutely_ill,
            days_without_nutrition=patient_input.clinical_context.days_without_nutrition,
        )

    # Build physical measurements if provided
    physical = PhysicalMeasurements()
    if patient_input.physical:
        physical = PhysicalMeasurements(
            grip_strength_kg=patient_input.physical.grip_strength_kg,
            chair_stand_5_sec=patient_input.physical.chair_stand_5_sec,
            gait_speed_m_s=patient_input.physical.gait_speed_m_s,
            appendicular_skeletal_muscle_kg=patient_input.physical.appendicular_skeletal_muscle_kg,
        )

    # Build complete patient
    return Patient(
        profile=profile,
        activity_level=activity_map[patient_input.activity_level],
        protein_intake_g_per_kg=patient_input.protein_intake_g_per_kg,
        caloric_intake_kcal=patient_input.caloric_intake_kcal,
        sleep_hours=patient_input.sleep_hours,
        chronic_conditions=patient_input.chronic_conditions,
        medications=patient_input.medications,
        recent_weight_loss_kg=patient_input.recent_weight_loss_kg,
        stress_level=patient_input.stress_level,
        sarcf=sarcf,
        clinical_context=clinical_context,
        physical=physical,
    )


def convert_biomarker_input(biomarker_input: Optional[BiomarkerInput]) -> Optional[Biomarkers]:
    """Convert API biomarker input to internal Biomarkers model.

    Args:
        biomarker_input: Biomarker data from API request, or None.

    Returns:
        Biomarkers: Internal biomarkers model, or None if no input.
    """
    if biomarker_input is None:
        return None

    # Check if any biomarkers were actually provided
    has_values = any([
        biomarker_input.albumin is not None,
        biomarker_input.prealbumin is not None,
        biomarker_input.crp is not None,
        biomarker_input.il6 is not None,
        biomarker_input.testosterone is not None,
        biomarker_input.cortisol is not None,
        biomarker_input.tsh is not None,
        biomarker_input.glucose_fasting is not None,
        biomarker_input.hba1c is not None,
        biomarker_input.insulin_fasting is not None,
        biomarker_input.vitamin_d is not None,
        biomarker_input.vitamin_b12 is not None,
    ])

    if not has_values:
        return None

    # Create biomarkers model and set values
    biomarkers = Biomarkers()

    if biomarker_input.albumin is not None:
        biomarkers.albumin.value = biomarker_input.albumin
    if biomarker_input.prealbumin is not None:
        biomarkers.prealbumin.value = biomarker_input.prealbumin
    if biomarker_input.crp is not None:
        biomarkers.crp.value = biomarker_input.crp
    if biomarker_input.il6 is not None:
        biomarkers.il6.value = biomarker_input.il6
    if biomarker_input.testosterone is not None:
        biomarkers.testosterone.value = biomarker_input.testosterone
    if biomarker_input.cortisol is not None:
        biomarkers.cortisol.value = biomarker_input.cortisol
    if biomarker_input.tsh is not None:
        biomarkers.tsh.value = biomarker_input.tsh
    if biomarker_input.glucose_fasting is not None:
        biomarkers.glucose_fasting.value = biomarker_input.glucose_fasting
    if biomarker_input.hba1c is not None:
        biomarkers.hba1c.value = biomarker_input.hba1c
    if biomarker_input.insulin_fasting is not None:
        biomarkers.insulin_fasting.value = biomarker_input.insulin_fasting
    if biomarker_input.vitamin_d is not None:
        biomarkers.vitamin_d.value = biomarker_input.vitamin_d
    if biomarker_input.vitamin_b12 is not None:
        biomarkers.vitamin_b12.value = biomarker_input.vitamin_b12

    return biomarkers
