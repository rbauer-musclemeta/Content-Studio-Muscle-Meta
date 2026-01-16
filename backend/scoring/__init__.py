"""
Assessment Scoring Engine Module

This module provides the core scoring algorithms for the CCRS Assessment.
"""

from .risk_tiers import (
    RISK_TIERS,
    get_risk_level,
    get_risk_color,
    get_risk_label,
)
from .pillar_calculator import calculate_pillar_scores, get_pillar_priority
from .flag_detector import detect_critical_flags, detect_high_flags
from .engine import (
    calculate_assessment_score,
    generate_full_results,
)
from .recommendations import (
    generate_pathways,
    generate_action_plan,
    generate_personalized_message,
)

__all__ = [
    "RISK_TIERS",
    "get_risk_level",
    "get_risk_color",
    "get_risk_label",
    "calculate_pillar_scores",
    "get_pillar_priority",
    "detect_critical_flags",
    "detect_high_flags",
    "calculate_assessment_score",
    "generate_full_results",
    "generate_pathways",
    "generate_action_plan",
    "generate_personalized_message",
]
