"""Golden-vector tests for validated screening instruments (SARC-F, MUST).

Cut-offs are pinned to the published instruments, so these tests assert exact
behaviour at the category boundaries rather than relative ordering.
"""

from datetime import date

import pytest

from crf.models.patient import Patient, PatientProfile, Sex
from crf.models.measurements import (
    ClinicalContext,
    PhysicalMeasurements,
    SarcFResponses,
)
from crf.instruments.sarcf import SarcF
from crf.instruments.must import Must
from crf.instruments.ewgsop2 import Ewgsop2
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


def ewgsop2_patient(
    *,
    sex: Sex = Sex.MALE,
    height_cm: float = 100.0,  # 1 m -> ASM index == ASM (kg) for easy boundaries
    grip=None,
    chair=None,
    gait=None,
    asm=None,
) -> Patient:
    """Build a patient carrying only the EWGSOP2 physical measurements."""
    profile = PatientProfile(
        patient_id="E",
        date_of_birth=date(1945, 1, 1),
        sex=sex,
        height_cm=height_cm,
        weight_kg=70.0,
    )
    return Patient(
        profile=profile,
        physical=PhysicalMeasurements(
            grip_strength_kg=grip,
            chair_stand_5_sec=chair,
            gait_speed_m_s=gait,
            appendicular_skeletal_muscle_kg=asm,
        ),
    )


class TestEwgsop2Applicability:
    def test_not_assessable_without_strength_measure(self):
        result = Ewgsop2().score(ewgsop2_patient(asm=5.0, gait=0.5))
        assert result.applicable is False
        assert "grip_strength_kg or chair_stand_5_sec" in result.missing_inputs


class TestEwgsop2Strength:
    """Low strength gates the entire algorithm."""

    def test_normal_strength_is_no_sarcopenia(self):
        # Even with low mass + slow gait, normal strength => not sarcopenia.
        result = Ewgsop2().score(
            ewgsop2_patient(grip=30.0, asm=4.0, gait=0.5)
        )
        assert result.category == "No sarcopenia"

    def test_grip_boundary_male(self):
        # Cut-off < 27 kg (M): 27.0 normal, 26.9 low.
        assert Ewgsop2().score(ewgsop2_patient(grip=27.0)).category == "No sarcopenia"
        assert Ewgsop2().score(ewgsop2_patient(grip=26.9)).category == "Probable sarcopenia"

    def test_grip_is_sex_specific(self):
        # 20 kg: low for men (<27) but normal for women (>=16).
        assert Ewgsop2().score(
            ewgsop2_patient(sex=Sex.MALE, grip=20.0)
        ).category == "Probable sarcopenia"
        assert Ewgsop2().score(
            ewgsop2_patient(sex=Sex.FEMALE, grip=20.0)
        ).category == "No sarcopenia"

    def test_chair_stand_boundary(self):
        # Cut-off > 15 s: 15.0 normal, 15.1 low (no grip provided).
        assert Ewgsop2().score(ewgsop2_patient(chair=15.0)).category == "No sarcopenia"
        assert Ewgsop2().score(ewgsop2_patient(chair=15.1)).category == "Probable sarcopenia"

    def test_either_measure_can_flag_low_strength(self):
        # Normal grip but slow chair-stand still flags low strength.
        result = Ewgsop2().score(ewgsop2_patient(grip=40.0, chair=20.0))
        assert result.category == "Probable sarcopenia"


class TestEwgsop2Confirmation:
    """Low strength + muscle-mass measure => confirm or refute."""

    def test_probable_when_mass_not_measured(self):
        result = Ewgsop2().score(ewgsop2_patient(grip=20.0))
        assert result.category == "Probable sarcopenia"

    def test_asm_index_boundary_male(self):
        # height 1 m => ASM index == asm. Cut-off < 7.0 (M).
        normal = Ewgsop2().score(ewgsop2_patient(grip=20.0, asm=7.0))
        assert normal.category == "Probable sarcopenia (not confirmed)"
        low = Ewgsop2().score(ewgsop2_patient(grip=20.0, asm=6.99))
        assert low.category == "Confirmed sarcopenia (severity not assessed)"

    def test_asm_index_uses_height(self):
        # 2 m tall, ASM 24 kg -> index 6.0 < 7.0 => low mass (confirmed).
        result = Ewgsop2().score(
            ewgsop2_patient(height_cm=200.0, grip=20.0, asm=24.0)
        )
        assert result.category == "Confirmed sarcopenia (severity not assessed)"


class TestEwgsop2Severity:
    """Confirmed + performance measure => severity staging."""

    def test_confirmed_when_gait_normal(self):
        result = Ewgsop2().score(ewgsop2_patient(grip=20.0, asm=6.0, gait=1.0))
        assert result.category == "Confirmed sarcopenia"

    def test_gait_boundary(self):
        # Cut-off <= 0.8 m/s: 0.81 preserved, 0.80 low.
        preserved = Ewgsop2().score(ewgsop2_patient(grip=20.0, asm=6.0, gait=0.81))
        assert preserved.category == "Confirmed sarcopenia"
        severe = Ewgsop2().score(ewgsop2_patient(grip=20.0, asm=6.0, gait=0.80))
        assert severe.category == "Severe sarcopenia"

    def test_full_severe_pathway(self):
        result = Ewgsop2().score(
            ewgsop2_patient(grip=18.0, chair=20.0, asm=5.0, gait=0.6)
        )
        assert result.category == "Severe sarcopenia"
        assert result.validation_status == "validated"
        assert "EWGSOP2" in result.citation


class TestScreeningPanel:
    """The panel runs every instrument and reports applicability."""

    def test_panel_runs_all_instruments(self):
        patient = make_patient(
            sarcf=sarcf_responses((2, 2)), weight_loss_kg=0.0
        )
        # SARC-F and MUST are applicable; EWGSOP2 lacks physical measures.
        results = ScreeningPanel().run(patient)
        names = {r.instrument for r in results}
        assert names == {"SARC-F", "EWGSOP2", "MUST"}
        applicable = {r.instrument for r in results if r.applicable}
        assert applicable == {"SARC-F", "MUST"}

    def test_panel_marks_missing_inputs_not_applicable(self):
        # No SARC-F responses, no weight history, no physical measures.
        patient = make_patient(sarcf=None, weight_loss_kg=None)
        results = ScreeningPanel().run(patient)
        assert all(r.applicable is False for r in results)
        assert ScreeningPanel().applicable_results(patient) == []
