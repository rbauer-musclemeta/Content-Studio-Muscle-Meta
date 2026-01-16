"""
Pillar Calculator Module

Calculates the 4-pillar risk profile from section scores.
"""

from typing import Dict, List, Tuple
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import SectionScores, PillarScores


def normalize_to_hundred(score: int, max_possible: int) -> int:
    """
    Normalize a score to a 0-100 scale.

    Args:
        score: The raw score
        max_possible: Maximum possible score for this section

    Returns:
        Normalized score out of 100
    """
    if max_possible == 0:
        return 0
    return min(100, round((score / max_possible) * 100))


def calculate_pillar_scores(section_scores: SectionScores) -> PillarScores:
    """
    Calculate the 4-pillar risk scores from section scores.

    The four pillars are:
    1. Exercise & Mobility - includes functional, muscle_balance, strength
    2. Nutrition & Metabolism - includes weight_loss, medications, biomarkers
    3. Recovery & Stress - includes medical_events, energy_sleep
    4. Balance & Brain Health - includes neurological, bone_health, warning_signs

    Args:
        section_scores: Individual section scores from the assessment

    Returns:
        PillarScores object with normalized scores for each pillar
    """
    # Pillar 1: Exercise & Mobility
    # Max possible: functional(85) + muscle_balance(75) + strength(65) = 225
    exercise_mobility = normalize_to_hundred(
        section_scores.functional
        + section_scores.muscle_balance
        + section_scores.strength,
        225,
    )

    # Pillar 2: Nutrition & Metabolism
    # Max possible: weight_loss(85) + medications(95) + biomarkers(60) = 240
    biomarkers = section_scores.biomarkers if section_scores.biomarkers else 0
    nutrition_metabolism = normalize_to_hundred(
        section_scores.weight_loss + section_scores.medications + biomarkers,
        240,
    )

    # Pillar 3: Recovery & Stress
    # Max possible: medical_events(85) + energy_sleep(60) = 145
    recovery_stress = normalize_to_hundred(
        section_scores.medical_events + section_scores.energy_sleep,
        145,
    )

    # Pillar 4: Balance & Brain Health
    # Max possible: neurological(85) + bone_health(75) + warning_signs(75) = 235
    balance_brain = normalize_to_hundred(
        section_scores.neurological
        + section_scores.bone_health
        + section_scores.warning_signs,
        235,
    )

    return PillarScores(
        exercise_mobility=exercise_mobility,
        nutrition_metabolism=nutrition_metabolism,
        recovery_stress=recovery_stress,
        balance_brain=balance_brain,
    )


def get_pillar_priority(pillar_scores: PillarScores) -> List[Dict[str, any]]:
    """
    Get the pillars sorted by priority (highest risk first).

    Args:
        pillar_scores: The calculated pillar scores

    Returns:
        List of pillar information sorted by priority (highest score = highest priority)
    """
    pillars = [
        {
            "key": "exercise_mobility",
            "score": pillar_scores.exercise_mobility,
            "name": "Exercise & Mobility",
            "description": "Physical capability, strength, and movement quality",
        },
        {
            "key": "nutrition_metabolism",
            "score": pillar_scores.nutrition_metabolism,
            "name": "Nutrition & Metabolism",
            "description": "Weight management, medication effects, and metabolic health",
        },
        {
            "key": "recovery_stress",
            "score": pillar_scores.recovery_stress,
            "name": "Recovery & Stress",
            "description": "Medical recovery, energy levels, and sleep quality",
        },
        {
            "key": "balance_brain",
            "score": pillar_scores.balance_brain,
            "name": "Balance & Brain Health",
            "description": "Neurological function, bone health, and early warning signs",
        },
    ]

    # Sort by score descending (higher score = higher risk = higher priority)
    return sorted(pillars, key=lambda p: p["score"], reverse=True)


def get_pillar_risk_level(score: int) -> str:
    """
    Determine the risk level for a single pillar score.

    Args:
        score: Pillar score (0-100)

    Returns:
        Risk level string for display
    """
    if score <= 25:
        return "Low"
    elif score <= 55:
        return "Moderate"
    elif score <= 85:
        return "High"
    else:
        return "Critical"
