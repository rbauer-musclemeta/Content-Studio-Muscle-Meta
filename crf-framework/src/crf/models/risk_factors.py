"""Risk factor models for catabolic assessment."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class RiskCategory(str, Enum):
    """Categories of catabolic risk factors."""

    NUTRITIONAL = "nutritional"
    PHYSICAL = "physical"
    MEDICAL = "medical"
    LIFESTYLE = "lifestyle"
    AGE_RELATED = "age_related"
    HORMONAL = "hormonal"


class RiskFactor(BaseModel):
    """Individual risk factor with weight and category."""

    name: str = Field(..., description="Risk factor name")
    category: RiskCategory = Field(..., description="Risk category")
    weight: float = Field(
        default=1.0, ge=0, le=5, description="Weight/importance of this factor (0-5)"
    )
    present: bool = Field(default=False, description="Whether this risk factor is present")
    severity: float = Field(
        default=0.0, ge=0, le=1, description="Severity if present (0-1)"
    )
    description: Optional[str] = Field(default=None, description="Description of the risk factor")

    @property
    def contribution(self) -> float:
        """Calculate this factor's contribution to overall risk."""
        if not self.present:
            return 0.0
        return self.weight * self.severity


class RiskFactors(BaseModel):
    """Collection of risk factors for a patient."""

    # Nutritional factors
    inadequate_protein: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Inadequate Protein Intake",
            category=RiskCategory.NUTRITIONAL,
            weight=2.5,
            description="Protein intake below 0.8g/kg/day",
        )
    )
    caloric_deficit: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Caloric Deficit",
            category=RiskCategory.NUTRITIONAL,
            weight=2.0,
            description="Chronic caloric deficit > 500 kcal/day",
        )
    )
    malnutrition_risk: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Malnutrition Risk",
            category=RiskCategory.NUTRITIONAL,
            weight=3.0,
            description="Signs of malnutrition or nutrient deficiencies",
        )
    )

    # Physical factors
    immobility: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Immobility/Bed Rest",
            category=RiskCategory.PHYSICAL,
            weight=3.5,
            description="Extended periods of immobility or bed rest",
        )
    )
    low_physical_activity: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Low Physical Activity",
            category=RiskCategory.PHYSICAL,
            weight=2.0,
            description="Sedentary lifestyle with minimal exercise",
        )
    )
    reduced_grip_strength: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Reduced Grip Strength",
            category=RiskCategory.PHYSICAL,
            weight=2.5,
            description="Grip strength below age/sex norms",
        )
    )
    slow_gait_speed: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Slow Gait Speed",
            category=RiskCategory.PHYSICAL,
            weight=2.5,
            description="Gait speed < 0.8 m/s",
        )
    )

    # Medical factors
    chronic_inflammation: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Chronic Inflammation",
            category=RiskCategory.MEDICAL,
            weight=3.0,
            description="Elevated inflammatory markers (CRP, IL-6)",
        )
    )
    chronic_disease: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Chronic Disease",
            category=RiskCategory.MEDICAL,
            weight=2.5,
            description="Presence of chronic disease affecting metabolism",
        )
    )
    catabolic_medications: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Catabolic Medications",
            category=RiskCategory.MEDICAL,
            weight=2.5,
            description="Use of corticosteroids or other catabolic drugs",
        )
    )
    recent_hospitalization: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Recent Hospitalization",
            category=RiskCategory.MEDICAL,
            weight=2.0,
            description="Hospitalization within past 3 months",
        )
    )
    recent_surgery: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Recent Surgery",
            category=RiskCategory.MEDICAL,
            weight=2.5,
            description="Major surgery within past 6 months",
        )
    )

    # Lifestyle factors
    poor_sleep: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Poor Sleep Quality",
            category=RiskCategory.LIFESTYLE,
            weight=1.5,
            description="Sleep duration < 6 hours or poor quality",
        )
    )
    high_stress: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="High Chronic Stress",
            category=RiskCategory.LIFESTYLE,
            weight=1.5,
            description="Elevated cortisol from chronic stress",
        )
    )
    alcohol_excess: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Excessive Alcohol",
            category=RiskCategory.LIFESTYLE,
            weight=1.5,
            description="Alcohol intake exceeding recommended limits",
        )
    )
    smoking: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Smoking",
            category=RiskCategory.LIFESTYLE,
            weight=2.0,
            description="Current tobacco use",
        )
    )

    # Age-related factors
    advanced_age: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Advanced Age",
            category=RiskCategory.AGE_RELATED,
            weight=2.0,
            description="Age >= 65 years",
        )
    )
    sarcopenia_history: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Sarcopenia History",
            category=RiskCategory.AGE_RELATED,
            weight=3.0,
            description="Previous diagnosis of sarcopenia",
        )
    )
    unintentional_weight_loss: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Unintentional Weight Loss",
            category=RiskCategory.AGE_RELATED,
            weight=3.0,
            description="Weight loss > 5% in past 6 months",
        )
    )

    # Hormonal factors
    low_testosterone: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Low Testosterone",
            category=RiskCategory.HORMONAL,
            weight=2.0,
            description="Below-normal testosterone levels",
        )
    )
    thyroid_dysfunction: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Thyroid Dysfunction",
            category=RiskCategory.HORMONAL,
            weight=2.0,
            description="Hyper/hypothyroidism affecting metabolism",
        )
    )
    insulin_resistance: RiskFactor = Field(
        default_factory=lambda: RiskFactor(
            name="Insulin Resistance",
            category=RiskCategory.HORMONAL,
            weight=2.0,
            description="Impaired insulin sensitivity",
        )
    )

    def get_all_factors(self) -> list[RiskFactor]:
        """Get all risk factors as a list."""
        return [
            self.inadequate_protein,
            self.caloric_deficit,
            self.malnutrition_risk,
            self.immobility,
            self.low_physical_activity,
            self.reduced_grip_strength,
            self.slow_gait_speed,
            self.chronic_inflammation,
            self.chronic_disease,
            self.catabolic_medications,
            self.recent_hospitalization,
            self.recent_surgery,
            self.poor_sleep,
            self.high_stress,
            self.alcohol_excess,
            self.smoking,
            self.advanced_age,
            self.sarcopenia_history,
            self.unintentional_weight_loss,
            self.low_testosterone,
            self.thyroid_dysfunction,
            self.insulin_resistance,
        ]

    def get_present_factors(self) -> list[RiskFactor]:
        """Get only present risk factors."""
        return [f for f in self.get_all_factors() if f.present]

    def get_factors_by_category(self, category: RiskCategory) -> list[RiskFactor]:
        """Get risk factors filtered by category."""
        return [f for f in self.get_all_factors() if f.category == category]

    def total_risk_contribution(self) -> float:
        """Calculate total risk contribution from all present factors."""
        return sum(f.contribution for f in self.get_present_factors())

    def max_possible_risk(self) -> float:
        """Calculate maximum possible risk score."""
        return sum(f.weight for f in self.get_all_factors())
