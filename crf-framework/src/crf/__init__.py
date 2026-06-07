"""
CRF - Catabolic Risk Assessment Framework

A comprehensive framework for assessing catabolic risk factors
related to muscle metabolism and sarcopenia.
"""

from crf.models.patient import Patient, PatientProfile
from crf.models.risk_factors import RiskFactors, RiskCategory
from crf.models.biomarkers import Biomarkers
from crf.models.measurements import (
    ClinicalContext,
    PhysicalMeasurements,
    SarcFResponses,
)
from crf.assessment.calculator import CatabolicRiskCalculator
from crf.assessment.scoring import RiskScore, RiskLevel
from crf.assessment.recommendations import RecommendationEngine, Recommendation
from crf.instruments.base import InstrumentResult, ScreeningPanel
from crf.instruments.sarcf import SarcF
from crf.instruments.must import Must
from crf.instruments.ewgsop2 import Ewgsop2

__version__ = "1.0.0"
__all__ = [
    "Patient",
    "PatientProfile",
    "RiskFactors",
    "RiskCategory",
    "Biomarkers",
    "ClinicalContext",
    "PhysicalMeasurements",
    "SarcFResponses",
    "CatabolicRiskCalculator",
    "RiskScore",
    "RiskLevel",
    "RecommendationEngine",
    "Recommendation",
    "InstrumentResult",
    "ScreeningPanel",
    "SarcF",
    "Must",
    "Ewgsop2",
]
