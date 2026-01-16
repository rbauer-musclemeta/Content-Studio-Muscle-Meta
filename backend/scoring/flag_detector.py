"""
Flag Detector Module

Detects critical and high-risk flags from assessment responses and scores.
"""

from typing import List, Dict, Any
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import SectionScores, AssessmentResponse


def detect_critical_flags(
    responses: List[AssessmentResponse], section_scores: SectionScores
) -> List[str]:
    """
    Detect critical risk flags that require immediate attention.

    Critical flags indicate conditions that significantly increase
    the risk of rapid muscle loss and require urgent intervention.

    Args:
        responses: List of assessment responses
        section_scores: Calculated section scores

    Returns:
        List of critical flag identifiers
    """
    flags: List[str] = []

    # Create response lookup for easier access
    response_map = {r.question_id: r for r in responses}

    # Critical: Rapid weight loss (>10% in 6 months)
    weight_loss_response = response_map.get("weight_loss_percent")
    if weight_loss_response:
        try:
            weight_loss_value = float(weight_loss_response.value)
            if weight_loss_value >= 10:
                flags.append("RAPID_WEIGHT_LOSS")
        except (ValueError, TypeError):
            pass

    # Critical: Recent hospitalization (within 30 days)
    hospital_response = response_map.get("recent_hospitalization")
    if hospital_response and hospital_response.value == "within_30_days":
        flags.append("RECENT_HOSPITALIZATION")

    # Critical: GLP-1 + rapid weight loss combo
    glp1_response = response_map.get("glp1_medication")
    if glp1_response and glp1_response.value == "yes":
        if "RAPID_WEIGHT_LOSS" in flags:
            flags.append("GLP1_MUSCLE_RISK")

    # Critical: Very low functional score (severe impairment)
    if section_scores.functional >= 60:
        flags.append("SEVERE_FUNCTIONAL_DECLINE")

    # Critical: Multiple high-risk medications
    if section_scores.medications >= 70:
        flags.append("HIGH_MEDICATION_RISK")

    # Critical: Recent major surgery
    surgery_response = response_map.get("surgery_recent")
    if surgery_response and surgery_response.value in ["within_30_days", "within_60_days"]:
        flags.append("RECENT_SURGERY")

    # Critical: Falls in past 6 months with injury
    falls_response = response_map.get("falls_with_injury")
    if falls_response and int(falls_response.value or 0) >= 2:
        flags.append("RECURRENT_FALLS")

    # Critical: Very low protein intake with weight loss
    protein_response = response_map.get("protein_intake")
    if protein_response:
        try:
            protein_value = float(protein_response.value)
            if protein_value < 0.5 and "RAPID_WEIGHT_LOSS" in flags:
                flags.append("SEVERE_PROTEIN_DEFICIENCY")
        except (ValueError, TypeError):
            pass

    return flags


def detect_high_flags(
    responses: List[AssessmentResponse], section_scores: SectionScores
) -> List[str]:
    """
    Detect high-risk flags that require attention but are not critical.

    High flags indicate conditions that increase catabolic risk
    and benefit from intervention within 30 days.

    Args:
        responses: List of assessment responses
        section_scores: Calculated section scores

    Returns:
        List of high-risk flag identifiers
    """
    flags: List[str] = []

    # Create response lookup
    response_map = {r.question_id: r for r in responses}

    # High: Moderate functional decline
    if 30 <= section_scores.functional < 60:
        flags.append("FUNCTIONAL_DECLINE")

    # High: GLP-1 medication alone (without rapid weight loss)
    glp1_response = response_map.get("glp1_medication")
    if glp1_response and glp1_response.value == "yes":
        flags.append("GLP1_MONITORING")

    # High: Low protein intake
    protein_response = response_map.get("protein_intake")
    if protein_response:
        try:
            protein_value = float(protein_response.value)
            if protein_value < 0.8:
                flags.append("LOW_PROTEIN")
        except (ValueError, TypeError):
            pass

    # High: Sleep issues
    if section_scores.energy_sleep >= 40:
        flags.append("SLEEP_QUALITY_CONCERN")

    # High: Bone health concerns
    if section_scores.bone_health >= 50:
        flags.append("BONE_HEALTH_RISK")

    # High: No resistance training
    resistance_response = response_map.get("resistance_training")
    if resistance_response and resistance_response.value == "no":
        flags.append("NO_RESISTANCE_TRAINING")

    # High: Sedentary lifestyle
    activity_response = response_map.get("activity_level")
    if activity_response and activity_response.value in ["sedentary", "very_low"]:
        flags.append("SEDENTARY_LIFESTYLE")

    # High: Long-term steroid use
    steroid_response = response_map.get("steroid_use")
    if steroid_response and steroid_response.value in ["current", "recent"]:
        flags.append("STEROID_USE")

    # High: PPI use (proton pump inhibitors)
    ppi_response = response_map.get("ppi_use")
    if ppi_response and ppi_response.value == "yes":
        flags.append("PPI_USE")

    # High: Moderate weight loss (5-10%)
    weight_loss_response = response_map.get("weight_loss_percent")
    if weight_loss_response:
        try:
            weight_loss_value = float(weight_loss_response.value)
            if 5 <= weight_loss_value < 10:
                flags.append("MODERATE_WEIGHT_LOSS")
        except (ValueError, TypeError):
            pass

    # High: Cognitive concerns
    if section_scores.neurological >= 40:
        flags.append("COGNITIVE_CONCERN")

    # High: Grip strength below threshold
    grip_response = response_map.get("grip_strength")
    if grip_response and grip_response.value == "below_threshold":
        flags.append("LOW_GRIP_STRENGTH")

    return flags


# Alert templates for generating user-facing alerts
ALERT_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "RAPID_WEIGHT_LOSS": {
        "severity": "critical",
        "category": "Weight Loss",
        "message": "Rapid weight loss detected (>10% in 6 months). This significantly increases muscle loss risk.",
        "action": "Contact healthcare provider within 1 week. Implement high-protein protocol.",
        "timeframe": "7 days",
    },
    "GLP1_MUSCLE_RISK": {
        "severity": "critical",
        "category": "Medication Risk",
        "message": "GLP-1 medication combined with rapid weight loss creates high muscle loss potential.",
        "action": "Implement high-protein diet (1.2-1.6g/kg) and resistance training immediately.",
        "timeframe": "3 days",
    },
    "RECENT_HOSPITALIZATION": {
        "severity": "urgent",
        "category": "Medical Event",
        "message": "Recent hospitalization increases catabolic risk significantly.",
        "action": "Follow post-discharge recovery protocol with emphasis on nutrition and mobility.",
        "timeframe": "14 days",
    },
    "RECENT_SURGERY": {
        "severity": "urgent",
        "category": "Medical Event",
        "message": "Recent surgery requires careful muscle preservation strategies.",
        "action": "Follow surgeon's guidelines while implementing gentle protein optimization.",
        "timeframe": "14 days",
    },
    "SEVERE_FUNCTIONAL_DECLINE": {
        "severity": "critical",
        "category": "Functional Performance",
        "message": "Your functional performance indicates significant impairment.",
        "action": "Consult with physical therapist for comprehensive evaluation.",
        "timeframe": "7 days",
    },
    "FUNCTIONAL_DECLINE": {
        "severity": "warning",
        "category": "Functional Performance",
        "message": "Your functional performance indicates mild to moderate impairment.",
        "action": "Begin structured exercise program this week.",
        "timeframe": "7 days",
    },
    "HIGH_MEDICATION_RISK": {
        "severity": "urgent",
        "category": "Medication Risk",
        "message": "Multiple medications affecting muscle metabolism detected.",
        "action": "Review medications with healthcare provider. Do not stop any medications without guidance.",
        "timeframe": "14 days",
    },
    "RECURRENT_FALLS": {
        "severity": "critical",
        "category": "Safety",
        "message": "Multiple falls with injury indicate significant balance and strength concerns.",
        "action": "Get balance assessment and implement fall prevention strategies.",
        "timeframe": "7 days",
    },
    "SEVERE_PROTEIN_DEFICIENCY": {
        "severity": "critical",
        "category": "Nutrition",
        "message": "Very low protein intake combined with weight loss accelerates muscle loss.",
        "action": "Increase protein intake to minimum 1.0g/kg body weight immediately.",
        "timeframe": "3 days",
    },
    "GLP1_MONITORING": {
        "severity": "warning",
        "category": "Medication",
        "message": "GLP-1 medications require muscle monitoring during use.",
        "action": "Ensure adequate protein intake and maintain resistance training.",
        "timeframe": "ongoing",
    },
    "LOW_PROTEIN": {
        "severity": "warning",
        "category": "Nutrition",
        "message": "Protein intake below optimal levels for muscle preservation.",
        "action": "Increase protein to 1.0-1.2g/kg body weight per day.",
        "timeframe": "7 days",
    },
    "SLEEP_QUALITY_CONCERN": {
        "severity": "warning",
        "category": "Recovery",
        "message": "Poor sleep quality affects muscle recovery and metabolism.",
        "action": "Implement sleep hygiene improvements and consider sleep assessment.",
        "timeframe": "14 days",
    },
    "BONE_HEALTH_RISK": {
        "severity": "warning",
        "category": "Bone Health",
        "message": "Bone health indicators suggest increased fracture risk.",
        "action": "Discuss bone density testing with healthcare provider.",
        "timeframe": "30 days",
    },
    "NO_RESISTANCE_TRAINING": {
        "severity": "warning",
        "category": "Exercise",
        "message": "No resistance training increases muscle loss risk significantly.",
        "action": "Begin basic resistance training program 2-3x per week.",
        "timeframe": "7 days",
    },
    "SEDENTARY_LIFESTYLE": {
        "severity": "warning",
        "category": "Activity",
        "message": "Sedentary lifestyle accelerates age-related muscle loss.",
        "action": "Increase daily movement. Target 7,500+ steps or equivalent activity.",
        "timeframe": "7 days",
    },
    "STEROID_USE": {
        "severity": "warning",
        "category": "Medication",
        "message": "Corticosteroid use can accelerate muscle and bone loss.",
        "action": "Discuss bone and muscle protection strategies with prescribing doctor.",
        "timeframe": "14 days",
    },
    "PPI_USE": {
        "severity": "warning",
        "category": "Medication",
        "message": "Long-term PPI use may affect nutrient absorption and bone health.",
        "action": "Ensure adequate B12, calcium, and magnesium intake.",
        "timeframe": "30 days",
    },
    "MODERATE_WEIGHT_LOSS": {
        "severity": "warning",
        "category": "Weight Loss",
        "message": "Moderate unintentional weight loss detected. Monitor closely.",
        "action": "Track weight weekly and ensure adequate protein intake.",
        "timeframe": "14 days",
    },
    "COGNITIVE_CONCERN": {
        "severity": "warning",
        "category": "Neurological",
        "message": "Cognitive indicators suggest need for further evaluation.",
        "action": "Consider cognitive screening with healthcare provider.",
        "timeframe": "30 days",
    },
    "LOW_GRIP_STRENGTH": {
        "severity": "warning",
        "category": "Strength",
        "message": "Grip strength below age-appropriate threshold.",
        "action": "Begin grip strengthening exercises and overall resistance training.",
        "timeframe": "7 days",
    },
}
