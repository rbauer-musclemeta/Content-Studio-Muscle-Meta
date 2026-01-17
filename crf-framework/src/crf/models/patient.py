"""Patient data models for catabolic risk assessment."""

from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class Sex(str, Enum):
    """Biological sex for risk calculations."""

    MALE = "male"
    FEMALE = "female"


class ActivityLevel(str, Enum):
    """Physical activity level classification."""

    SEDENTARY = "sedentary"  # Little to no exercise
    LIGHT = "light"  # Light exercise 1-3 days/week
    MODERATE = "moderate"  # Moderate exercise 3-5 days/week
    ACTIVE = "active"  # Hard exercise 6-7 days/week
    VERY_ACTIVE = "very_active"  # Very hard exercise, physical job


class PatientProfile(BaseModel):
    """Basic patient demographic and physical profile."""

    patient_id: str = Field(..., description="Unique patient identifier")
    date_of_birth: date = Field(..., description="Patient date of birth")
    sex: Sex = Field(..., description="Biological sex")
    height_cm: float = Field(..., gt=0, le=300, description="Height in centimeters")
    weight_kg: float = Field(..., gt=0, le=500, description="Weight in kilograms")
    assessment_date: date = Field(default_factory=date.today, description="Date of assessment")

    @property
    def age(self) -> int:
        """Calculate age in years."""
        today = self.assessment_date
        return (
            today.year
            - self.date_of_birth.year
            - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        )

    @property
    def bmi(self) -> float:
        """Calculate Body Mass Index."""
        height_m = self.height_cm / 100
        return round(self.weight_kg / (height_m**2), 1)

    @field_validator("height_cm", "weight_kg")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Value must be positive")
        return v


class Patient(BaseModel):
    """Complete patient model with all assessment data."""

    profile: PatientProfile
    activity_level: ActivityLevel = Field(
        default=ActivityLevel.SEDENTARY, description="Current physical activity level"
    )
    protein_intake_g_per_kg: Optional[float] = Field(
        default=None, ge=0, le=10, description="Daily protein intake in g/kg body weight"
    )
    caloric_intake_kcal: Optional[int] = Field(
        default=None, ge=0, le=10000, description="Daily caloric intake"
    )
    sleep_hours: Optional[float] = Field(
        default=None, ge=0, le=24, description="Average sleep hours per night"
    )
    chronic_conditions: list[str] = Field(
        default_factory=list, description="List of chronic conditions"
    )
    medications: list[str] = Field(default_factory=list, description="Current medications")
    recent_weight_loss_kg: Optional[float] = Field(
        default=None, ge=0, description="Unintentional weight loss in past 6 months (kg)"
    )
    stress_level: Optional[int] = Field(
        default=None, ge=1, le=10, description="Perceived stress level (1-10)"
    )

    @property
    def estimated_caloric_needs(self) -> int:
        """Estimate daily caloric needs using Mifflin-St Jeor equation."""
        profile = self.profile
        if profile.sex == Sex.MALE:
            bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5
        else:
            bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161

        activity_multipliers = {
            ActivityLevel.SEDENTARY: 1.2,
            ActivityLevel.LIGHT: 1.375,
            ActivityLevel.MODERATE: 1.55,
            ActivityLevel.ACTIVE: 1.725,
            ActivityLevel.VERY_ACTIVE: 1.9,
        }
        return int(bmr * activity_multipliers[self.activity_level])

    @property
    def recommended_protein_g(self) -> float:
        """Calculate recommended daily protein intake."""
        # Higher protein needs for older adults and active individuals
        base_protein = 0.8  # g/kg baseline

        if self.profile.age >= 65:
            base_protein = 1.2
        elif self.profile.age >= 50:
            base_protein = 1.0

        if self.activity_level in [ActivityLevel.ACTIVE, ActivityLevel.VERY_ACTIVE]:
            base_protein += 0.4

        return round(base_protein * self.profile.weight_kg, 1)
