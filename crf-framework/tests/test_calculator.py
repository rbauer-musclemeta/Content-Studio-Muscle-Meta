"""Tests for the catabolic risk calculator."""

from datetime import date

import pytest

from crf.models.patient import Patient, PatientProfile, Sex, ActivityLevel
from crf.models.biomarkers import Biomarkers
from crf.assessment.calculator import CatabolicRiskCalculator
from crf.assessment.scoring import RiskLevel


@pytest.fixture
def calculator():
    """Create a calculator instance."""
    return CatabolicRiskCalculator()


@pytest.fixture
def healthy_patient():
    """Create a healthy patient profile."""
    profile = PatientProfile(
        patient_id="TEST001",
        date_of_birth=date(1990, 5, 15),
        sex=Sex.MALE,
        height_cm=175,
        weight_kg=75,
    )
    return Patient(
        profile=profile,
        activity_level=ActivityLevel.MODERATE,
        protein_intake_g_per_kg=1.2,
        caloric_intake_kcal=2500,
        sleep_hours=7.5,
        stress_level=3,
    )


@pytest.fixture
def high_risk_patient():
    """Create a high-risk patient profile."""
    profile = PatientProfile(
        patient_id="TEST002",
        date_of_birth=date(1950, 3, 10),
        sex=Sex.MALE,
        height_cm=170,
        weight_kg=60,
    )
    return Patient(
        profile=profile,
        activity_level=ActivityLevel.SEDENTARY,
        protein_intake_g_per_kg=0.5,
        caloric_intake_kcal=1200,
        sleep_hours=5,
        stress_level=8,
        chronic_conditions=["Type 2 Diabetes", "COPD"],
        medications=["Prednisone"],
        recent_weight_loss_kg=5,
    )


class TestCatabolicRiskCalculator:
    """Test suite for CatabolicRiskCalculator."""

    def test_calculator_initialization(self, calculator):
        """Test calculator initializes properly."""
        assert calculator is not None
        assert calculator.scoring_engine is not None

    def test_healthy_patient_low_risk(self, calculator, healthy_patient):
        """Test that a healthy patient has low risk."""
        score = calculator.assess_patient(healthy_patient)

        assert score is not None
        assert score.risk_level in [RiskLevel.LOW, RiskLevel.MODERATE]
        assert score.percentage < 40

    def test_high_risk_patient(self, calculator, high_risk_patient):
        """Test that a high-risk patient is identified."""
        score = calculator.assess_patient(high_risk_patient)

        assert score is not None
        assert score.risk_level in [RiskLevel.HIGH, RiskLevel.SEVERE]
        assert score.percentage >= 40
        assert len(score.top_risk_factors) > 0

    def test_age_affects_risk(self, calculator):
        """Test that advanced age increases risk."""
        young_profile = PatientProfile(
            patient_id="YOUNG",
            date_of_birth=date(2000, 1, 1),
            sex=Sex.MALE,
            height_cm=175,
            weight_kg=75,
        )
        old_profile = PatientProfile(
            patient_id="OLD",
            date_of_birth=date(1950, 1, 1),
            sex=Sex.MALE,
            height_cm=175,
            weight_kg=75,
        )

        young_patient = Patient(profile=young_profile)
        old_patient = Patient(profile=old_profile)

        young_score = calculator.assess_patient(young_patient)
        old_score = calculator.assess_patient(old_patient)

        assert old_score.percentage > young_score.percentage

    def test_protein_deficiency_flagged(self, calculator):
        """Test that protein deficiency increases risk."""
        profile = PatientProfile(
            patient_id="PROTEIN",
            date_of_birth=date(1980, 6, 15),
            sex=Sex.FEMALE,
            height_cm=165,
            weight_kg=60,
        )

        # Low protein patient
        low_protein = Patient(
            profile=profile,
            protein_intake_g_per_kg=0.4,
        )

        # Adequate protein patient
        adequate_protein = Patient(
            profile=profile,
            protein_intake_g_per_kg=1.2,
        )

        low_score = calculator.assess_patient(low_protein)
        adequate_score = calculator.assess_patient(adequate_protein)

        assert low_score.percentage > adequate_score.percentage
        assert any("protein" in f.lower() for f in low_score.top_risk_factors)

    def test_catabolic_medications_detected(self, calculator):
        """Test that catabolic medications are detected."""
        profile = PatientProfile(
            patient_id="MEDS",
            date_of_birth=date(1985, 8, 20),
            sex=Sex.MALE,
            height_cm=180,
            weight_kg=80,
        )

        patient_with_steroids = Patient(
            profile=profile,
            medications=["Prednisone 10mg"],
        )

        patient_without_steroids = Patient(
            profile=profile,
            medications=["Metformin"],
        )

        steroid_score = calculator.assess_patient(patient_with_steroids)
        no_steroid_score = calculator.assess_patient(patient_without_steroids)

        assert steroid_score.percentage > no_steroid_score.percentage

    def test_biomarker_evaluation(self, calculator, healthy_patient):
        """Test that abnormal biomarkers affect risk."""
        # Normal biomarkers
        normal_biomarkers = Biomarkers()
        normal_biomarkers.albumin.value = 4.0
        normal_biomarkers.crp.value = 1.0

        # Abnormal biomarkers
        abnormal_biomarkers = Biomarkers()
        abnormal_biomarkers.albumin.value = 2.5  # Low
        abnormal_biomarkers.crp.value = 15.0  # High

        normal_score = calculator.assess_patient(
            healthy_patient, biomarkers=normal_biomarkers
        )
        abnormal_score = calculator.assess_patient(
            healthy_patient, biomarkers=abnormal_biomarkers
        )

        assert abnormal_score.percentage > normal_score.percentage
        assert abnormal_score.biomarker_penalty > normal_score.biomarker_penalty

    def test_quick_screen(self, calculator, high_risk_patient):
        """Test quick screening function — panel-first output structure."""
        result = calculator.quick_screen(high_risk_patient)

        # Validated instruments are the headline.
        assert "validated_instruments" in result
        assert "validated_summary" in result
        assert isinstance(result["validated_instruments"], list)

        # Exploratory composite is secondary.
        assert "exploratory_composite" in result
        composite = result["exploratory_composite"]
        assert "risk_level" in composite
        assert "risk_percentage" in composite
        assert "top_concerns" in composite
        assert composite["risk_level"] in ["low", "moderate", "high", "severe", None]

        # Recommendation at top level.
        assert "recommendation" in result

    def test_category_scores_present(self, calculator, high_risk_patient):
        """Test that category scores are calculated."""
        score = calculator.assess_patient(high_risk_patient)

        assert len(score.category_scores) > 0
        for cat_score in score.category_scores:
            assert cat_score.max_score > 0
            assert 0 <= cat_score.percentage <= 100


class TestPatientProfile:
    """Tests for PatientProfile model."""

    def test_age_calculation(self):
        """Test age is calculated correctly."""
        profile = PatientProfile(
            patient_id="AGE_TEST",
            date_of_birth=date(1990, 6, 15),
            sex=Sex.MALE,
            height_cm=175,
            weight_kg=75,
            assessment_date=date(2024, 6, 15),
        )
        assert profile.age == 34

    def test_bmi_calculation(self):
        """Test BMI is calculated correctly."""
        profile = PatientProfile(
            patient_id="BMI_TEST",
            date_of_birth=date(1990, 1, 1),
            sex=Sex.FEMALE,
            height_cm=170,
            weight_kg=68,
        )
        # BMI = 68 / (1.7^2) = 23.5
        assert profile.bmi == 23.5


class TestPatient:
    """Tests for Patient model."""

    def test_estimated_caloric_needs(self):
        """Test caloric needs estimation."""
        profile = PatientProfile(
            patient_id="CAL_TEST",
            date_of_birth=date(1990, 1, 1),
            sex=Sex.MALE,
            height_cm=175,
            weight_kg=75,
            assessment_date=date(2024, 1, 1),
        )
        patient = Patient(
            profile=profile,
            activity_level=ActivityLevel.MODERATE,
        )

        # Should be reasonable range for active male
        assert 2000 < patient.estimated_caloric_needs < 3500

    def test_recommended_protein(self):
        """Test protein recommendation calculation."""
        profile = PatientProfile(
            patient_id="PROT_TEST",
            date_of_birth=date(1955, 1, 1),  # 65+ years old
            sex=Sex.MALE,
            height_cm=175,
            weight_kg=80,
            assessment_date=date(2024, 1, 1),
        )
        patient = Patient(profile=profile)

        # Older adult should have higher protein needs
        assert patient.recommended_protein_g >= 80 * 1.0  # At least 1.0 g/kg
