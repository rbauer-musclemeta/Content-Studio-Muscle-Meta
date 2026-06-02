"""Assessment endpoints for catabolic risk evaluation.

This module provides endpoints for running catabolic risk assessments,
including quick screening with validated instruments, full assessments
with biomarkers, and validated-only instrument screening.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from crf.assessment.calculator import CatabolicRiskCalculator
from crf.assessment.scoring import DISCLAIMER

from api.dependencies import (
    convert_biomarker_input,
    convert_patient_input,
    get_calculator,
)
from api.schemas import (
    AssessmentRequest,
    AssessmentResponse,
    CategoryScoreOutput,
    ExploratoryCompositeOutput,
    InstrumentResultOutput,
    QuickScreenRequest,
    QuickScreenResponse,
    RiskLevelOutput,
    RiskScoreOutput,
    ValidatedInstrumentsRequest,
    ValidatedInstrumentsResponse,
    ValidatedSummaryOutput,
)


router = APIRouter(prefix="/assessments", tags=["Assessments"])


@router.post(
    "/assess",
    response_model=AssessmentResponse,
    summary="Full catabolic risk assessment",
    description="""
Perform a comprehensive catabolic risk assessment with optional biomarker data.

This endpoint evaluates patient demographics, lifestyle factors, chronic conditions,
medications, and optional lab values to produce a detailed risk score with category
breakdowns.

**Validated Instruments Included:**
- SARC-F: Sarcopenia screening questionnaire
- MUST: Malnutrition Universal Screening Tool
- EWGSOP2: European Working Group sarcopenia algorithm

**Note:** This is an educational screening aid, not a medical device.
""",
    responses={
        200: {"description": "Assessment completed successfully"},
        422: {"description": "Validation error in request data"},
    },
)
async def full_assessment(
    request: AssessmentRequest,
    calculator: CatabolicRiskCalculator = Depends(get_calculator),
) -> AssessmentResponse:
    """Perform full catabolic risk assessment with optional biomarkers."""
    try:
        # Convert API models to internal models
        patient = convert_patient_input(request.patient)
        biomarkers = convert_biomarker_input(request.biomarkers)

        # Run assessment
        risk_score = calculator.assess_patient(patient, biomarkers=biomarkers)

        # Run validated instruments
        instrument_results = calculator.run_validated_screens(patient)

        # Convert risk score to output format
        risk_score_output = RiskScoreOutput(
            total_score=risk_score.total_score,
            max_possible_score=risk_score.max_possible_score,
            percentage=risk_score.percentage,
            risk_level=RiskLevelOutput(risk_score.risk_level.value),
            category_scores=[
                CategoryScoreOutput(
                    category=cs.category.value,
                    score=cs.score,
                    max_score=cs.max_score,
                    percentage=cs.percentage,
                    contributing_factors=cs.contributing_factors,
                )
                for cs in risk_score.category_scores
            ],
            top_risk_factors=risk_score.top_risk_factors,
            biomarker_penalty=risk_score.biomarker_penalty,
            confidence=risk_score.confidence,
            is_reliable=risk_score.is_reliable,
            validation_status=risk_score.validation_status,
        )

        # Convert instrument results to output format
        instruments_output = [
            InstrumentResultOutput(
                instrument=r.instrument,
                applicable=r.applicable,
                category=r.category,
                raw_score=r.raw_score,
                interpretation=r.interpretation,
                citation=r.citation,
                missing_inputs=r.missing_inputs,
            )
            for r in instrument_results
        ]

        return AssessmentResponse(
            risk_score=risk_score_output,
            validated_instruments=instruments_output,
            disclaimer=DISCLAIMER,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )


@router.post(
    "/quick-screen",
    response_model=QuickScreenResponse,
    summary="Quick screening with panel-first output",
    description="""
Perform a quick screening without detailed biomarkers.

This endpoint returns a **panel-first output structure** where validated
instrument results (SARC-F, MUST, EWGSOP2) are the headline, and the
exploratory heuristic composite score is secondary.

**Validated Instruments:**
- **SARC-F**: Sarcopenia screening (requires questionnaire responses)
- **MUST**: Malnutrition screening (requires BMI, weight loss, clinical context)
- **EWGSOP2**: Sarcopenia diagnosis (requires physical measurements)

**Exploratory Composite:**
The composite score uses expert-judgment heuristics and has NOT been
validated against clinical outcomes. It should not be used for diagnosis.

**Note:** This is an educational screening aid, not a medical device.
""",
    responses={
        200: {"description": "Screening completed successfully"},
        422: {"description": "Validation error in request data"},
    },
)
async def quick_screen(
    request: QuickScreenRequest,
    calculator: CatabolicRiskCalculator = Depends(get_calculator),
) -> QuickScreenResponse:
    """Perform quick screening with panel-first output."""
    try:
        # Convert API model to internal model
        patient = convert_patient_input(request.patient)

        # Run quick screen
        result = calculator.quick_screen(patient)

        # Convert to output format
        validated_instruments = [
            InstrumentResultOutput(
                instrument=r["instrument"],
                applicable=r["applicable"],
                category=r.get("category"),
                raw_score=r.get("raw_score"),
                interpretation=r.get("interpretation"),
                citation=r["citation"],
                missing_inputs=r.get("missing_inputs", []),
            )
            for r in result["validated_instruments"]
        ]

        validated_summary = ValidatedSummaryOutput(
            sarcopenia_screen=result["validated_summary"].get("sarcopenia_screen"),
            sarcopenia_confirmed=result["validated_summary"].get("sarcopenia_confirmed"),
            malnutrition_risk=result["validated_summary"].get("malnutrition_risk"),
            any_positive=result["validated_summary"].get("any_positive", False),
        )

        exploratory = result["exploratory_composite"]
        exploratory_composite = ExploratoryCompositeOutput(
            screening_signal=exploratory["screening_signal"],
            top_concerns=exploratory["top_concerns"],
            confidence=exploratory["confidence"],
            reliable=exploratory["reliable"],
            validation_status=exploratory["validation_status"],
            risk_level=exploratory.get("risk_level"),
            risk_percentage=exploratory.get("risk_percentage"),
        )

        return QuickScreenResponse(
            validated_instruments=validated_instruments,
            validated_summary=validated_summary,
            exploratory_composite=exploratory_composite,
            recommendation=result["recommendation"],
            disclaimer=result["disclaimer"],
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )


@router.post(
    "/validated-instruments",
    response_model=ValidatedInstrumentsResponse,
    summary="Run validated instruments only",
    description="""
Run only the validated screening instruments (SARC-F, MUST, EWGSOP2)
without the exploratory heuristic scoring.

This endpoint is useful when you want to use only peer-reviewed,
validated assessment tools without the composite risk score.

**Instruments:**
- **SARC-F** (Malmstrom & Morley 2013): 5-item sarcopenia screening
  questionnaire. Requires sarcf responses in patient data.
- **MUST** (BAPEN 2003): Malnutrition Universal Screening Tool.
  Requires BMI, weight loss history, and clinical context.
- **EWGSOP2** (Cruz-Jentoft et al. 2019): European Working Group
  sarcopenia diagnostic algorithm. Requires physical measurements
  (grip strength, chair stand, gait speed, muscle mass).

Each instrument returns `applicable=false` if its required inputs
are missing, along with a list of missing inputs.

**Note:** This is an educational screening aid, not a medical device.
""",
    responses={
        200: {"description": "Instruments scored successfully"},
        422: {"description": "Validation error in request data"},
    },
)
async def validated_instruments(
    request: ValidatedInstrumentsRequest,
    calculator: CatabolicRiskCalculator = Depends(get_calculator),
) -> ValidatedInstrumentsResponse:
    """Run validated screening instruments only."""
    try:
        # Convert API model to internal model
        patient = convert_patient_input(request.patient)

        # Run validated screens
        instrument_results = calculator.run_validated_screens(patient)

        # Convert to output format
        instruments_output = [
            InstrumentResultOutput(
                instrument=r.instrument,
                applicable=r.applicable,
                category=r.category,
                raw_score=r.raw_score,
                interpretation=r.interpretation,
                citation=r.citation,
                missing_inputs=r.missing_inputs,
            )
            for r in instrument_results
        ]

        # Build summary
        summary = ValidatedSummaryOutput(
            sarcopenia_screen=None,
            sarcopenia_confirmed=None,
            malnutrition_risk=None,
            any_positive=False,
        )

        for r in instrument_results:
            if not r.applicable:
                continue

            if r.instrument == "SARC-F":
                summary.sarcopenia_screen = r.category
                if r.category and "positive" in r.category.lower():
                    summary.any_positive = True

            elif r.instrument == "EWGSOP2":
                summary.sarcopenia_confirmed = r.category
                if r.category and r.category not in ["No sarcopenia", "Probable sarcopenia"]:
                    summary.any_positive = True

            elif r.instrument == "MUST":
                summary.malnutrition_risk = r.category
                if r.category in ["Medium risk", "High risk"]:
                    summary.any_positive = True

        return ValidatedInstrumentsResponse(
            instruments=instruments_output,
            summary=summary,
            disclaimer=DISCLAIMER,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
