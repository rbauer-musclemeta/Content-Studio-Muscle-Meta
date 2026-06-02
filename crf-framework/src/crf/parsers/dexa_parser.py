"""DEXA scan PDF parsing module.

This module provides specialized parsing for Dual-Energy X-ray Absorptiometry
(DEXA) scan reports, extracting T-scores for bone mineral density and body
composition measurements relevant to sarcopenia and osteosarcopenia assessment.

DISCLAIMER:
    This parser is a convenience tool for pre-populating assessment forms.
    Users MUST verify all extracted values against their original DEXA reports.
    This is NOT a medical device and should not be used for clinical diagnosis.

Key Metrics Extracted:
    - T-scores: Spine (L1-L4), Total Hip, Femoral Neck, Forearm
    - Z-scores: Age-matched comparisons
    - Body Composition: Lean mass, fat mass, body fat %, ASM, ASMI
    - Regional: Android/Gynoid fat distribution, VAT

Clinical Context:
    - T-score >= -1.0: Normal bone density
    - T-score -1.0 to -2.5: Osteopenia
    - T-score <= -2.5: Osteoporosis
    - ASMI < 7.0 kg/m2 (men) or < 5.5 kg/m2 (women): Low muscle mass (EWGSOP2)
"""

import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from crf.parsers.pdf_extractor import extract_text_from_pdf
from crf.parsers.biomarker_patterns import COMPILED_DEXA_PATTERNS

logger = logging.getLogger(__name__)


@dataclass
class TScoreResult:
    """T-score measurement from a DEXA scan.

    T-scores compare bone mineral density to a healthy 30-year-old adult.
    Negative values indicate lower density than the reference population.

    Attributes:
        site: Anatomical site (spine, hip, femoral_neck, forearm)
        t_score: The T-score value (typically -4.0 to +3.0)
        z_score: Optional Z-score (age-matched comparison)
        bmd: Optional bone mineral density in g/cm2
        confidence: Extraction confidence (0.0-1.0)
    """
    site: str
    t_score: float
    z_score: Optional[float] = None
    bmd: Optional[float] = None
    confidence: float = 0.9


@dataclass
class BodyCompositionResult:
    """Body composition measurements from a DEXA scan.

    These values are critical for sarcopenia assessment per EWGSOP2 criteria.

    Attributes:
        lean_mass_kg: Total lean body mass in kilograms
        fat_mass_kg: Total fat mass in kilograms
        body_fat_pct: Body fat percentage
        asm_kg: Appendicular skeletal muscle mass in kilograms
        asmi: ASM index (ASM/height^2) in kg/m2
        android_fat_pct: Android region fat percentage
        gynoid_fat_pct: Gynoid region fat percentage
        ag_ratio: Android/Gynoid fat ratio
        vat_g: Visceral adipose tissue in grams
        confidence: Extraction confidence scores per metric
    """
    lean_mass_kg: Optional[float] = None
    fat_mass_kg: Optional[float] = None
    body_fat_pct: Optional[float] = None
    asm_kg: Optional[float] = None
    asmi: Optional[float] = None
    android_fat_pct: Optional[float] = None
    gynoid_fat_pct: Optional[float] = None
    ag_ratio: Optional[float] = None
    vat_g: Optional[float] = None
    confidence: Dict[str, float] = field(default_factory=dict)


@dataclass
class DexaScanResult:
    """Complete DEXA scan parsing result.

    Attributes:
        t_scores: List of T-score results by anatomical site
        z_scores: Optional Z-scores for age-matched comparison
        body_composition: Body composition measurements
        raw_text: Original extracted text for verification
        warnings: List of parsing warnings or issues
        confidence: Overall parsing confidence score
    """
    t_scores: List[TScoreResult] = field(default_factory=list)
    z_scores: Dict[str, float] = field(default_factory=dict)
    body_composition: Optional[BodyCompositionResult] = None
    raw_text: str = ""
    warnings: List[str] = field(default_factory=list)
    confidence: float = 0.0

    def get_lowest_t_score(self) -> Optional[TScoreResult]:
        """Get the lowest T-score (most concerning for osteoporosis).

        Returns:
            TScoreResult with lowest value, or None if no T-scores found.
        """
        if not self.t_scores:
            return None
        return min(self.t_scores, key=lambda x: x.t_score)

    def get_osteoporosis_category(self) -> str:
        """Determine osteoporosis category based on lowest T-score.

        Returns:
            One of: 'normal', 'osteopenia', 'osteoporosis', or 'unknown'
        """
        lowest = self.get_lowest_t_score()
        if lowest is None:
            return "unknown"

        if lowest.t_score <= -2.5:
            return "osteoporosis"
        elif lowest.t_score <= -1.0:
            return "osteopenia"
        else:
            return "normal"

    def to_dict(self) -> dict:
        """Convert result to dictionary format.

        Returns:
            Dictionary representation suitable for JSON serialization.
        """
        result = {
            "t_scores": {},
            "body_composition": {},
            "confidence": {},
            "warnings": self.warnings,
            "raw_text": self.raw_text,
        }

        for ts in self.t_scores:
            result["t_scores"][ts.site] = {
                "t_score": ts.t_score,
                "z_score": ts.z_score,
                "bmd": ts.bmd,
                "confidence": ts.confidence,
            }

        if self.body_composition:
            bc = self.body_composition
            result["body_composition"] = {
                "lean_mass_kg": bc.lean_mass_kg,
                "fat_mass_kg": bc.fat_mass_kg,
                "body_fat_pct": bc.body_fat_pct,
                "asm_kg": bc.asm_kg,
                "asmi": bc.asmi,
                "android_fat_pct": bc.android_fat_pct,
                "gynoid_fat_pct": bc.gynoid_fat_pct,
                "ag_ratio": bc.ag_ratio,
                "vat_g": bc.vat_g,
            }
            result["confidence"] = bc.confidence

        return result


def parse_dexa_scan(file_path: str) -> DexaScanResult:
    """Parse a DEXA scan PDF and extract all relevant measurements.

    This is the main entry point for DEXA scan parsing. It extracts both
    bone mineral density T-scores and body composition data when available.

    Args:
        file_path: Path to the DEXA scan PDF file.

    Returns:
        DexaScanResult: Complete parsing result including T-scores,
                       body composition, and confidence scores.

    Example:
        >>> result = parse_dexa_scan("/path/to/dexa_scan.pdf")
        >>> print(f"Lowest T-score: {result.get_lowest_t_score().t_score}")
        >>> print(f"Category: {result.get_osteoporosis_category()}")
        >>> if result.body_composition:
        ...     print(f"ASMI: {result.body_composition.asmi} kg/m2")

    Note:
        - Users MUST verify all extracted values against their original reports
        - T-score extraction is typically high confidence
        - Body composition extraction varies by report format
    """
    result = DexaScanResult()

    try:
        text = extract_text_from_pdf(file_path)
        result.raw_text = text
    except Exception as e:
        result.warnings.append(f"PDF extraction failed: {str(e)}")
        return result

    if not text:
        result.warnings.append("No text extracted from PDF")
        return result

    # Extract T-scores
    t_scores = extract_t_scores(text)
    result.t_scores = t_scores

    # Extract Z-scores
    z_scores = _extract_z_scores(text)
    result.z_scores = z_scores

    # Match Z-scores to T-scores if available
    for ts in result.t_scores:
        z_key = f"z_score_{ts.site}"
        if z_key in z_scores:
            ts.z_score = z_scores[z_key]

    # Extract body composition
    body_comp = extract_body_composition(text)
    result.body_composition = body_comp

    # Calculate overall confidence
    confidence_scores = []
    if result.t_scores:
        confidence_scores.extend([ts.confidence for ts in result.t_scores])
    if body_comp and body_comp.confidence:
        confidence_scores.extend(body_comp.confidence.values())

    if confidence_scores:
        result.confidence = sum(confidence_scores) / len(confidence_scores)

    # Add warnings for missing critical data
    if not result.t_scores:
        result.warnings.append("No T-scores found in document")
    if not body_comp or body_comp.asm_kg is None:
        result.warnings.append("No appendicular muscle mass (ASM) found - required for sarcopenia assessment")

    return result


def extract_t_scores(text: str) -> List[TScoreResult]:
    """Extract T-scores from DEXA scan text.

    T-scores are extracted for multiple anatomical sites commonly reported:
    - Lumbar Spine (L1-L4)
    - Total Hip
    - Femoral Neck
    - Forearm (1/3 radius)

    Args:
        text: Extracted text from DEXA scan PDF.

    Returns:
        List of TScoreResult objects, one per anatomical site found.

    Example:
        >>> text = "Lumbar Spine T-score: -1.5  Total Hip T-score: -2.0"
        >>> t_scores = extract_t_scores(text)
        >>> for ts in t_scores:
        ...     print(f"{ts.site}: {ts.t_score}")
        spine: -1.5
        hip: -2.0
    """
    results = []
    sites_found = set()

    site_mapping = {
        "t_score_spine": "spine",
        "t_score_hip": "hip",
        "t_score_femoral_neck": "femoral_neck",
        "t_score_forearm": "forearm",
    }

    for pattern_key, site_name in site_mapping.items():
        if pattern_key not in COMPILED_DEXA_PATTERNS:
            continue

        for compiled_pattern, _ in COMPILED_DEXA_PATTERNS[pattern_key]:
            match = compiled_pattern.search(text)
            if match and site_name not in sites_found:
                try:
                    value = float(match.group(1))
                    # Validate T-score range (typically -5.0 to +3.0)
                    if -6.0 <= value <= 4.0:
                        results.append(TScoreResult(
                            site=site_name,
                            t_score=value,
                            confidence=0.9,
                        ))
                        sites_found.add(site_name)
                        break
                except (ValueError, IndexError):
                    continue

    return results


def _extract_z_scores(text: str) -> Dict[str, float]:
    """Extract Z-scores from DEXA scan text.

    Z-scores compare bone density to an age-matched reference population,
    useful for identifying bone loss beyond normal aging.

    Args:
        text: Extracted text from DEXA scan PDF.

    Returns:
        Dictionary mapping site keys to Z-score values.
    """
    results = {}

    z_score_keys = ["z_score_spine", "z_score_hip", "z_score_femoral_neck"]

    for pattern_key in z_score_keys:
        if pattern_key not in COMPILED_DEXA_PATTERNS:
            continue

        for compiled_pattern, _ in COMPILED_DEXA_PATTERNS[pattern_key]:
            match = compiled_pattern.search(text)
            if match and pattern_key not in results:
                try:
                    value = float(match.group(1))
                    if -6.0 <= value <= 4.0:
                        results[pattern_key] = value
                        break
                except (ValueError, IndexError):
                    continue

    return results


def extract_body_composition(text: str) -> BodyCompositionResult:
    """Extract body composition measurements from DEXA scan text.

    Body composition data is critical for sarcopenia assessment per EWGSOP2:
    - ASM (Appendicular Skeletal Muscle Mass)
    - ASMI (ASM Index = ASM/height^2)

    Args:
        text: Extracted text from DEXA scan PDF.

    Returns:
        BodyCompositionResult with extracted measurements and confidence scores.

    Example:
        >>> text = "Total Lean Mass: 52.3 kg  ASM: 21.5 kg  Body Fat: 28.5%"
        >>> bc = extract_body_composition(text)
        >>> print(f"Lean mass: {bc.lean_mass_kg} kg")
        >>> print(f"ASM: {bc.asm_kg} kg")
    """
    result = BodyCompositionResult()
    confidence = {}

    # Mapping of DEXA pattern keys to result attributes
    field_mapping = {
        "lean_mass_total": ("lean_mass_kg", (20.0, 100.0)),  # Valid range in kg
        "fat_mass_total": ("fat_mass_kg", (5.0, 80.0)),
        "body_fat_percentage": ("body_fat_pct", (5.0, 60.0)),
        "asm": ("asm_kg", (10.0, 40.0)),
        "asmi": ("asmi", (4.0, 12.0)),
        "android_fat": ("android_fat_pct", (10.0, 70.0)),
        "gynoid_fat": ("gynoid_fat_pct", (15.0, 60.0)),
        "android_gynoid_ratio": ("ag_ratio", (0.3, 2.5)),
        "vat": ("vat_g", (50.0, 3000.0)),
    }

    for pattern_key, (attr_name, valid_range) in field_mapping.items():
        if pattern_key not in COMPILED_DEXA_PATTERNS:
            continue

        for compiled_pattern, expected_unit in COMPILED_DEXA_PATTERNS[pattern_key]:
            match = compiled_pattern.search(text)
            if match:
                try:
                    value = float(match.group(1))

                    # Convert pounds to kg if needed
                    if expected_unit == "kg" and "lb" in text[match.start():match.end() + 5].lower():
                        value = value * 0.453592

                    # Validate against physiological range
                    min_val, max_val = valid_range
                    if min_val <= value <= max_val:
                        setattr(result, attr_name, value)
                        confidence[attr_name] = 0.85
                        break
                    else:
                        # Out of range - lower confidence
                        setattr(result, attr_name, value)
                        confidence[attr_name] = 0.5
                        break
                except (ValueError, IndexError):
                    continue

    result.confidence = confidence
    return result


def assess_sarcopenia_risk(body_comp: BodyCompositionResult, sex: str = "male") -> Dict[str, any]:
    """Assess sarcopenia risk based on EWGSOP2 criteria for muscle mass.

    This evaluates the ASM Index (ASMI) against EWGSOP2 cutoffs:
    - Men: ASMI < 7.0 kg/m2 indicates low muscle mass
    - Women: ASMI < 5.5 kg/m2 indicates low muscle mass

    Args:
        body_comp: Body composition result from DEXA parsing.
        sex: Biological sex ('male' or 'female') for appropriate cutoffs.

    Returns:
        Dictionary with:
            - low_muscle_mass: Boolean indicating if criteria met
            - asmi: The ASMI value if available
            - cutoff: The applicable EWGSOP2 cutoff
            - category: 'normal', 'low_muscle_mass', or 'unknown'
            - note: Clinical context

    Example:
        >>> bc = BodyCompositionResult(asmi=6.2)
        >>> risk = assess_sarcopenia_risk(bc, sex="male")
        >>> print(risk['category'])
        'low_muscle_mass'
    """
    cutoffs = {
        "male": 7.0,
        "female": 5.5,
    }

    sex_normalized = sex.lower()
    if sex_normalized not in cutoffs:
        sex_normalized = "male"  # Default

    cutoff = cutoffs[sex_normalized]

    result = {
        "low_muscle_mass": False,
        "asmi": body_comp.asmi,
        "cutoff": cutoff,
        "category": "unknown",
        "note": "",
    }

    if body_comp.asmi is None:
        result["note"] = "ASMI not available - sarcopenia muscle mass criteria cannot be assessed"
        return result

    if body_comp.asmi < cutoff:
        result["low_muscle_mass"] = True
        result["category"] = "low_muscle_mass"
        result["note"] = (
            f"ASMI {body_comp.asmi} kg/m2 is below EWGSOP2 cutoff of {cutoff} kg/m2 for {sex_normalized}s. "
            "Low muscle mass criterion is MET. "
            "Confirm sarcopenia with strength testing (grip strength or chair stand)."
        )
    else:
        result["category"] = "normal"
        result["note"] = (
            f"ASMI {body_comp.asmi} kg/m2 meets EWGSOP2 threshold of {cutoff} kg/m2 for {sex_normalized}s. "
            "Muscle mass is within normal limits for this criterion."
        )

    return result


def assess_osteosarcopenia_risk(
    t_scores: List[TScoreResult],
    body_comp: BodyCompositionResult,
    sex: str = "male"
) -> Dict[str, any]:
    """Assess combined osteosarcopenia risk.

    Osteosarcopenia is the co-occurrence of osteoporosis/osteopenia AND
    low muscle mass, representing compound risk for fractures and falls.

    Args:
        t_scores: T-score results from DEXA parsing.
        body_comp: Body composition results.
        sex: Biological sex for ASMI cutoffs.

    Returns:
        Dictionary with:
            - has_bone_loss: True if osteopenia or osteoporosis present
            - has_low_muscle: True if ASMI below EWGSOP2 cutoff
            - osteosarcopenia_risk: 'high', 'moderate', 'low', or 'unknown'
            - recommendation: Clinical recommendation
    """
    result = {
        "has_bone_loss": False,
        "has_low_muscle": False,
        "osteosarcopenia_risk": "unknown",
        "bone_category": "unknown",
        "muscle_category": "unknown",
        "recommendation": "",
    }

    # Assess bone status
    if t_scores:
        lowest = min(t_scores, key=lambda x: x.t_score)
        if lowest.t_score <= -2.5:
            result["has_bone_loss"] = True
            result["bone_category"] = "osteoporosis"
        elif lowest.t_score <= -1.0:
            result["has_bone_loss"] = True
            result["bone_category"] = "osteopenia"
        else:
            result["bone_category"] = "normal"

    # Assess muscle status
    sarcopenia = assess_sarcopenia_risk(body_comp, sex)
    if sarcopenia["low_muscle_mass"]:
        result["has_low_muscle"] = True
        result["muscle_category"] = "low_muscle_mass"
    elif sarcopenia["category"] == "normal":
        result["muscle_category"] = "normal"

    # Determine combined risk
    if result["has_bone_loss"] and result["has_low_muscle"]:
        result["osteosarcopenia_risk"] = "high"
        result["recommendation"] = (
            "OSTEOSARCOPENIA INDICATED: Both low bone density and low muscle mass present. "
            "Recommend comprehensive intervention addressing bone and muscle health simultaneously. "
            "Consider resistance training, protein optimization (1.2-1.6g/kg/day), vitamin D/calcium, "
            "fall prevention, and specialist referral."
        )
    elif result["has_bone_loss"] or result["has_low_muscle"]:
        result["osteosarcopenia_risk"] = "moderate"
        if result["has_bone_loss"]:
            result["recommendation"] = (
                f"{result['bone_category'].upper()}: Low bone density present. "
                "Monitor muscle mass closely - bone loss often precedes muscle wasting by 7-14 days. "
                "Implement bone-protective exercise and nutrition protocols."
            )
        else:
            result["recommendation"] = (
                "LOW MUSCLE MASS: Sarcopenia muscle criterion met. "
                "Monitor bone health closely and implement resistance training with adequate protein. "
                "The GMMBB Axis may be dysregulated."
            )
    elif result["bone_category"] == "normal" and result["muscle_category"] == "normal":
        result["osteosarcopenia_risk"] = "low"
        result["recommendation"] = (
            "Bone density and muscle mass within normal limits. "
            "Maintain with regular resistance exercise and adequate protein (1.0-1.2g/kg/day)."
        )

    return result
