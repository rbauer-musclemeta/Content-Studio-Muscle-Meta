"""Structured clinical inputs for validated screening instruments.

These models capture the specific inputs that validated instruments require
(and that the heuristic factor model does not), kept optional so existing
callers are unaffected. Phase 2 covers SARC-F and MUST; later phases will add
physical measurements (grip strength, gait speed, chair-stand time, etc.) here.
"""

from pydantic import BaseModel, Field


class SarcFResponses(BaseModel):
    """Responses to the five-item SARC-F sarcopenia screening questionnaire.

    Each functional item is scored 0 (no difficulty), 1 (some difficulty), or
    2 (a lot of difficulty / unable). Falls in the past year are scored 0 (none),
    1 (1-3 falls), or 2 (4+ falls).

    Reference: Malmstrom & Morley, SARC-F (2013); used as the "Find" step in the
    EWGSOP2 (2019) sarcopenia algorithm.
    """

    strength: int = Field(
        ..., ge=0, le=2, description="Difficulty lifting/carrying ~4.5 kg (10 lb)"
    )
    assistance_walking: int = Field(
        ..., ge=0, le=2, description="Difficulty walking across a room"
    )
    rising_from_chair: int = Field(
        ..., ge=0, le=2, description="Difficulty transferring from a chair/bed"
    )
    climbing_stairs: int = Field(
        ..., ge=0, le=2, description="Difficulty climbing a flight of 10 stairs"
    )
    falls: int = Field(..., ge=0, le=2, description="Falls in the past year (0 / 1-3 / 4+)")

    @property
    def total(self) -> int:
        """Total SARC-F score (0-10)."""
        return (
            self.strength
            + self.assistance_walking
            + self.rising_from_chair
            + self.climbing_stairs
            + self.falls
        )


class ClinicalContext(BaseModel):
    """Acute clinical context required by malnutrition screens (e.g. MUST).

    Defaults represent the non-acute case, which is the safe baseline: a patient
    is only flagged for the acute-disease effect when explicitly marked acutely
    ill with a documented period of negligible intake.
    """

    acutely_ill: bool = Field(
        default=False, description="Patient is acutely ill / unstable"
    )
    days_without_nutrition: int = Field(
        default=0,
        ge=0,
        description="Days with little/no nutritional intake (actual or anticipated)",
    )
