"""Helper functions for calculations and formatting."""

import textwrap
from typing import Literal

from crf.assessment.scoring import DISCLAIMER, RiskScore
from crf.assessment.recommendations import InterventionPlan


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    """Calculate Body Mass Index.

    Args:
        weight_kg: Weight in kilograms
        height_cm: Height in centimeters

    Returns:
        BMI value rounded to 1 decimal place
    """
    if height_cm <= 0 or weight_kg <= 0:
        raise ValueError("Height and weight must be positive values")

    height_m = height_cm / 100
    return round(weight_kg / (height_m**2), 1)


def classify_bmi(bmi: float) -> str:
    """Classify BMI into categories.

    Args:
        bmi: Body Mass Index value

    Returns:
        BMI classification string
    """
    if bmi < 16:
        return "Severe Underweight"
    elif bmi < 17:
        return "Moderate Underweight"
    elif bmi < 18.5:
        return "Mild Underweight"
    elif bmi < 25:
        return "Normal Weight"
    elif bmi < 30:
        return "Overweight"
    elif bmi < 35:
        return "Obesity Class I"
    elif bmi < 40:
        return "Obesity Class II"
    else:
        return "Obesity Class III"


def calculate_bmr(
    weight_kg: float,
    height_cm: float,
    age: int,
    sex: Literal["male", "female"],
) -> float:
    """Calculate Basal Metabolic Rate using Mifflin-St Jeor equation.

    Args:
        weight_kg: Weight in kilograms
        height_cm: Height in centimeters
        age: Age in years
        sex: Biological sex ('male' or 'female')

    Returns:
        BMR in kcal/day
    """
    if sex.lower() == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    return round(bmr, 0)


def format_risk_report(
    risk_score: RiskScore,
    intervention_plan: InterventionPlan | None = None,
) -> str:
    """Format a complete risk assessment report.

    Args:
        risk_score: Calculated risk score
        intervention_plan: Optional intervention plan

    Returns:
        Formatted report string
    """
    lines = []
    lines.append("=" * 60)
    lines.append("CATABOLIC RISK SCREENING REPORT")
    lines.append("=" * 60)
    lines.append("")

    # Disclaimer up top — not buried at the bottom.
    for line in textwrap.wrap(DISCLAIMER, width=58):
        lines.append(line)
    lines.append(f"Status: {risk_score.validation_status}")
    lines.append("")

    # Screening Summary
    lines.append("SCREENING SUMMARY")
    lines.append("-" * 40)
    lines.append(f"Screening Signal: {risk_score.risk_level.screening_label}")
    if risk_score.is_reliable:
        lines.append(
            f"Catabolic Burden: {risk_score.total_score:.1f} / "
            f"{risk_score.max_possible_score:.1f} (reference)"
        )
        lines.append(f"Relative Score: {risk_score.percentage:.1f}%")
    else:
        lines.append(
            "Relative Score: not shown — insufficient data for a reliable result"
        )
    lines.append(f"Data Completeness: {risk_score.confidence * 100:.0f}%")
    lines.append("")

    # Top Risk Factors
    if risk_score.top_risk_factors:
        lines.append("TOP RISK FACTORS")
        lines.append("-" * 40)
        for i, factor in enumerate(risk_score.top_risk_factors, 1):
            lines.append(f"  {i}. {factor}")
        lines.append("")

    # Category Breakdown
    if risk_score.category_scores:
        lines.append("RISK BY CATEGORY")
        lines.append("-" * 40)
        for cat_score in risk_score.get_category_ranking():
            bar_length = int(cat_score.percentage / 5)
            bar = "█" * bar_length + "░" * (20 - bar_length)
            lines.append(f"  {cat_score.category.value.capitalize():12} [{bar}] {cat_score.percentage:5.1f}%")
        lines.append("")

    # Intervention Plan
    if intervention_plan:
        lines.append("INTERVENTION PLAN")
        lines.append("-" * 40)
        lines.append(f"Follow-up in: {intervention_plan.follow_up_interval_days} days")
        lines.append("")

        if intervention_plan.recommendations:
            lines.append("RECOMMENDATIONS")
            lines.append("-" * 40)

            # Group by priority
            for priority in ["critical", "high", "medium", "low"]:
                priority_recs = [
                    r for r in intervention_plan.recommendations
                    if r.priority.value == priority
                ]
                if priority_recs:
                    lines.append(f"\n  [{priority.upper()}]")
                    for rec in priority_recs:
                        lines.append(f"  • {rec.title}")
                        # Wrap description
                        desc_words = rec.description.split()
                        current_line = "    "
                        for word in desc_words:
                            if len(current_line) + len(word) + 1 > 58:
                                lines.append(current_line)
                                current_line = "    " + word
                            else:
                                current_line += " " + word if current_line.strip() else word
                        if current_line.strip():
                            lines.append(current_line)
                        lines.append("")

    lines.append("=" * 60)
    for line in textwrap.wrap(DISCLAIMER, width=58):
        lines.append(line)
    lines.append("=" * 60)

    return "\n".join(lines)


def calculate_protein_needs(
    weight_kg: float,
    age: int,
    activity_level: str = "sedentary",
    has_chronic_disease: bool = False,
) -> dict:
    """Calculate recommended protein intake.

    Args:
        weight_kg: Body weight in kilograms
        age: Age in years
        activity_level: Activity level string
        has_chronic_disease: Whether patient has chronic disease

    Returns:
        Dictionary with protein recommendations
    """
    # Base protein needs (g/kg/day)
    if age >= 65:
        base = 1.2
    elif age >= 50:
        base = 1.0
    else:
        base = 0.8

    # Adjust for activity
    activity_adjustments = {
        "sedentary": 0,
        "light": 0.1,
        "moderate": 0.2,
        "active": 0.4,
        "very_active": 0.6,
    }
    base += activity_adjustments.get(activity_level.lower(), 0)

    # Adjust for chronic disease
    if has_chronic_disease:
        base += 0.2

    # Calculate totals
    g_per_kg = round(base, 1)
    total_daily = round(base * weight_kg, 0)
    per_meal = round(total_daily / 4, 0)  # Assume 4 meals

    return {
        "g_per_kg": g_per_kg,
        "total_daily_g": total_daily,
        "per_meal_g": per_meal,
        "rationale": f"Based on age ({age}), activity ({activity_level}), "
        f"chronic disease ({has_chronic_disease})",
    }
