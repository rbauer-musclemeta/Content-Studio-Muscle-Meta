"""Recommendation endpoints for intervention planning.

This module provides endpoints for generating personalized intervention
recommendations based on catabolic risk assessment results.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from crf.assessment.calculator import CatabolicRiskCalculator
from crf.assessment.recommendations import RecommendationEngine
from crf.assessment.scoring import DISCLAIMER

from api.dependencies import (
    convert_biomarker_input,
    convert_patient_input,
    get_calculator,
    get_recommendation_engine,
)
from api.schemas import (
    InterventionPlanResponse,
    RecommendationCategoryOutput,
    RecommendationOutput,
    RecommendationPriorityOutput,
    RecommendationsRequest,
    RiskLevelOutput,
)


router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post(
    "",
    response_model=InterventionPlanResponse,
    summary="Generate intervention plan",
    description="""
Generate a personalized intervention plan based on catabolic risk assessment.

This endpoint analyzes patient data and risk factors to produce prioritized
recommendations across five categories:

**Recommendation Categories:**
- **Medical**: Clinical interventions, referrals, medication review
- **Nutrition**: Protein intake, caloric needs, dietary modifications
- **Exercise**: Resistance training, functional fitness, activity goals
- **Lifestyle**: Sleep optimization, stress management, habit changes
- **Monitoring**: Follow-up schedule, tracking metrics, reassessment timing

**Priority Levels:**
- **Critical**: Requires immediate attention
- **High**: Important interventions to implement soon
- **Medium**: Beneficial interventions for overall health
- **Low**: Optimization recommendations

**Validated Instrument Integration:**
Recommendations are keyed to validated instrument findings (SARC-F, MUST,
EWGSOP2) when applicable. These evidence-based recommendations appear first.

**Note:** This is an educational screening aid, not a medical device.
Recommendations should be reviewed with a qualified healthcare provider.
""",
    responses={
        200: {"description": "Intervention plan generated successfully"},
        422: {"description": "Validation error in request data"},
    },
)
async def generate_recommendations(
    request: RecommendationsRequest,
    calculator: CatabolicRiskCalculator = Depends(get_calculator),
    recommendation_engine: RecommendationEngine = Depends(get_recommendation_engine),
) -> InterventionPlanResponse:
    """Generate personalized intervention recommendations."""
    try:
        # Convert API models to internal models
        patient = convert_patient_input(request.patient)
        biomarkers = convert_biomarker_input(request.biomarkers)

        # Run assessment
        risk_score = calculator.assess_patient(patient, biomarkers=biomarkers)

        # Run validated instruments for instrument-driven recommendations
        instrument_results = calculator.run_validated_screens(patient)

        # Generate intervention plan
        plan = recommendation_engine.generate_plan(
            patient=patient,
            risk_score=risk_score,
            instrument_results=instrument_results,
        )

        # Convert recommendations to output format
        recommendations_output = [
            RecommendationOutput(
                title=rec.title,
                description=rec.description,
                category=RecommendationCategoryOutput(rec.category.value),
                priority=RecommendationPriorityOutput(rec.priority.value),
                rationale=rec.rationale,
                target_factors=rec.target_factors,
            )
            for rec in plan.recommendations
        ]

        return InterventionPlanResponse(
            patient_id=plan.patient_id,
            risk_level=RiskLevelOutput(plan.risk_level.value),
            recommendations=recommendations_output,
            follow_up_interval_days=plan.follow_up_interval_days,
            summary=plan.summary,
            disclaimer=DISCLAIMER,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
