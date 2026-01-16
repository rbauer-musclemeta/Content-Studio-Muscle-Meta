"""
Risk Tier Classification Module

Defines risk tiers and provides functions to classify scores into risk levels.
"""

from typing import Dict, Any

# Risk tier definitions with score ranges and styling
RISK_TIERS: Dict[str, Dict[str, Any]] = {
    "minimal": {
        "min": 0,
        "max": 25,
        "label": "Minimal Risk",
        "color": "#10B981",
        "description": "Your muscle health markers are excellent. Focus on maintenance.",
    },
    "low-moderate": {
        "min": 26,
        "max": 55,
        "label": "Low-Moderate Risk",
        "color": "#FBBF24",
        "description": "Some areas need attention. Small changes can prevent future issues.",
    },
    "moderate-high": {
        "min": 56,
        "max": 85,
        "label": "Moderate-High Risk",
        "color": "#F97316",
        "description": "Multiple risk factors identified. Intervention recommended within 30 days.",
    },
    "high": {
        "min": 86,
        "max": 120,
        "label": "High Risk",
        "color": "#EF4444",
        "description": "Significant catabolic risk detected. Immediate action recommended.",
    },
    "critical": {
        "min": 121,
        "max": 200,
        "label": "Critical Risk",
        "color": "#7F1D1D",
        "description": "Urgent attention required. Multiple critical factors present.",
    },
}


def get_risk_level(score: int, max_score: int = 200) -> str:
    """
    Determine the risk level based on the score percentage.

    Args:
        score: The total assessment score
        max_score: Maximum possible score (default 200)

    Returns:
        Risk level string: "minimal", "low-moderate", "moderate-high", "high", or "critical"
    """
    percent_score = (score / max_score) * 100

    if percent_score <= 12.5:
        return "minimal"
    elif percent_score <= 27.5:
        return "low-moderate"
    elif percent_score <= 42.5:
        return "moderate-high"
    elif percent_score <= 60:
        return "high"
    else:
        return "critical"


def get_risk_color(risk_level: str) -> str:
    """
    Get the display color for a risk level.

    Args:
        risk_level: The risk level string

    Returns:
        Hex color code for the risk level
    """
    tier = RISK_TIERS.get(risk_level)
    return tier["color"] if tier else "#6B7280"


def get_risk_label(risk_level: str) -> str:
    """
    Get the human-readable label for a risk level.

    Args:
        risk_level: The risk level string

    Returns:
        Human-readable risk label
    """
    tier = RISK_TIERS.get(risk_level)
    return tier["label"] if tier else "Unknown Risk"


def get_risk_description(risk_level: str) -> str:
    """
    Get the description for a risk level.

    Args:
        risk_level: The risk level string

    Returns:
        Description of what the risk level means
    """
    tier = RISK_TIERS.get(risk_level)
    return tier["description"] if tier else ""
