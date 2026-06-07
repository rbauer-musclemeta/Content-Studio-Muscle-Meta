"""MUST - Malnutrition Universal Screening Tool.

A three-component screen summed to an overall malnutrition risk:

1. BMI:        > 20 -> 0,  18.5-20 -> 1,  < 18.5 -> 2
2. Weight loss (unplanned, 3-6 months): < 5% -> 0,  5-10% -> 1,  > 10% -> 2
3. Acute disease effect: acutely ill AND no/negligible nutritional intake for
   >= 5 days -> 2, else 0

Total: 0 = low risk, 1 = medium risk, >= 2 = high risk.

Reference: BAPEN Malnutrition Advisory Group, "MUST" (2003). Note: MUST is
published by BAPEN; confirm usage terms before redistribution.
"""

from typing import Optional

from crf.instruments.base import BaseInstrument, InstrumentResult
from crf.models.patient import Patient


def _bmi_score(bmi: float) -> int:
    if bmi > 20:
        return 0
    if bmi >= 18.5:
        return 1
    return 2


def _weight_loss_score(loss_percent: float) -> int:
    if loss_percent < 5:
        return 0
    if loss_percent <= 10:
        return 1
    return 2


def _acute_disease_score(acutely_ill: bool, days_without_nutrition: int) -> int:
    if acutely_ill and days_without_nutrition >= 5:
        return 2
    return 0


def _category(total: int) -> tuple[str, str]:
    if total == 0:
        return "Low risk", "Routine clinical care; repeat screening per setting."
    if total == 1:
        return (
            "Medium risk",
            "Observe: document intake for 3 days; repeat screening; refer if intake inadequate.",
        )
    return (
        "High risk",
        "Treat: refer to dietitian/nutrition support; set goals and monitor.",
    )


class Must(BaseInstrument):
    """MUST malnutrition screening instrument."""

    name = "MUST"
    citation = "BAPEN Malnutrition Advisory Group, MUST (2003)"

    def score(self, patient: Patient) -> InstrumentResult:
        # BMI is always derivable from the mandatory profile. Weight-loss history
        # is required; unknown (None) is not treated as zero loss.
        weight_loss_percent: Optional[float] = patient.weight_loss_percent
        if weight_loss_percent is None:
            return self.not_assessable(["recent_weight_loss_kg"])

        bmi = patient.profile.bmi
        ctx = patient.clinical_context

        bmi_pts = _bmi_score(bmi)
        loss_pts = _weight_loss_score(weight_loss_percent)
        acute_pts = _acute_disease_score(ctx.acutely_ill, ctx.days_without_nutrition)
        total = bmi_pts + loss_pts + acute_pts

        category, action = _category(total)
        interpretation = (
            f"MUST {total} (BMI {bmi_pts} + weight-loss {loss_pts} + acute {acute_pts}) "
            f"-> {category}. {action}"
        )

        return InstrumentResult(
            instrument=self.name,
            applicable=True,
            category=category,
            raw_score=float(total),
            interpretation=interpretation,
            citation=self.citation,
        )
