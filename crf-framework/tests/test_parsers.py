"""Tests for the lab report and DEXA scan parsing module.

These tests verify the pattern matching, unit normalization, and range
validation functionality of the parsers module.
"""

import pytest
from crf.parsers import (
    normalize_units,
    validate_ranges,
    BIOMARKER_PATTERNS,
    DEXA_PATTERNS,
)
from crf.parsers.biomarker_patterns import COMPILED_BIOMARKER_PATTERNS, COMPILED_DEXA_PATTERNS
from crf.parsers.dexa_parser import (
    extract_t_scores,
    extract_body_composition,
    assess_sarcopenia_risk,
    assess_osteosarcopenia_risk,
    TScoreResult,
    BodyCompositionResult,
)
from crf.parsers.normalizer import (
    normalize_and_validate,
    get_reference_range,
    batch_normalize,
)


class TestBiomarkerPatterns:
    """Test biomarker regex pattern matching."""

    def test_albumin_patterns(self):
        """Test albumin extraction patterns."""
        test_text = "Albumin: 4.2 g/dL  Reference: 3.5-5.0"
        for pattern, unit in COMPILED_BIOMARKER_PATTERNS["albumin"]:
            match = pattern.search(test_text)
            if match:
                assert float(match.group(1)) == 4.2
                break
        else:
            pytest.fail("No albumin pattern matched")

    def test_glucose_patterns(self):
        """Test glucose extraction patterns."""
        test_texts = [
            ("Glucose, Fasting: 95 mg/dL", 95.0),
            ("Fasting Glucose: 102 mg/dL", 102.0),
            ("Glucose: 88 mg/dL", 88.0),
        ]
        for text, expected in test_texts:
            matched = False
            for pattern, unit in COMPILED_BIOMARKER_PATTERNS["glucose_fasting"]:
                match = pattern.search(text)
                if match:
                    assert float(match.group(1)) == expected
                    matched = True
                    break
            assert matched, f"No pattern matched: {text}"

    def test_hba1c_patterns(self):
        """Test HbA1c extraction patterns."""
        test_texts = [
            ("HbA1c: 5.7%", 5.7),
            ("Hemoglobin A1c: 6.2%", 6.2),
            ("A1c: 5.4%", 5.4),
        ]
        for text, expected in test_texts:
            matched = False
            for pattern, unit in COMPILED_BIOMARKER_PATTERNS["hba1c"]:
                match = pattern.search(text)
                if match:
                    assert float(match.group(1)) == expected
                    matched = True
                    break
            assert matched, f"No pattern matched: {text}"

    def test_vitamin_d_patterns(self):
        """Test Vitamin D extraction patterns."""
        test_texts = [
            ("Vitamin D, 25-OH: 45 ng/mL", 45.0),
            ("25-Hydroxyvitamin D: 32 ng/mL", 32.0),
            ("Vitamin D 25-OH: 28 ng/mL", 28.0),
        ]
        for text, expected in test_texts:
            matched = False
            for pattern, unit in COMPILED_BIOMARKER_PATTERNS["vitamin_d"]:
                match = pattern.search(text)
                if match:
                    assert float(match.group(1)) == expected
                    matched = True
                    break
            assert matched, f"No pattern matched: {text}"

    def test_crp_patterns(self):
        """Test CRP extraction patterns."""
        test_texts = [
            ("C-Reactive Protein: 2.5 mg/L", 2.5),
            ("CRP: 1.2 mg/L", 1.2),
            ("hs-CRP: 0.8 mg/L", 0.8),
        ]
        for text, expected in test_texts:
            matched = False
            for pattern, unit in COMPILED_BIOMARKER_PATTERNS["crp"]:
                match = pattern.search(text)
                if match:
                    assert float(match.group(1)) == expected
                    matched = True
                    break
            assert matched, f"No pattern matched: {text}"


class TestDexaPatterns:
    """Test DEXA scan regex pattern matching."""

    def test_t_score_spine_patterns(self):
        """Test spine T-score extraction."""
        test_texts = [
            ("Lumbar Spine T-Score: -1.5", -1.5),
            ("L1-L4 T-Score: -2.0", -2.0),
            ("Spine T-score: -0.8", -0.8),
        ]
        for text, expected in test_texts:
            matched = False
            for pattern, unit in COMPILED_DEXA_PATTERNS["t_score_spine"]:
                match = pattern.search(text)
                if match:
                    assert float(match.group(1)) == expected
                    matched = True
                    break
            assert matched, f"No pattern matched: {text}"

    def test_t_score_hip_patterns(self):
        """Test hip T-score extraction."""
        test_text = "Total Hip T-Score: -1.8"
        matched = False
        for pattern, unit in COMPILED_DEXA_PATTERNS["t_score_hip"]:
            match = pattern.search(test_text)
            if match:
                assert float(match.group(1)) == -1.8
                matched = True
                break
        assert matched

    def test_asm_patterns(self):
        """Test appendicular skeletal muscle mass extraction."""
        test_texts = [
            ("Appendicular Skeletal Muscle Mass: 22.5 kg", 22.5),
            ("ASM: 21.0 kg", 21.0),
            ("ASMM: 23.2 kg", 23.2),
        ]
        for text, expected in test_texts:
            matched = False
            for pattern, unit in COMPILED_DEXA_PATTERNS["asm"]:
                match = pattern.search(text)
                if match:
                    assert float(match.group(1)) == expected
                    matched = True
                    break
            assert matched, f"No pattern matched: {text}"


class TestUnitNormalization:
    """Test unit conversion functionality."""

    def test_glucose_mmol_to_mg(self):
        """Test glucose conversion from mmol/L to mg/dL."""
        result = normalize_units("glucose_fasting", 5.5, "mmol/L")
        assert result.standard_unit == "mg/dL"
        assert 99.0 <= result.converted_value <= 99.2  # ~99.1

    def test_vitamin_d_nmol_to_ng(self):
        """Test Vitamin D conversion from nmol/L to ng/mL."""
        result = normalize_units("vitamin_d", 75, "nmol/L")
        assert result.standard_unit == "ng/mL"
        assert result.converted_value == 30.0

    def test_testosterone_nmol_to_ng(self):
        """Test testosterone conversion from nmol/L to ng/dL."""
        result = normalize_units("testosterone", 15, "nmol/L")
        assert result.standard_unit == "ng/dL"
        assert 432 <= result.converted_value <= 433  # ~432.6

    def test_already_standard_unit(self):
        """Test that standard units pass through unchanged."""
        result = normalize_units("glucose_fasting", 95, "mg/dL")
        assert result.converted_value == 95.0
        assert result.standard_unit == "mg/dL"
        assert result.confidence >= 0.9

    def test_unknown_biomarker(self):
        """Test handling of unknown biomarker names."""
        result = normalize_units("unknown_marker", 100, "units")
        assert result.converted_value == 100
        assert result.confidence == 0.5  # Lower confidence


class TestRangeValidation:
    """Test physiological range validation."""

    def test_glucose_within_normal(self):
        """Test glucose within normal range."""
        result = validate_ranges("glucose_fasting", 95)
        assert result.is_valid is True
        assert result.is_plausible is True
        assert result.range_category == "within_normal"
        assert result.warning is None

    def test_glucose_above_normal(self):
        """Test glucose above normal range."""
        result = validate_ranges("glucose_fasting", 130)
        assert result.is_valid is True
        assert result.is_plausible is True
        assert result.range_category == "above_normal"
        assert "above normal" in result.warning.lower()

    def test_glucose_implausible(self):
        """Test implausible glucose value."""
        result = validate_ranges("glucose_fasting", 5000)
        assert result.is_valid is False
        assert result.is_plausible is False
        assert result.range_category == "implausible"

    def test_t_score_normal(self):
        """Test normal T-score validation."""
        result = validate_ranges("t_score_spine", -0.5)
        assert result.range_category == "within_normal"

    def test_t_score_osteoporosis(self):
        """Test osteoporosis-range T-score."""
        result = validate_ranges("t_score_spine", -2.8)
        assert result.is_plausible is True
        assert result.range_category == "below_normal"

    def test_unknown_biomarker(self):
        """Test validation of unknown biomarker."""
        result = validate_ranges("unknown_marker", 50)
        assert result.is_valid is True  # Can't invalidate unknown
        assert result.range_category == "unknown"


class TestTScoreExtraction:
    """Test DEXA T-score extraction from text."""

    def test_extract_multiple_t_scores(self):
        """Test extraction of multiple T-scores from DEXA text."""
        dexa_text = """
        Bone Mineral Density Report

        Lumbar Spine T-Score: -1.2
        Total Hip T-Score: -0.8
        Femoral Neck T-Score: -1.5
        """
        t_scores = extract_t_scores(dexa_text)

        assert len(t_scores) >= 2
        sites = {ts.site for ts in t_scores}
        assert "spine" in sites or "hip" in sites

    def test_extract_negative_t_scores(self):
        """Test extraction of negative T-score values."""
        dexa_text = "Lumbar Spine T-Score: -2.5"
        t_scores = extract_t_scores(dexa_text)

        assert len(t_scores) == 1
        assert t_scores[0].t_score == -2.5
        assert t_scores[0].site == "spine"


class TestBodyCompositionExtraction:
    """Test DEXA body composition extraction."""

    def test_extract_body_composition(self):
        """Test extraction of body composition metrics."""
        dexa_text = """
        Body Composition Analysis

        Total Lean Mass: 52.3 kg
        Total Fat Mass: 18.5 kg
        Body Fat: 26.1%
        Appendicular Skeletal Muscle Mass: 21.5 kg
        ASMI: 7.2 kg/m2
        """
        bc = extract_body_composition(dexa_text)

        assert bc.lean_mass_kg == 52.3
        assert bc.fat_mass_kg == 18.5
        assert bc.body_fat_pct == 26.1
        assert bc.asm_kg == 21.5
        assert bc.asmi == 7.2


class TestSarcopeniaRiskAssessment:
    """Test sarcopenia risk assessment functions."""

    def test_low_muscle_mass_male(self):
        """Test low muscle mass detection for males."""
        bc = BodyCompositionResult(asmi=6.2)
        result = assess_sarcopenia_risk(bc, sex="male")

        assert result["low_muscle_mass"] is True
        assert result["category"] == "low_muscle_mass"
        assert result["cutoff"] == 7.0

    def test_normal_muscle_mass_male(self):
        """Test normal muscle mass for males."""
        bc = BodyCompositionResult(asmi=7.5)
        result = assess_sarcopenia_risk(bc, sex="male")

        assert result["low_muscle_mass"] is False
        assert result["category"] == "normal"

    def test_low_muscle_mass_female(self):
        """Test low muscle mass detection for females."""
        bc = BodyCompositionResult(asmi=5.0)
        result = assess_sarcopenia_risk(bc, sex="female")

        assert result["low_muscle_mass"] is True
        assert result["cutoff"] == 5.5

    def test_normal_muscle_mass_female(self):
        """Test normal muscle mass for females."""
        bc = BodyCompositionResult(asmi=6.0)
        result = assess_sarcopenia_risk(bc, sex="female")

        assert result["low_muscle_mass"] is False


class TestOsteosarcopeniaAssessment:
    """Test combined osteosarcopenia risk assessment."""

    def test_high_risk_osteosarcopenia(self):
        """Test detection of high osteosarcopenia risk."""
        t_scores = [
            TScoreResult(site="spine", t_score=-2.8),
            TScoreResult(site="hip", t_score=-2.2),
        ]
        bc = BodyCompositionResult(asmi=6.2)

        result = assess_osteosarcopenia_risk(t_scores, bc, sex="male")

        assert result["has_bone_loss"] is True
        assert result["has_low_muscle"] is True
        assert result["osteosarcopenia_risk"] == "high"
        assert "OSTEOSARCOPENIA" in result["recommendation"]

    def test_moderate_risk_bone_only(self):
        """Test moderate risk with bone loss only."""
        t_scores = [
            TScoreResult(site="spine", t_score=-2.0),
        ]
        bc = BodyCompositionResult(asmi=8.0)

        result = assess_osteosarcopenia_risk(t_scores, bc, sex="male")

        assert result["has_bone_loss"] is True
        assert result["has_low_muscle"] is False
        assert result["osteosarcopenia_risk"] == "moderate"

    def test_low_risk(self):
        """Test low risk with normal bone and muscle."""
        t_scores = [
            TScoreResult(site="spine", t_score=-0.5),
        ]
        bc = BodyCompositionResult(asmi=8.5)

        result = assess_osteosarcopenia_risk(t_scores, bc, sex="male")

        assert result["has_bone_loss"] is False
        assert result["has_low_muscle"] is False
        assert result["osteosarcopenia_risk"] == "low"


class TestBatchOperations:
    """Test batch normalization and processing."""

    def test_batch_normalize(self):
        """Test batch normalization of multiple biomarkers."""
        data = {
            "glucose_fasting": {"value": 5.5, "unit": "mmol/L"},
            "vitamin_d": {"value": 75, "unit": "nmol/L"},
            "albumin": {"value": 4.2, "unit": "g/dL"},
        }

        results = batch_normalize(data)

        assert len(results) == 3
        assert results["glucose_fasting"]["normalized_value"] == pytest.approx(99.1, rel=0.01)
        assert results["vitamin_d"]["normalized_value"] == 30.0
        assert results["albumin"]["normalized_value"] == 4.2

    def test_get_reference_range(self):
        """Test retrieval of reference ranges."""
        ref = get_reference_range("glucose_fasting")

        assert ref is not None
        assert ref["min_normal"] == 70.0
        assert ref["max_normal"] == 100.0
        assert ref["unit"] == "mg/dL"

    def test_normalize_and_validate_combined(self):
        """Test combined normalization and validation."""
        conv, valid = normalize_and_validate("glucose_fasting", 5.5, "mmol/L")

        assert conv.converted_value == pytest.approx(99.1, rel=0.01)
        assert valid.range_category == "within_normal"
