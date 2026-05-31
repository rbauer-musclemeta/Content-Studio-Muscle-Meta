"""Golden-vector tests for validated screening instruments (SARC-F, MUST).

Cut-offs are pinned to the published instruments, so these tests assert exact
behaviour at the category boundaries rather than relative ordering.
"""

from datetime import date

import pytest

from crf.models.patient import Patient, PatientProfile, Sex
from crf.models.measurements import ClinicalContext, SarcFResponses
from crf.instruments.sarcf import SarcF
from crf.instruments.must import Must
from crf.instruments.base import ScreeningPanel


def make_patient(
    *,
    height_cm: float = 170.0,
    weight_kg: float = 70.0,
    weight_loss_kg=None,
    sarcf: SarcFResponses | None = None,
    acutely_ill: bool = False,
    days_without_nutrition: int = 0,
) -> Patient:
    """Build a patient with only the fields the instruments need."""
    profile = PatientProfile(
        patient_id="T",
        date_of_birth=date(1950, 1, 1),
        sex=Sex.MALE,
        height_cm=height_cm,
        weight_kg=weight_kg,
    )
    return Patient(
        profile=profile,
        recent_weight_loss_kg=weight_loss_kg,
        sarcf=sarcf,
        clinical_context=ClinicalContext(
            acutely_ill=acutely_ill, days_without_nutrition=days_without_nutrition
        ),
    )


def sarcf_responses(total_via_strength_and_walking: tuple[int, int]) -> SarcFResponses:
    """Build SARC-F responses with a controlled total via two items."""
    s, w = total_via_strength_and_walking
    return SarcFResponses(
        strength=s,
        assistance_walking=w,
        rising_from_chair=0,
        climbing_stairs=0,
        falls=0,
    )


class TestSarcF:
    """SARC-F: total 0-10, positive screen at >= 4."""

    def test_total_computation(self):
        responses = SarcFResponses(
            strength=2,
            assistance_walking=1,
            rising_from_chair=1,
            climbing_stairs=2,
            falls=1,
        )
        assert responses.total == 7

    def test_below_threshold_is_negative(self):
        patient = make_patient(sarcf=sarcf_responses((2, 1)))  # total 3
        result = SarcF().score(patient)
        assert result.applicable is True
        assert result.raw_score == 3
        assert result.category == "Screen negative"

    def test_at_threshold_is_positive(self):
        patient = make_patient(sarcf=sarcf_responses((2, 2)))  # total 4
        result = SarcF().score(patient)
        assert result.raw_score == 4
        assert result.category == "Screen positive (suggestive of sarcopenia)"

    def test_not_assessable_without_responses(self):
        patient = make_patient(sarcf=None)
        result = SarcF().score(patient)
        assert result.applicable is False
        assert "sarcf" in result.missing_inputs
        assert result.category is None

    def test_validation_status_is_validated(self):
        patient = make_patient(sarcf=sarcf_responses((0, 0)))
        result = SarcF().score(patient)
        assert result.validation_status == "validated"
        assert "EWGSOP2" in result.citation


class TestMustBmiComponent:
    """BMI: >20 -> 0, 18.5-20 -> 1, <18.5 -> 2 (height 1 m makes BMI == weight_kg)."""

    @pytest.mark.parametrize(
        "weight_kg, expected_total",
        [
            (20.1, 0),  # BMI 20.1 -> 0
            (20.0, 1),  # BMI 20.0 -> 1 (not > 20)
            (18.5, 1),  # BMI 18.5 -> 1
            (18.4, 2),  # BMI 18.4 -> 2
        ],
    )
    def test_bmi_boundaries(self, weight_kg, expected_total):
        # No weight loss, not acutely ill -> only BMI contributes.
        patient = make_patient(height_cm=100.0, weight_kg=weight_kg, weight_loss_kg=0.0)
        result = Must().score(patient)
        assert result.raw_score == expected_total


class TestMustWeightLossComponent:
    """Weight loss: <5% -> 0, 5-10% -> 1, >10% -> 2 (BMI kept high so it scores 0)."""

    @pytest.mark.parametrize(
        "current_kg, loss_kg, expected_total",
        [
            (95.1, 4.9, 0),  # 4.9% of 100 -> 0
            (95.0, 5.0, 1),  # 5.0% -> 1
            (90.0, 10.0, 1),  # 10.0% -> 1
            (89.9, 10.1, 2),  # 10.1% -> 2
        ],
    )
    def test_weight_loss_boundaries(self, current_kg, loss_kg, expected_total):
        # height 1 m -> BMI == current_kg (>20) -> BMI component 0.
        patient = make_patient(
            height_cm=100.0, weight_kg=current_kg, weight_loss_kg=loss_kg
        )
        result = Must().score(patient)
        assert result.raw_score == expected_total

    def test_weight_loss_percent_helper(self):
        patient = make_patient(height_cm=100.0, weight_kg=95.0, weight_loss_kg=5.0)
        # 5 kg lost from a pre-loss 100 kg -> 5.0%
        assert patient.weight_loss_percent == 5.0


class TestMustAcuteComponent:
    """Acute disease effect: acutely ill AND >=5 days no intake -> 2."""

    def test_acute_below_five_days(self):
        patient = make_patient(
            height_cm=100.0,
            weight_kg=90.0,
            weight_loss_kg=0.0,
            acutely_ill=True,
            days_without_nutrition=4,
        )
        assert Must().score(patient).raw_score == 0

    def test_acute_at_five_days(self):
        patient = make_patient(
            height_cm=100.0,
            weight_kg=90.0,
            weight_loss_kg=0.0,
            acutely_ill=True,
            days_without_nutrition=5,
        )
        assert Must().score(patient).raw_score == 2

    def test_acute_requires_illness_flag(self):
        patient = make_patient(
            height_cm=100.0,
            weight_kg=90.0,
            weight_loss_kg=0.0,
            acutely_ill=False,
            days_without_nutrition=10,
        )
        assert Must().score(patient).raw_score == 0


class TestMustCategories:
    """Total: 0 -> Low, 1 -> Medium, >=2 -> High."""

    def test_low_risk(self):
        patient = make_patient(height_cm=100.0, weight_kg=90.0, weight_loss_kg=0.0)
        assert Must().score(patient).category == "Low risk"

    def test_medium_risk(self):
        # 5% weight loss -> 1 point, BMI 0, acute 0.
        patient = make_patient(height_cm=100.0, weight_kg=95.0, weight_loss_kg=5.0)
        assert Must().score(patient).category == "Medium risk"

    def test_high_risk(self):
        # BMI 18.4 -> 2 points alone.
        patient = make_patient(height_cm=100.0, weight_kg=18.4, weight_loss_kg=0.0)
        assert Must().score(patient).category == "High risk"

    def test_not_assessable_without_weight_history(self):
        patient = make_patient(weight_loss_kg=None)
        result = Must().score(patient)
        assert result.applicable is False
        assert "recent_weight_loss_kg" in result.missing_inputs


class TestScreeningPanel:
    """The panel runs every instrument and reports applicability."""

    def test_panel_runs_all_instruments(self):
        patient = make_patient(
            sarcf=sarcf_responses((2, 2)), weight_loss_kg=0.0
        )
        results = ScreeningPanel().run(patient)
        names = {r.instrument for r in results}
        assert names == {"SARC-F", "MUST"}
        assert all(r.applicable for r in results)

    def test_panel_marks_missing_inputs_not_applicable(self):
        # No SARC-F responses, no weight history -> both not assessable.
        patient = make_patient(sarcf=None, weight_loss_kg=None)
        results = ScreeningPanel().run(patient)
        assert all(r.applicable is False for r in results)
        assert ScreeningPanel().applicable_results(patient) == []
