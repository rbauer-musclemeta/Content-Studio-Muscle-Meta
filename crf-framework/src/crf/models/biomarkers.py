"""Biomarker models for catabolic risk assessment."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class BiomarkerStatus(str, Enum):
    """Status classification for biomarker values."""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class BiomarkerResult(BaseModel):
    """Individual biomarker measurement result."""

    name: str = Field(..., description="Biomarker name")
    value: Optional[float] = Field(default=None, description="Measured value")
    unit: str = Field(..., description="Unit of measurement")
    reference_low: float = Field(..., description="Lower reference range")
    reference_high: float = Field(..., description="Upper reference range")
    status: Optional[BiomarkerStatus] = Field(default=None, description="Interpretation status")

    def evaluate_status(self) -> BiomarkerStatus:
        """Evaluate the biomarker status based on reference ranges."""
        if self.value is None:
            return BiomarkerStatus.NORMAL  # Default if not measured

        if self.value < self.reference_low * 0.7:
            return BiomarkerStatus.CRITICAL
        elif self.value < self.reference_low:
            return BiomarkerStatus.LOW
        elif self.value > self.reference_high * 1.5:
            return BiomarkerStatus.CRITICAL
        elif self.value > self.reference_high:
            return BiomarkerStatus.HIGH
        else:
            return BiomarkerStatus.NORMAL


class Biomarkers(BaseModel):
    """Collection of biomarkers relevant to catabolic risk assessment."""

    # Nutritional markers
    albumin: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Albumin",
            unit="g/dL",
            reference_low=3.5,
            reference_high=5.0,
        )
    )
    prealbumin: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Prealbumin (Transthyretin)",
            unit="mg/dL",
            reference_low=20.0,
            reference_high=40.0,
        )
    )
    total_protein: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Total Protein",
            unit="g/dL",
            reference_low=6.0,
            reference_high=8.3,
        )
    )

    # Inflammatory markers
    crp: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="C-Reactive Protein (CRP)",
            unit="mg/L",
            reference_low=0.0,
            reference_high=3.0,
        )
    )
    il6: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Interleukin-6 (IL-6)",
            unit="pg/mL",
            reference_low=0.0,
            reference_high=7.0,
        )
    )
    tnf_alpha: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="TNF-alpha",
            unit="pg/mL",
            reference_low=0.0,
            reference_high=8.1,
        )
    )

    # Muscle metabolism markers
    creatinine: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Creatinine",
            unit="mg/dL",
            reference_low=0.7,
            reference_high=1.3,
        )
    )
    creatine_kinase: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Creatine Kinase (CK)",
            unit="U/L",
            reference_low=30.0,
            reference_high=200.0,
        )
    )
    bun: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Blood Urea Nitrogen (BUN)",
            unit="mg/dL",
            reference_low=7.0,
            reference_high=20.0,
        )
    )

    # Hormonal markers
    testosterone: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Testosterone (Total)",
            unit="ng/dL",
            reference_low=300.0,
            reference_high=1000.0,
        )
    )
    cortisol: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Cortisol (AM)",
            unit="mcg/dL",
            reference_low=6.0,
            reference_high=18.0,
        )
    )
    igf1: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="IGF-1",
            unit="ng/mL",
            reference_low=100.0,
            reference_high=300.0,
        )
    )
    tsh: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="TSH",
            unit="mIU/L",
            reference_low=0.4,
            reference_high=4.0,
        )
    )

    # Metabolic markers
    glucose_fasting: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Fasting Glucose",
            unit="mg/dL",
            reference_low=70.0,
            reference_high=100.0,
        )
    )
    hba1c: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="HbA1c",
            unit="%",
            reference_low=4.0,
            reference_high=5.7,
        )
    )
    insulin_fasting: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Fasting Insulin",
            unit="uIU/mL",
            reference_low=2.0,
            reference_high=25.0,
        )
    )

    # Vitamin/mineral markers
    vitamin_d: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Vitamin D (25-OH)",
            unit="ng/mL",
            reference_low=30.0,
            reference_high=100.0,
        )
    )
    vitamin_b12: BiomarkerResult = Field(
        default_factory=lambda: BiomarkerResult(
            name="Vitamin B12",
            unit="pg/mL",
            reference_low=200.0,
            reference_high=900.0,
        )
    )

    def get_all_biomarkers(self) -> list[BiomarkerResult]:
        """Get all biomarkers as a list."""
        return [
            self.albumin,
            self.prealbumin,
            self.total_protein,
            self.crp,
            self.il6,
            self.tnf_alpha,
            self.creatinine,
            self.creatine_kinase,
            self.bun,
            self.testosterone,
            self.cortisol,
            self.igf1,
            self.tsh,
            self.glucose_fasting,
            self.hba1c,
            self.insulin_fasting,
            self.vitamin_d,
            self.vitamin_b12,
        ]

    def get_measured_biomarkers(self) -> list[BiomarkerResult]:
        """Get only biomarkers that have values."""
        return [b for b in self.get_all_biomarkers() if b.value is not None]

    def get_abnormal_biomarkers(self) -> list[BiomarkerResult]:
        """Get biomarkers with abnormal values."""
        abnormal = []
        for biomarker in self.get_measured_biomarkers():
            status = biomarker.evaluate_status()
            if status != BiomarkerStatus.NORMAL:
                biomarker.status = status
                abnormal.append(biomarker)
        return abnormal

    def evaluate_all(self) -> dict[str, BiomarkerStatus]:
        """Evaluate all measured biomarkers and return status dict."""
        results = {}
        for biomarker in self.get_measured_biomarkers():
            results[biomarker.name] = biomarker.evaluate_status()
        return results

    @property
    def testosterone_cortisol_ratio(self) -> Optional[float]:
        """Calculate testosterone/cortisol ratio (anabolic/catabolic balance)."""
        if self.testosterone.value is not None and self.cortisol.value is not None:
            if self.cortisol.value > 0:
                # Convert to same units for ratio
                return round(self.testosterone.value / (self.cortisol.value * 10), 2)
        return None

    @property
    def homa_ir(self) -> Optional[float]:
        """Calculate HOMA-IR (insulin resistance index)."""
        if self.glucose_fasting.value is not None and self.insulin_fasting.value is not None:
            return round(
                (self.glucose_fasting.value * self.insulin_fasting.value) / 405, 2
            )
        return None
