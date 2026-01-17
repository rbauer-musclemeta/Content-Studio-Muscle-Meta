"""
CRF - Catabolic Risk Assessment Framework

A comprehensive framework for assessing catabolic risk factors
related to muscle metabolism and sarcopenia.
"""

from crf.models.patient import Patient, PatientProfile
from crf.models.risk_factors import RiskFactors, RiskCategory
from crf.models.biomarkers import Biomarkers
from crf.assessment.calculator import CatabolicRiskCalculator
from crf.assessment.scoring import RiskScore, RiskLevel
from crf.assessment.recommendations import RecommendationEngine, Recommendation

__version__ = "1.0.0"
__all__ = [
    "Patient",
    "PatientProfile",
    "RiskFactors",
    "RiskCategory",
    "Biomarkers",
    "CatabolicRiskCalculator",
    "RiskScore",
    "RiskLevel",
    "RecommendationEngine",
    "Recommendation",
]
