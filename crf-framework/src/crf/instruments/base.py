"""Common interface for validated screening instruments.

Each instrument is a self-contained, published algorithm that consumes a
``Patient`` and emits an :class:`InstrumentResult` carrying a categorical
finding plus its citation. Unlike the heuristic composite score, these results
are tagged ``validation_status="validated"`` because they reproduce instruments
validated in the literature — though they remain *screening* tools, not
diagnoses.
"""

from abc import ABC, abstractmethod
from typing import ClassVar, Optional

from pydantic import BaseModel, Field

from crf.models.patient import Patient


class InstrumentResult(BaseModel):
    """Result of running a single screening instrument on a patient."""

    instrument: str = Field(..., description="Instrument name")
    applicable: bool = Field(
        ..., description="Whether the required inputs were available to score it"
    )
    category: Optional[str] = Field(
        default=None, description="Validated outcome category, if scored"
    )
    raw_score: Optional[float] = Field(
        default=None, description="Raw instrument score, if applicable"
    )
    interpretation: Optional[str] = Field(
        default=None, description="Human-readable interpretation"
    )
    citation: str = Field(..., description="Source/citation for the instrument")
    validation_status: str = Field(
        default="validated",
        description="Validation provenance of the instrument itself",
    )
    missing_inputs: list[str] = Field(
        default_factory=list, description="Required inputs that were absent"
    )


class BaseInstrument(ABC):
    """Abstract base for a validated screening instrument."""

    #: Display name of the instrument.
    name: ClassVar[str]
    #: Literature citation for the instrument and its cut-offs.
    citation: ClassVar[str]

    @abstractmethod
    def score(self, patient: Patient) -> InstrumentResult:
        """Score the instrument for a patient.

        Implementations must return an :class:`InstrumentResult` with
        ``applicable=False`` (via :meth:`not_assessable`) when required inputs
        are missing, rather than guessing — surfacing a falsely reassuring
        result is the dangerous failure mode for a screening tool.
        """

    def not_assessable(self, missing_inputs: list[str]) -> InstrumentResult:
        """Build a result indicating the instrument could not be scored."""
        return InstrumentResult(
            instrument=self.name,
            applicable=False,
            citation=self.citation,
            missing_inputs=missing_inputs,
            interpretation=(
                "Not assessable — missing required input(s): "
                + ", ".join(missing_inputs)
            ),
        )


class ScreeningPanel:
    """Runs a collection of validated instruments over a patient."""

    def __init__(self, instruments: Optional[list[BaseInstrument]] = None) -> None:
        self.instruments = instruments if instruments is not None else default_instruments()

    def run(self, patient: Patient) -> list[InstrumentResult]:
        """Score every instrument in the panel (applicable or not)."""
        return [instrument.score(patient) for instrument in self.instruments]

    def applicable_results(self, patient: Patient) -> list[InstrumentResult]:
        """Score only the instruments whose required inputs are present."""
        return [result for result in self.run(patient) if result.applicable]


def default_instruments() -> list[BaseInstrument]:
    """The default panel of license-clear, validated instruments."""
    # Imported lazily to avoid a circular import at module load.
    from crf.instruments.ewgsop2 import Ewgsop2
    from crf.instruments.must import Must
    from crf.instruments.sarcf import SarcF

    return [SarcF(), Ewgsop2(), Must()]
