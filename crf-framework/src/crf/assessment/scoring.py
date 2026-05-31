"""Risk scoring and level classification."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from crf.models.risk_factors import RiskCategory, RiskFactor

# Calibration/validation status carried on every score. This tool has NOT been
# validated against clinical outcomes; its weights and thresholds are
# expert-judgment placeholders, not data-derived cutoffs.
VALIDATION_STATUS = "unvalidated_v1"

# Below this confidence (fraction of key inputs provided), the numeric score is
# considered unreliable and should be suppressed in favor of "insufficient data".
LOW_CONFIDENCE_THRESHOLD = 0.5

# Single source of truth for the safety disclaimer, reused across all surfaces.
DISCLAIMER = (
    "EDUCATIONAL SCREENING AID — NOT A MEDICAL DEVICE. This output is not "
    "validated against clinical outcomes and must not be used to diagnose, "
    "treat, or rule out any condition. Factor weights are expert-judgment "
    "placeholders, not validated cutoffs. Discuss any concerns with a "
    "qualified healthcare professional."
)


class RiskLevel(str, Enum):
    """Ordinal screening signal (internal ordering; not a clinical diagnosis)."""

    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"

    @property
    def screening_label(self) -> str:
        """User-facing screening language for this level.

        Deliberately avoids clinical-sounding verdicts ("severe risk"), since
        the bands are not validated cutoffs. Frames output as the number of
        flags worth discussing rather than a measured level of risk.
        """
        return {
            RiskLevel.LOW: "Few flags identified",
            RiskLevel.MODERATE: "Several flags identified",
            RiskLevel.HIGH: "Many flags identified",
            RiskLevel.SEVERE: "Numerous flags identified",
        }[self]


class CategoryScore(BaseModel):
    """Score breakdown for a specific risk category."""

    category: RiskCategory
    score: float = Field(ge=0, description="Score for this category")
    max_score: float = Field(gt=0, description="Maximum possible score")
    contributing_factors: list[str] = Field(default_factory=list)
    percentage: float = Field(ge=0, le=100, description="Percentage of max score")


class RiskScore(BaseModel):
    """Complete risk score with breakdown by category."""

    total_score: float = Field(ge=0, description="Raw catabolic burden present")
    max_possible_score: float = Field(
        gt=0, description="Reference burden mapped to 100% risk"
    )
    percentage: float = Field(
        ge=0, le=100, description="Risk percentage (burden vs reference, capped at 100)"
    )
    risk_level: RiskLevel = Field(description="Overall risk level classification")
    category_scores: list[CategoryScore] = Field(default_factory=list)
    top_risk_factors: list[str] = Field(
        default_factory=list, description="Top contributing risk factors"
    )
    biomarker_penalty: float = Field(
        default=0.0, description="Additional score from abnormal biomarkers"
    )
    confidence: float = Field(
        ge=0, le=1, default=1.0, description="Confidence in the assessment (0-1)"
    )
    validation_status: str = Field(
        default=VALIDATION_STATUS,
        description="Calibration/validation status of this score",
    )

    @property
    def is_reliable(self) -> bool:
        """Whether enough input was provided to trust the numeric score."""
        return self.confidence >= LOW_CONFIDENCE_THRESHOLD

    @classmethod
    def calculate_risk_level(cls, percentage: float) -> RiskLevel:
        """Determine risk level from percentage score."""
        if percentage < 20:
            return RiskLevel.LOW
        elif percentage < 40:
            return RiskLevel.MODERATE
        elif percentage < 60:
            return RiskLevel.HIGH
        else:
            return RiskLevel.SEVERE

    def get_category_ranking(self) -> list[CategoryScore]:
        """Get categories ranked by percentage score (highest first)."""
        return sorted(self.category_scores, key=lambda x: x.percentage, reverse=True)

    def get_highest_risk_category(self) -> Optional[CategoryScore]:
        """Get the category with highest risk percentage."""
        if not self.category_scores:
            return None
        return max(self.category_scores, key=lambda x: x.percentage)


class ScoringEngine:
    """Engine for calculating risk scores from factors and biomarkers."""

    # Thresholds for risk level determination
    LOW_THRESHOLD = 20
    MODERATE_THRESHOLD = 40
    HIGH_THRESHOLD = 60

    # Fraction of the all-factors-present theoretical maximum that represents a
    # realistically severe patient (i.e. the burden mapped to 100% risk).
    # No real patient presents with every catalogued risk factor at once, so
    # normalizing against the raw theoretical maximum would make the HIGH/SEVERE
    # bands effectively unreachable. A severe presentation carries roughly this
    # fraction of the total catalogued burden; scores are normalized against it
    # and capped at 100%.
    SEVERE_REFERENCE_FRACTION = 0.40

    # Maximum additional burden attributable to abnormal biomarkers. Only counted
    # toward the reference when biomarkers were actually assessed.
    BIOMARKER_HEADROOM = 15.0

    # Biomarker penalty weights
    BIOMARKER_WEIGHTS = {
        "albumin": 2.0,
        "crp": 2.5,
        "testosterone": 1.5,
        "cortisol": 1.5,
        "vitamin_d": 1.0,
        "il6": 2.0,
    }

    def calculate_category_score(
        self, factors: list[RiskFactor], category: RiskCategory
    ) -> CategoryScore:
        """Calculate score for a specific category."""
        category_factors = [f for f in factors if f.category == category]

        if not category_factors:
            return CategoryScore(
                category=category,
                score=0.0,
                max_score=1.0,
                percentage=0.0,
            )

        total_score = sum(f.contribution for f in category_factors)
        max_score = sum(f.weight for f in category_factors)
        contributing = [f.name for f in category_factors if f.present]

        percentage = (total_score / max_score * 100) if max_score > 0 else 0.0

        return CategoryScore(
            category=category,
            score=round(total_score, 2),
            max_score=round(max_score, 2),
            contributing_factors=contributing,
            percentage=round(percentage, 1),
        )

    def calculate_biomarker_penalty(
        self, abnormal_biomarkers: list[tuple[str, str]]
    ) -> float:
        """Calculate additional risk penalty from abnormal biomarkers.

        Args:
            abnormal_biomarkers: List of (biomarker_name, status) tuples
        """
        penalty = 0.0
        for name, status in abnormal_biomarkers:
            name_lower = name.lower().replace(" ", "_").replace("-", "_")
            weight = self.BIOMARKER_WEIGHTS.get(name_lower, 1.0)

            if status == "critical":
                penalty += weight * 1.5
            elif status in ["low", "high"]:
                penalty += weight * 0.75

        return round(penalty, 2)

    def calculate_total_score(
        self,
        factors: list[RiskFactor],
        biomarker_penalty: float = 0.0,
        biomarkers_assessed: bool = False,
        confidence: Optional[float] = None,
    ) -> RiskScore:
        """Calculate complete risk score from all factors.

        The raw catabolic burden (sum of present-factor contributions plus any
        biomarker penalty) is normalized against a *reference burden* that
        represents a realistically severe patient, rather than the theoretical
        maximum in which every catalogued factor is present at full severity.
        The resulting percentage is capped at 100%.

        Args:
            factors: All risk factors (present and absent) for the patient.
            biomarker_penalty: Additional burden from abnormal biomarkers.
            biomarkers_assessed: Whether biomarkers were measured. Only then is
                biomarker headroom included in the reference burden, so patients
                without lab work are not penalized with an inflated denominator.
            confidence: Optional caller-supplied data-completeness confidence
                (0-1). When omitted, a crude internal estimate is used. Callers
                with access to the raw inputs (e.g. the calculator) should pass
                a meaningful value so low-data scores can be flagged unreliable.
        """
        # Calculate category scores
        category_scores = []
        for category in RiskCategory:
            cat_score = self.calculate_category_score(factors, category)
            if cat_score.max_score > 0:
                category_scores.append(cat_score)

        # Raw catabolic burden actually present for this patient.
        total_score = sum(f.contribution for f in factors) + biomarker_penalty

        # Theoretical maximum (all factors at full weight). Biomarker headroom is
        # only included when labs were drawn, so an unassessed patient is scored
        # purely on the factors that could be evaluated.
        theoretical_max = sum(f.weight for f in factors)
        if biomarkers_assessed:
            theoretical_max += self.BIOMARKER_HEADROOM

        # Reference burden mapped to 100% risk. Guarded to stay positive.
        reference_burden = max(theoretical_max * self.SEVERE_REFERENCE_FRACTION, 1.0)

        percentage = min(100.0, total_score / reference_burden * 100)
        risk_level = RiskScore.calculate_risk_level(percentage)

        # Get top risk factors
        present_factors = [f for f in factors if f.present]
        sorted_factors = sorted(present_factors, key=lambda x: x.contribution, reverse=True)
        top_factors = [f.name for f in sorted_factors[:5]]

        # Prefer the caller-supplied data-completeness confidence. Fall back to a
        # crude internal estimate only when none is provided.
        if confidence is None:
            measured_factors = len([f for f in factors if f.present or f.severity == 0])
            confidence = min(1.0, measured_factors / len(factors)) if factors else 0.5

        return RiskScore(
            total_score=round(total_score, 2),
            max_possible_score=round(reference_burden, 2),
            percentage=round(percentage, 1),
            risk_level=risk_level,
            category_scores=category_scores,
            top_risk_factors=top_factors,
            biomarker_penalty=biomarker_penalty,
            confidence=round(confidence, 2),
        )
