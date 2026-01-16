"""
Core Scoring Engine Module

Main scoring algorithm that processes assessment responses and generates
comprehensive risk assessments.
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime
import uuid
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import (
    SectionScores,
    PillarScores,
    AssessmentResult,
    AssessmentResponse,
    DemographicData,
    CriticalAlert,
    AlertSeverity,
    RiskLevel,
)
from .risk_tiers import get_risk_level, get_risk_label
from .pillar_calculator import calculate_pillar_scores
from .flag_detector import detect_critical_flags, detect_high_flags, ALERT_TEMPLATES


# Section weights for calculating total score
SECTION_WEIGHTS: Dict[str, float] = {
    "weight_loss": 1.0,
    "functional": 1.0,
    "bone_health": 0.9,
    "neurological": 1.0,
    "medications": 1.1,
    "medical_events": 1.0,
    "muscle_balance": 0.9,
    "strength": 0.9,
    "energy_sleep": 0.9,
    "warning_signs": 0.8,
    "biomarkers": 0.7,
}

# Protective factors that reduce overall score
PROTECTIVE_FACTORS: Dict[str, int] = {
    "protein_supplement": -3,
    "creatine": -3,
    "hmb": -3,
    "resistance_training": -5,
    "hrt_female": -8,
    "trt_male": -8,
    "regular_exercise": -4,
    "adequate_sleep": -2,
}

# Question to section mapping
QUESTION_SECTION_MAP: Dict[str, str] = {
    # Medical Events Section
    "recent_hospitalization": "medical_events",
    "surgery_recent": "medical_events",
    "illness_prolonged": "medical_events",
    "cancer_treatment": "medical_events",
    "chronic_disease_new": "medical_events",
    # Weight Loss Section
    "unintentional_weight_loss": "weight_loss",
    "weight_loss_percent": "weight_loss",
    "weight_loss_rate": "weight_loss",
    "appetite_changes": "weight_loss",
    "clothes_fit": "weight_loss",
    # Medications Section
    "glp1_medication": "medications",
    "steroid_use": "medications",
    "ppi_use": "medications",
    "statin_use": "medications",
    "diabetes_medication": "medications",
    "multiple_medications": "medications",
    # Neurological Section
    "memory_concerns": "neurological",
    "balance_issues": "neurological",
    "dizziness": "neurological",
    "neuropathy": "neurological",
    "cognitive_test": "neurological",
    # Functional Section
    "sit_to_stand": "functional",
    "walking_speed": "functional",
    "stair_climbing": "functional",
    "chair_rise_difficulty": "functional",
    "timed_up_go": "functional",
    "activity_level": "functional",
    # Muscle Balance Section
    "grip_strength": "muscle_balance",
    "arm_strength_symmetry": "muscle_balance",
    "leg_strength_symmetry": "muscle_balance",
    "core_stability": "muscle_balance",
    # Strength Section
    "push_up_ability": "strength",
    "squat_ability": "strength",
    "carry_groceries": "strength",
    "open_jars": "strength",
    # Bone Health Section
    "bone_density_test": "bone_health",
    "fracture_history": "bone_health",
    "falls_with_injury": "bone_health",
    "osteoporosis_diagnosis": "bone_health",
    "height_loss": "bone_health",
    # Energy & Sleep Section
    "fatigue_level": "energy_sleep",
    "sleep_quality": "energy_sleep",
    "sleep_duration": "energy_sleep",
    "energy_afternoon": "energy_sleep",
    # Warning Signs Section
    "unexplained_fatigue": "warning_signs",
    "weakness_sudden": "warning_signs",
    "difficulty_rising": "warning_signs",
    "calf_circumference": "warning_signs",
    # Biomarkers Section (optional)
    "vitamin_d_level": "biomarkers",
    "albumin_level": "biomarkers",
    "creatinine_level": "biomarkers",
    "hemoglobin_level": "biomarkers",
}


def map_question_to_section(question_id: str) -> str:
    """
    Map a question ID to its corresponding section.

    Args:
        question_id: The question identifier

    Returns:
        Section name or None if not mapped
    """
    return QUESTION_SECTION_MAP.get(question_id)


def calculate_assessment_score(
    responses: List[AssessmentResponse],
    gender: str,
) -> Tuple[int, SectionScores, int]:
    """
    Calculate the total assessment score from responses.

    Args:
        responses: List of assessment response objects
        gender: User's gender for protective factor calculations

    Returns:
        Tuple of (total_score, section_scores, protective_reduction)
    """
    # Initialize section scores
    section_totals = {
        "medical_events": 0,
        "weight_loss": 0,
        "medications": 0,
        "neurological": 0,
        "functional": 0,
        "muscle_balance": 0,
        "strength": 0,
        "bone_health": 0,
        "energy_sleep": 0,
        "warning_signs": 0,
        "biomarkers": 0,
    }

    # Aggregate scores by section
    for response in responses:
        section = map_question_to_section(response.question_id)
        if section and section in section_totals:
            section_totals[section] += response.score

    # Create SectionScores object
    section_scores = SectionScores(
        medical_events=section_totals["medical_events"],
        weight_loss=section_totals["weight_loss"],
        medications=section_totals["medications"],
        neurological=section_totals["neurological"],
        functional=section_totals["functional"],
        muscle_balance=section_totals["muscle_balance"],
        strength=section_totals["strength"],
        bone_health=section_totals["bone_health"],
        energy_sleep=section_totals["energy_sleep"],
        warning_signs=section_totals["warning_signs"],
        biomarkers=section_totals["biomarkers"],
    )

    # Calculate protective factor reduction
    protective_reduction = 0
    for response in responses:
        factor_key = response.question_id

        # Check if this is a protective factor
        if factor_key in PROTECTIVE_FACTORS:
            # Only apply if response indicates protection is active
            if response.value in ["yes", "true", True, "regular", "daily"]:
                protective_reduction += abs(PROTECTIVE_FACTORS[factor_key])

        # Gender-specific protective factors
        if factor_key == "hrt_female" and gender == "female":
            if response.value in ["yes", "true", True]:
                protective_reduction += abs(PROTECTIVE_FACTORS["hrt_female"])
        if factor_key == "trt_male" and gender == "male":
            if response.value in ["yes", "true", True]:
                protective_reduction += abs(PROTECTIVE_FACTORS["trt_male"])

    # Calculate weighted total
    raw_total = 0
    for section, score in section_totals.items():
        weight = SECTION_WEIGHTS.get(section, 1.0)
        raw_total += score * weight

    # Apply protective factors
    total_score = max(0, int(raw_total - protective_reduction))

    return total_score, section_scores, protective_reduction


def calculate_percentile(score: int, age: int, gender: str) -> int:
    """
    Calculate percentile rank compared to age/gender cohort.

    Note: In production, this would use actual population data.
    This is a simplified model.

    Args:
        score: Total assessment score
        age: User's age
        gender: User's gender

    Returns:
        Percentile (0-100)
    """
    # Base percentile calculation (lower score = better = higher percentile)
    base_percentile = max(0, min(100, 100 - (score / 2)))

    # Age adjustment (older adults may have higher baseline scores)
    if age > 70:
        age_adjustment = -8
    elif age > 65:
        age_adjustment = -5
    elif age > 55:
        age_adjustment = -2
    elif age < 45:
        age_adjustment = 5
    else:
        age_adjustment = 0

    return max(0, min(100, round(base_percentile + age_adjustment)))


def generate_critical_alerts(
    critical_flags: List[str], high_flags: List[str]
) -> List[CriticalAlert]:
    """
    Generate user-facing alerts from detected flags.

    Args:
        critical_flags: List of critical flag identifiers
        high_flags: List of high-risk flag identifiers

    Returns:
        List of CriticalAlert objects sorted by severity
    """
    alerts: List[CriticalAlert] = []

    # Process critical flags first
    for flag in critical_flags:
        template = ALERT_TEMPLATES.get(flag)
        if template:
            alerts.append(
                CriticalAlert(
                    id=f"alert-{flag.lower().replace('_', '-')}",
                    severity=AlertSeverity(template["severity"]),
                    category=template["category"],
                    message=template["message"],
                    action=template["action"],
                    timeframe=template["timeframe"],
                )
            )

    # Process high flags (avoiding duplicates)
    for flag in high_flags:
        if flag not in critical_flags:
            template = ALERT_TEMPLATES.get(flag)
            if template:
                alerts.append(
                    CriticalAlert(
                        id=f"alert-{flag.lower().replace('_', '-')}",
                        severity=AlertSeverity(template["severity"]),
                        category=template["category"],
                        message=template["message"],
                        action=template["action"],
                        timeframe=template["timeframe"],
                    )
                )

    # Sort by severity (critical > urgent > warning)
    severity_order = {"critical": 0, "urgent": 1, "warning": 2}
    alerts.sort(key=lambda a: severity_order.get(a.severity.value, 3))

    return alerts


def generate_full_results(
    responses: List[AssessmentResponse],
    demographics: DemographicData,
    assessment_id: str,
    user_id: str = None,
) -> AssessmentResult:
    """
    Generate comprehensive assessment results from responses.

    This is the main entry point for the scoring engine. It:
    1. Calculates total and section scores
    2. Determines risk level
    3. Calculates pillar scores
    4. Detects risk flags
    5. Generates alerts

    Args:
        responses: List of assessment responses
        demographics: User demographic information
        assessment_id: Unique assessment identifier
        user_id: Optional user identifier

    Returns:
        Complete AssessmentResult object
    """
    # Calculate scores
    total_score, section_scores, protective_reduction = calculate_assessment_score(
        responses, demographics.gender
    )

    # Determine risk level
    max_score = 200
    percent_score = (total_score / max_score) * 100
    risk_level = get_risk_level(total_score, max_score)
    risk_category = get_risk_label(risk_level)

    # Calculate pillar scores
    pillar_scores = calculate_pillar_scores(section_scores)

    # Detect flags
    critical_flags = detect_critical_flags(responses, section_scores)
    high_flags = detect_high_flags(responses, section_scores)

    # Generate alerts
    critical_alerts = generate_critical_alerts(critical_flags, high_flags)

    # Calculate percentile
    percentile = calculate_percentile(total_score, demographics.age, demographics.gender)

    # Create result object (pathways and action_plan are generated separately)
    result = AssessmentResult(
        id=str(uuid.uuid4()),
        assessment_id=assessment_id,
        user_id=user_id,
        demographic_data=demographics,
        total_score=total_score,
        max_score=max_score,
        percent_score=percent_score,
        section_scores=section_scores,
        risk_level=RiskLevel(risk_level),
        risk_category=risk_category,
        percentile=percentile,
        pillar_scores=pillar_scores,
        critical_alerts=critical_alerts,
        critical_flags=critical_flags,
        high_flags=high_flags,
        pathways=[],  # Generated by recommendations module
        action_plan=[],  # Generated by recommendations module
        personalized_message="",  # Generated by recommendations module
        assessment_date=datetime.utcnow(),
    )

    return result
