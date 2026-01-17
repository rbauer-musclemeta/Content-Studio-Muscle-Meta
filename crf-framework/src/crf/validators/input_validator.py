"""Input validation for patient data and assessments."""

from datetime import date
from typing import Any, Optional

from pydantic import BaseModel, Field


class ValidationError(BaseModel):
    """Individual validation error."""

    field: str = Field(..., description="Field name with error")
    message: str = Field(..., description="Error message")
    value: Optional[Any] = Field(default=None, description="Invalid value")


class ValidationResult(BaseModel):
    """Result of validation check."""

    is_valid: bool = Field(default=True, description="Whether validation passed")
    errors: list[ValidationError] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)

    def add_error(self, field: str, message: str, value: Any = None) -> None:
        """Add a validation error."""
        self.errors.append(ValidationError(field=field, message=message, value=value))
        self.is_valid = False

    def add_warning(self, message: str) -> None:
        """Add a validation warning."""
        self.warnings.append(message)


class InputValidator:
    """Validator for patient and assessment input data."""

    # Valid ranges for various inputs
    AGE_RANGE = (0, 120)
    HEIGHT_RANGE_CM = (50, 280)
    WEIGHT_RANGE_KG = (10, 500)
    PROTEIN_RANGE = (0, 10)  # g/kg/day
    CALORIE_RANGE = (0, 10000)
    SLEEP_RANGE = (0, 24)
    STRESS_RANGE = (1, 10)

    def validate_patient_profile(self, data: dict) -> ValidationResult:
        """Validate patient profile data.

        Args:
            data: Dictionary with patient profile fields

        Returns:
            ValidationResult with any errors/warnings
        """
        result = ValidationResult()

        # Required fields
        required = ["patient_id", "date_of_birth", "sex", "height_cm", "weight_kg"]
        for field in required:
            if field not in data or data[field] is None:
                result.add_error(field, f"{field} is required")

        if not result.is_valid:
            return result

        # Validate date of birth
        dob = data.get("date_of_birth")
        if isinstance(dob, str):
            try:
                dob = date.fromisoformat(dob)
            except ValueError:
                result.add_error("date_of_birth", "Invalid date format. Use YYYY-MM-DD", dob)
                return result

        if isinstance(dob, date):
            today = date.today()
            age = (
                today.year
                - dob.year
                - ((today.month, today.day) < (dob.month, dob.day))
            )
            if age < self.AGE_RANGE[0] or age > self.AGE_RANGE[1]:
                result.add_error(
                    "date_of_birth",
                    f"Age must be between {self.AGE_RANGE[0]} and {self.AGE_RANGE[1]}",
                    age,
                )
            if dob > today:
                result.add_error("date_of_birth", "Date of birth cannot be in the future", dob)

        # Validate sex
        sex = data.get("sex")
        if sex and sex.lower() not in ["male", "female"]:
            result.add_error("sex", "Sex must be 'male' or 'female'", sex)

        # Validate height
        height = data.get("height_cm")
        if height is not None:
            if not isinstance(height, (int, float)):
                result.add_error("height_cm", "Height must be a number", height)
            elif height < self.HEIGHT_RANGE_CM[0] or height > self.HEIGHT_RANGE_CM[1]:
                result.add_error(
                    "height_cm",
                    f"Height must be between {self.HEIGHT_RANGE_CM[0]} and {self.HEIGHT_RANGE_CM[1]} cm",
                    height,
                )

        # Validate weight
        weight = data.get("weight_kg")
        if weight is not None:
            if not isinstance(weight, (int, float)):
                result.add_error("weight_kg", "Weight must be a number", weight)
            elif weight < self.WEIGHT_RANGE_KG[0] or weight > self.WEIGHT_RANGE_KG[1]:
                result.add_error(
                    "weight_kg",
                    f"Weight must be between {self.WEIGHT_RANGE_KG[0]} and {self.WEIGHT_RANGE_KG[1]} kg",
                    weight,
                )

        # Add warnings for edge cases
        if height and weight:
            bmi = weight / ((height / 100) ** 2)
            if bmi < 16:
                result.add_warning(f"BMI of {bmi:.1f} indicates severe underweight")
            elif bmi > 40:
                result.add_warning(f"BMI of {bmi:.1f} indicates class III obesity")

        return result

    def validate_patient_data(self, data: dict) -> ValidationResult:
        """Validate complete patient data including lifestyle factors.

        Args:
            data: Dictionary with all patient fields

        Returns:
            ValidationResult with any errors/warnings
        """
        # First validate profile
        profile_data = data.get("profile", data)
        result = self.validate_patient_profile(profile_data)

        # Validate optional fields
        if "protein_intake_g_per_kg" in data:
            protein = data["protein_intake_g_per_kg"]
            if protein is not None:
                if not isinstance(protein, (int, float)):
                    result.add_error(
                        "protein_intake_g_per_kg", "Protein intake must be a number", protein
                    )
                elif protein < self.PROTEIN_RANGE[0] or protein > self.PROTEIN_RANGE[1]:
                    result.add_error(
                        "protein_intake_g_per_kg",
                        f"Protein intake must be between {self.PROTEIN_RANGE[0]} and {self.PROTEIN_RANGE[1]} g/kg",
                        protein,
                    )

        if "caloric_intake_kcal" in data:
            calories = data["caloric_intake_kcal"]
            if calories is not None:
                if not isinstance(calories, (int, float)):
                    result.add_error(
                        "caloric_intake_kcal", "Caloric intake must be a number", calories
                    )
                elif calories < self.CALORIE_RANGE[0] or calories > self.CALORIE_RANGE[1]:
                    result.add_error(
                        "caloric_intake_kcal",
                        f"Caloric intake must be between {self.CALORIE_RANGE[0]} and {self.CALORIE_RANGE[1]} kcal",
                        calories,
                    )

        if "sleep_hours" in data:
            sleep = data["sleep_hours"]
            if sleep is not None:
                if not isinstance(sleep, (int, float)):
                    result.add_error("sleep_hours", "Sleep hours must be a number", sleep)
                elif sleep < self.SLEEP_RANGE[0] or sleep > self.SLEEP_RANGE[1]:
                    result.add_error(
                        "sleep_hours",
                        f"Sleep hours must be between {self.SLEEP_RANGE[0]} and {self.SLEEP_RANGE[1]}",
                        sleep,
                    )

        if "stress_level" in data:
            stress = data["stress_level"]
            if stress is not None:
                if not isinstance(stress, int):
                    result.add_error("stress_level", "Stress level must be an integer", stress)
                elif stress < self.STRESS_RANGE[0] or stress > self.STRESS_RANGE[1]:
                    result.add_error(
                        "stress_level",
                        f"Stress level must be between {self.STRESS_RANGE[0]} and {self.STRESS_RANGE[1]}",
                        stress,
                    )

        # Validate activity level
        valid_activities = ["sedentary", "light", "moderate", "active", "very_active"]
        if "activity_level" in data:
            activity = data["activity_level"]
            if activity and activity.lower() not in valid_activities:
                result.add_error(
                    "activity_level",
                    f"Activity level must be one of: {', '.join(valid_activities)}",
                    activity,
                )

        return result

    def validate_biomarker(
        self, name: str, value: float, unit: str
    ) -> ValidationResult:
        """Validate a single biomarker value.

        Args:
            name: Biomarker name
            value: Measured value
            unit: Unit of measurement

        Returns:
            ValidationResult
        """
        result = ValidationResult()

        if value < 0:
            result.add_error(name, "Biomarker values cannot be negative", value)

        # Define plausible ranges for common biomarkers
        plausible_ranges = {
            "albumin": (1.0, 7.0),
            "crp": (0, 100),
            "testosterone": (0, 2000),
            "cortisol": (0, 50),
            "glucose": (20, 600),
            "hba1c": (3.0, 15.0),
            "creatinine": (0.1, 20.0),
            "vitamin_d": (0, 200),
        }

        name_lower = name.lower().replace(" ", "_").replace("-", "_")
        for key, (low, high) in plausible_ranges.items():
            if key in name_lower:
                if value < low or value > high:
                    result.add_warning(
                        f"{name} value of {value} {unit} is outside typical range ({low}-{high})"
                    )
                break

        return result
