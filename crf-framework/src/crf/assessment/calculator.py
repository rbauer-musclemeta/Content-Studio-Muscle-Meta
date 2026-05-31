"""Main catabolic risk calculator."""

from typing import Optional

from crf.models.patient import Patient, ActivityLevel
from crf.models.risk_factors import RiskFactors
from crf.models.biomarkers import Biomarkers, BiomarkerStatus
from crf.assessment.scoring import DISCLAIMER, RiskScore, ScoringEngine
from crf.instruments.base import InstrumentResult, ScreeningPanel


class CatabolicRiskCalculator:
    """Main calculator for catabolic risk assessment.

    This calculator evaluates patient data, risk factors, and biomarkers
    to produce a comprehensive catabolic risk score.
    """

    # Catabolic medications that increase risk
    CATABOLIC_MEDICATIONS = [
        "prednisone",
        "dexamethasone",
        "cortisone",
        "hydrocortisone",
        "methylprednisolone",
        "prednisolone",
        "betamethasone",
        "triamcinolone",
        "budesonide",
    ]

    # Conditions associated with increased catabolic risk
    CATABOLIC_CONDITIONS = [
        "cancer",
        "copd",
        "chronic kidney disease",
        "ckd",
        "heart failure",
        "chf",
        "diabetes",
        "hiv",
        "aids",
        "cirrhosis",
        "liver disease",
        "rheumatoid arthritis",
        "inflammatory bowel disease",
        "ibd",
        "crohn",
        "ulcerative colitis",
        "sepsis",
        "hyperthyroidism",
    ]

    def __init__(self):
        """Initialize the calculator."""
        self.scoring_engine = ScoringEngine()
        self.screening_panel = ScreeningPanel()

    def run_validated_screens(self, patient: Patient) -> list[InstrumentResult]:
        """Run the panel of validated screening instruments (SARC-F, MUST).

        These are reported separately from the heuristic composite score: each
        result carries its own validated category and citation, and instruments
        whose inputs are missing are returned marked not-applicable rather than
        guessed.
        """
        return self.screening_panel.run(patient)

    def assess_patient(
        self,
        patient: Patient,
        risk_factors: Optional[RiskFactors] = None,
        biomarkers: Optional[Biomarkers] = None,
    ) -> RiskScore:
        """Perform complete catabolic risk assessment for a patient.

        Args:
            patient: Patient data including demographics and lifestyle
            risk_factors: Optional pre-evaluated risk factors
            biomarkers: Optional biomarker results

        Returns:
            Complete RiskScore with breakdown and recommendations
        """
        # Initialize or use provided risk factors
        if risk_factors is None:
            risk_factors = RiskFactors()

        # Auto-evaluate risk factors from patient data
        self._evaluate_patient_factors(patient, risk_factors)

        # Evaluate biomarkers if provided
        biomarker_penalty = 0.0
        if biomarkers is not None:
            biomarker_penalty = self._evaluate_biomarkers(biomarkers, risk_factors)

        # Calculate final score
        all_factors = risk_factors.get_all_factors()
        score = self.scoring_engine.calculate_total_score(
            all_factors,
            biomarker_penalty,
            biomarkers_assessed=biomarkers is not None,
            confidence=self._data_completeness(patient, biomarkers),
        )

        return score

    @staticmethod
    def _data_completeness(
        patient: Patient, biomarkers: Optional[Biomarkers]
    ) -> float:
        """Estimate confidence as the fraction of key inputs actually provided.

        Demographics are always present, so this scores the optional lifestyle
        inputs and biomarkers — the data that, when missing, leaves the score
        guessing. A low value flags the numeric score as unreliable rather than
        silently presenting a falsely low result.
        """
        optional_inputs = [
            patient.protein_intake_g_per_kg,
            patient.caloric_intake_kcal,
            patient.sleep_hours,
            patient.stress_level,
            patient.recent_weight_loss_kg,
        ]
        provided = sum(1 for value in optional_inputs if value is not None)
        provided += 1 if biomarkers is not None else 0
        total = len(optional_inputs) + 1  # + biomarkers
        return round(provided / total, 2)

    def _evaluate_patient_factors(
        self, patient: Patient, risk_factors: RiskFactors
    ) -> None:
        """Evaluate risk factors based on patient data."""
        profile = patient.profile

        # Age-related factors
        if profile.age >= 65:
            risk_factors.advanced_age.present = True
            risk_factors.advanced_age.severity = min(1.0, (profile.age - 65) / 35)
        elif profile.age >= 50:
            risk_factors.advanced_age.present = True
            risk_factors.advanced_age.severity = 0.3

        # Activity level
        if patient.activity_level == ActivityLevel.SEDENTARY:
            risk_factors.low_physical_activity.present = True
            risk_factors.low_physical_activity.severity = 0.8
        elif patient.activity_level == ActivityLevel.LIGHT:
            risk_factors.low_physical_activity.present = True
            risk_factors.low_physical_activity.severity = 0.4

        # Protein intake
        if patient.protein_intake_g_per_kg is not None:
            recommended = patient.recommended_protein_g / patient.profile.weight_kg
            if patient.protein_intake_g_per_kg < recommended * 0.6:
                risk_factors.inadequate_protein.present = True
                risk_factors.inadequate_protein.severity = 1.0
            elif patient.protein_intake_g_per_kg < recommended * 0.8:
                risk_factors.inadequate_protein.present = True
                risk_factors.inadequate_protein.severity = 0.6
            elif patient.protein_intake_g_per_kg < recommended:
                risk_factors.inadequate_protein.present = True
                risk_factors.inadequate_protein.severity = 0.3

        # Caloric intake
        if patient.caloric_intake_kcal is not None:
            deficit = patient.estimated_caloric_needs - patient.caloric_intake_kcal
            if deficit > 750:
                risk_factors.caloric_deficit.present = True
                risk_factors.caloric_deficit.severity = 1.0
            elif deficit > 500:
                risk_factors.caloric_deficit.present = True
                risk_factors.caloric_deficit.severity = 0.7
            elif deficit > 250:
                risk_factors.caloric_deficit.present = True
                risk_factors.caloric_deficit.severity = 0.4

        # Sleep
        if patient.sleep_hours is not None:
            if patient.sleep_hours < 5:
                risk_factors.poor_sleep.present = True
                risk_factors.poor_sleep.severity = 1.0
            elif patient.sleep_hours < 6:
                risk_factors.poor_sleep.present = True
                risk_factors.poor_sleep.severity = 0.7
            elif patient.sleep_hours < 7:
                risk_factors.poor_sleep.present = True
                risk_factors.poor_sleep.severity = 0.3

        # Stress level
        if patient.stress_level is not None:
            if patient.stress_level >= 8:
                risk_factors.high_stress.present = True
                risk_factors.high_stress.severity = 1.0
            elif patient.stress_level >= 6:
                risk_factors.high_stress.present = True
                risk_factors.high_stress.severity = 0.6
            elif patient.stress_level >= 4:
                risk_factors.high_stress.present = True
                risk_factors.high_stress.severity = 0.3

        # Weight loss
        if patient.recent_weight_loss_kg is not None:
            loss_percentage = (patient.recent_weight_loss_kg / profile.weight_kg) * 100
            if loss_percentage > 10:
                risk_factors.unintentional_weight_loss.present = True
                risk_factors.unintentional_weight_loss.severity = 1.0
            elif loss_percentage > 5:
                risk_factors.unintentional_weight_loss.present = True
                risk_factors.unintentional_weight_loss.severity = 0.7
            elif loss_percentage > 3:
                risk_factors.unintentional_weight_loss.present = True
                risk_factors.unintentional_weight_loss.severity = 0.4

        # Check medications
        for med in patient.medications:
            med_lower = med.lower()
            if any(catabolic in med_lower for catabolic in self.CATABOLIC_MEDICATIONS):
                risk_factors.catabolic_medications.present = True
                risk_factors.catabolic_medications.severity = max(
                    risk_factors.catabolic_medications.severity, 0.7
                )

        # Check chronic conditions
        for condition in patient.chronic_conditions:
            condition_lower = condition.lower()
            if any(cat_cond in condition_lower for cat_cond in self.CATABOLIC_CONDITIONS):
                risk_factors.chronic_disease.present = True
                risk_factors.chronic_disease.severity = max(
                    risk_factors.chronic_disease.severity, 0.7
                )

        # BMI extremes
        bmi = profile.bmi
        if bmi < 18.5:
            risk_factors.malnutrition_risk.present = True
            risk_factors.malnutrition_risk.severity = 0.8
        elif bmi < 20:
            risk_factors.malnutrition_risk.present = True
            risk_factors.malnutrition_risk.severity = 0.4

    def _evaluate_biomarkers(
        self, biomarkers: Biomarkers, risk_factors: RiskFactors
    ) -> float:
        """Evaluate biomarkers and update risk factors accordingly.

        Returns:
            Biomarker penalty score
        """
        abnormal = []

        # Check inflammatory markers
        if biomarkers.crp.value is not None:
            status = biomarkers.crp.evaluate_status()
            if status in [BiomarkerStatus.HIGH, BiomarkerStatus.CRITICAL]:
                risk_factors.chronic_inflammation.present = True
                risk_factors.chronic_inflammation.severity = (
                    1.0 if status == BiomarkerStatus.CRITICAL else 0.6
                )
                abnormal.append(("crp", status.value))

        if biomarkers.il6.value is not None:
            status = biomarkers.il6.evaluate_status()
            if status in [BiomarkerStatus.HIGH, BiomarkerStatus.CRITICAL]:
                risk_factors.chronic_inflammation.present = True
                risk_factors.chronic_inflammation.severity = max(
                    risk_factors.chronic_inflammation.severity,
                    1.0 if status == BiomarkerStatus.CRITICAL else 0.6,
                )
                abnormal.append(("il6", status.value))

        # Check nutritional markers
        if biomarkers.albumin.value is not None:
            status = biomarkers.albumin.evaluate_status()
            if status in [BiomarkerStatus.LOW, BiomarkerStatus.CRITICAL]:
                risk_factors.malnutrition_risk.present = True
                risk_factors.malnutrition_risk.severity = max(
                    risk_factors.malnutrition_risk.severity,
                    1.0 if status == BiomarkerStatus.CRITICAL else 0.6,
                )
                abnormal.append(("albumin", status.value))

        # Check hormonal markers
        if biomarkers.testosterone.value is not None:
            status = biomarkers.testosterone.evaluate_status()
            if status in [BiomarkerStatus.LOW, BiomarkerStatus.CRITICAL]:
                risk_factors.low_testosterone.present = True
                risk_factors.low_testosterone.severity = (
                    1.0 if status == BiomarkerStatus.CRITICAL else 0.6
                )
                abnormal.append(("testosterone", status.value))

        if biomarkers.cortisol.value is not None:
            status = biomarkers.cortisol.evaluate_status()
            if status == BiomarkerStatus.HIGH:
                risk_factors.high_stress.present = True
                risk_factors.high_stress.severity = max(
                    risk_factors.high_stress.severity, 0.7
                )
                abnormal.append(("cortisol", status.value))

        # Check thyroid
        if biomarkers.tsh.value is not None:
            status = biomarkers.tsh.evaluate_status()
            if status != BiomarkerStatus.NORMAL:
                risk_factors.thyroid_dysfunction.present = True
                risk_factors.thyroid_dysfunction.severity = 0.6
                abnormal.append(("tsh", status.value))

        # Check metabolic markers for insulin resistance
        if biomarkers.homa_ir is not None:
            if biomarkers.homa_ir > 2.5:
                risk_factors.insulin_resistance.present = True
                risk_factors.insulin_resistance.severity = min(
                    1.0, (biomarkers.homa_ir - 2.5) / 2.5
                )

        # Check vitamin D
        if biomarkers.vitamin_d.value is not None:
            status = biomarkers.vitamin_d.evaluate_status()
            if status in [BiomarkerStatus.LOW, BiomarkerStatus.CRITICAL]:
                abnormal.append(("vitamin_d", status.value))

        # Calculate biomarker penalty
        return self.scoring_engine.calculate_biomarker_penalty(abnormal)

    def quick_screen(self, patient: Patient) -> dict:
        """Perform a quick screening without detailed biomarkers.

        Returns:
            Dictionary with quick assessment results
        """
        score = self.assess_patient(patient)

        result = {
            "screening_signal": score.risk_level.screening_label,
            "top_concerns": score.top_risk_factors[:3],
            "confidence": score.confidence,
            "reliable": score.is_reliable,
            "validation_status": score.validation_status,
            "disclaimer": DISCLAIMER,
        }

        # Suppress the numeric/level output when too little was provided to
        # trust it; surfacing a falsely low number is the dangerous failure.
        if score.is_reliable:
            result["risk_level"] = score.risk_level.value
            result["risk_percentage"] = score.percentage
            result["recommendation"] = self._get_quick_recommendation(score.risk_level)
        else:
            result["risk_level"] = None
            result["risk_percentage"] = None
            result["recommendation"] = (
                "Insufficient data for a reliable screen. Provide more inputs "
                "(diet, sleep, stress, labs) and consult a healthcare provider."
            )

        return result

    def _get_quick_recommendation(self, risk_level) -> str:
        """Get a quick recommendation based on risk level."""
        recommendations = {
            "low": "Continue current lifestyle. Consider periodic monitoring.",
            "moderate": "Consult healthcare provider. Focus on nutrition and exercise.",
            "high": "Seek medical evaluation. Implement targeted interventions.",
            "severe": "Urgent medical attention recommended. Comprehensive intervention needed.",
        }
        return recommendations.get(risk_level.value, "Consult healthcare provider.")
