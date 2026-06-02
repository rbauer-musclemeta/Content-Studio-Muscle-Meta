"""Unit normalization and physiological range validation for biomarkers.

This module provides utilities for converting biomarker values between
different unit systems and validating that values fall within physiologically
plausible ranges.

DISCLAIMER:
    Unit conversions and range checks are for convenience and educational
    purposes only. Users MUST verify all values against their original
    lab reports. This is NOT a medical device.

Standard Units:
    The Muscle-Meta Matrix uses the following standard units:
    - Blood glucose: mg/dL
    - Lipids: mg/dL
    - Hormones: ng/dL (testosterone), mcg/dL (cortisol), ng/mL (IGF-1)
    - Vitamins: ng/mL (Vitamin D), pg/mL (B12)
    - Proteins: g/dL (albumin), mg/L (CRP)
    - Body composition: kg (mass), % (percentages)
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class ConversionResult:
    """Result of a unit conversion operation.

    Attributes:
        original_value: The input value
        original_unit: The input unit
        converted_value: The normalized value
        standard_unit: The standard unit used
        conversion_factor: The factor applied
        confidence: Confidence in the conversion (0.0-1.0)
    """
    original_value: float
    original_unit: str
    converted_value: float
    standard_unit: str
    conversion_factor: float
    confidence: float


@dataclass
class ValidationResult:
    """Result of range validation.

    Attributes:
        value: The validated value
        unit: The unit of measurement
        is_valid: True if within physiological range
        is_plausible: True if within extended plausible range
        range_category: 'within_normal', 'outside_normal', 'implausible'
        warning: Warning message if value is concerning
    """
    value: float
    unit: str
    is_valid: bool
    is_plausible: bool
    range_category: str
    warning: Optional[str] = None


# =============================================================================
# UNIT CONVERSION TABLES
# =============================================================================

# Conversion factors: (from_unit, to_unit) -> factor
# Standard unit is the second element
UNIT_CONVERSIONS: Dict[str, Dict[str, Tuple[str, float]]] = {
    # Glucose conversions
    "glucose_fasting": {
        "mmol/L": ("mg/dL", 18.0182),  # mmol/L * 18.0182 = mg/dL
        "mg/dL": ("mg/dL", 1.0),
    },

    # Cholesterol conversions
    "cholesterol_total": {
        "mmol/L": ("mg/dL", 38.67),
        "mg/dL": ("mg/dL", 1.0),
    },
    "hdl": {
        "mmol/L": ("mg/dL", 38.67),
        "mg/dL": ("mg/dL", 1.0),
    },
    "ldl": {
        "mmol/L": ("mg/dL", 38.67),
        "mg/dL": ("mg/dL", 1.0),
    },

    # Triglycerides conversion
    "triglycerides": {
        "mmol/L": ("mg/dL", 88.57),
        "mg/dL": ("mg/dL", 1.0),
    },

    # Creatinine conversion
    "creatinine": {
        "umol/L": ("mg/dL", 0.0113),  # umol/L * 0.0113 = mg/dL
        "mg/dL": ("mg/dL", 1.0),
    },

    # Vitamin D conversion
    "vitamin_d": {
        "nmol/L": ("ng/mL", 0.4),  # nmol/L * 0.4 = ng/mL
        "ng/mL": ("ng/mL", 1.0),
    },

    # Testosterone conversion
    "testosterone": {
        "nmol/L": ("ng/dL", 28.84),  # nmol/L * 28.84 = ng/dL
        "ng/dL": ("ng/dL", 1.0),
    },

    # Cortisol conversion
    "cortisol": {
        "nmol/L": ("mcg/dL", 0.0362),  # nmol/L * 0.0362 = mcg/dL
        "mcg/dL": ("mcg/dL", 1.0),
        "ug/dL": ("mcg/dL", 1.0),  # Alias
    },

    # Albumin conversion
    "albumin": {
        "g/L": ("g/dL", 0.1),  # g/L * 0.1 = g/dL
        "g/dL": ("g/dL", 1.0),
    },

    # CRP conversion
    "crp": {
        "mg/dL": ("mg/L", 10.0),  # mg/dL * 10 = mg/L
        "mg/L": ("mg/L", 1.0),
    },

    # Body mass conversions
    "lean_mass_kg": {
        "lbs": ("kg", 0.453592),
        "lb": ("kg", 0.453592),
        "kg": ("kg", 1.0),
    },
    "fat_mass_kg": {
        "lbs": ("kg", 0.453592),
        "lb": ("kg", 0.453592),
        "kg": ("kg", 1.0),
    },
    "asm_kg": {
        "lbs": ("kg", 0.453592),
        "lb": ("kg", 0.453592),
        "kg": ("kg", 1.0),
    },

    # Ferritin (commonly in different units)
    "ferritin": {
        "ug/L": ("ng/mL", 1.0),  # Equivalent
        "mcg/L": ("ng/mL", 1.0),
        "ng/mL": ("ng/mL", 1.0),
    },

    # Iron conversion
    "iron": {
        "umol/L": ("mcg/dL", 5.587),  # umol/L * 5.587 = mcg/dL
        "mcg/dL": ("mcg/dL", 1.0),
        "ug/dL": ("mcg/dL", 1.0),
    },
}


# =============================================================================
# PHYSIOLOGICAL REFERENCE RANGES
# =============================================================================

# Reference ranges: (min_physiological, max_physiological, min_normal, max_normal)
# Values outside physiological range are implausible (likely errors)
REFERENCE_RANGES: Dict[str, Tuple[float, float, float, float, str]] = {
    # Nutritional markers
    "albumin": (1.0, 7.0, 3.5, 5.0, "g/dL"),
    "prealbumin": (5.0, 60.0, 20.0, 40.0, "mg/dL"),
    "total_protein": (3.0, 12.0, 6.0, 8.3, "g/dL"),

    # Inflammatory markers
    "crp": (0.0, 500.0, 0.0, 3.0, "mg/L"),  # Can be very high in acute inflammation
    "il6": (0.0, 500.0, 0.0, 7.0, "pg/mL"),
    "tnf_alpha": (0.0, 100.0, 0.0, 8.1, "pg/mL"),

    # Muscle metabolism
    "creatinine": (0.1, 15.0, 0.7, 1.3, "mg/dL"),
    "creatine_kinase": (10.0, 50000.0, 30.0, 200.0, "U/L"),  # Can be very high after exercise
    "bun": (2.0, 150.0, 7.0, 20.0, "mg/dL"),

    # Hormonal markers
    "testosterone": (10.0, 2000.0, 300.0, 1000.0, "ng/dL"),  # Male reference
    "cortisol": (0.5, 60.0, 6.0, 18.0, "mcg/dL"),  # AM values
    "igf1": (20.0, 800.0, 100.0, 300.0, "ng/mL"),
    "tsh": (0.01, 100.0, 0.4, 4.0, "mIU/L"),

    # Metabolic markers
    "glucose_fasting": (20.0, 700.0, 70.0, 100.0, "mg/dL"),
    "hba1c": (3.0, 18.0, 4.0, 5.7, "%"),
    "insulin_fasting": (0.5, 300.0, 2.0, 25.0, "uIU/mL"),
    "triglycerides": (30.0, 5000.0, 0.0, 150.0, "mg/dL"),
    "cholesterol_total": (80.0, 600.0, 0.0, 200.0, "mg/dL"),
    "hdl": (10.0, 150.0, 40.0, 100.0, "mg/dL"),
    "ldl": (20.0, 400.0, 0.0, 100.0, "mg/dL"),

    # Vitamins/minerals
    "vitamin_d": (4.0, 200.0, 30.0, 100.0, "ng/mL"),
    "vitamin_b12": (50.0, 2000.0, 200.0, 900.0, "pg/mL"),
    "ferritin": (5.0, 2000.0, 30.0, 400.0, "ng/mL"),  # Wide range normal
    "iron": (10.0, 400.0, 60.0, 170.0, "mcg/dL"),

    # Liver function
    "alt": (5.0, 5000.0, 7.0, 56.0, "U/L"),
    "ast": (5.0, 5000.0, 10.0, 40.0, "U/L"),

    # Kidney function
    "egfr": (5.0, 150.0, 60.0, 120.0, "mL/min/1.73m2"),

    # CBC
    "hemoglobin": (5.0, 22.0, 12.0, 17.5, "g/dL"),
    "hematocrit": (15.0, 70.0, 36.0, 52.0, "%"),

    # DEXA T-scores
    "t_score_spine": (-6.0, 4.0, -1.0, 2.0, ""),
    "t_score_hip": (-6.0, 4.0, -1.0, 2.0, ""),
    "t_score_femoral_neck": (-6.0, 4.0, -1.0, 2.0, ""),

    # Body composition
    "lean_mass_kg": (20.0, 100.0, 35.0, 70.0, "kg"),
    "fat_mass_kg": (3.0, 100.0, 10.0, 35.0, "kg"),
    "body_fat_pct": (3.0, 60.0, 10.0, 30.0, "%"),
    "asm_kg": (8.0, 45.0, 15.0, 30.0, "kg"),
    "asmi": (3.0, 15.0, 5.5, 9.0, "kg/m2"),
}


def normalize_units(
    biomarker: str,
    value: float,
    unit: str
) -> ConversionResult:
    """Convert a biomarker value to its standard unit.

    This function normalizes biomarker values to standard units used
    in the Muscle-Meta Matrix assessment system. This enables consistent
    comparison and scoring regardless of the original lab's unit system.

    Args:
        biomarker: The biomarker name (e.g., 'glucose_fasting', 'vitamin_d')
        value: The numeric value to convert
        unit: The current unit of the value

    Returns:
        ConversionResult with original and converted values.

    Example:
        >>> result = normalize_units('glucose_fasting', 5.5, 'mmol/L')
        >>> print(f"{result.converted_value} {result.standard_unit}")
        99.1 mg/dL

        >>> result = normalize_units('vitamin_d', 75, 'nmol/L')
        >>> print(f"{result.converted_value} {result.standard_unit}")
        30.0 ng/mL

    Note:
        If the biomarker or unit is not recognized, the original value
        is returned unchanged with lower confidence.
    """
    # Normalize unit string for comparison
    unit_normalized = unit.lower().strip()

    # Check if we have conversion info for this biomarker
    if biomarker not in UNIT_CONVERSIONS:
        # Unknown biomarker - return as-is
        return ConversionResult(
            original_value=value,
            original_unit=unit,
            converted_value=value,
            standard_unit=unit,
            conversion_factor=1.0,
            confidence=0.5,  # Lower confidence for unknown biomarkers
        )

    conversions = UNIT_CONVERSIONS[biomarker]

    # Find matching unit conversion
    for from_unit, (to_unit, factor) in conversions.items():
        if from_unit.lower() == unit_normalized:
            converted = round(value * factor, 2)
            return ConversionResult(
                original_value=value,
                original_unit=unit,
                converted_value=converted,
                standard_unit=to_unit,
                conversion_factor=factor,
                confidence=0.95,
            )

    # Unit not found in conversions - check if it's already standard
    standard_unit = list(conversions.values())[0][0]  # Get the standard unit
    if unit_normalized == standard_unit.lower():
        return ConversionResult(
            original_value=value,
            original_unit=unit,
            converted_value=value,
            standard_unit=standard_unit,
            conversion_factor=1.0,
            confidence=0.95,
        )

    # Unknown unit for this biomarker
    return ConversionResult(
        original_value=value,
        original_unit=unit,
        converted_value=value,
        standard_unit=unit,
        conversion_factor=1.0,
        confidence=0.3,  # Low confidence - unit not recognized
    )


def validate_ranges(
    biomarker: str,
    value: float,
    unit: Optional[str] = None
) -> ValidationResult:
    """Validate that a biomarker value falls within physiological ranges.

    This function checks if a value is:
    1. Within the physiologically plausible range (not a data entry error)
    2. Within the normal reference range (clinically significant)

    Args:
        biomarker: The biomarker name
        value: The numeric value to validate
        unit: Optional unit (for reference in warnings)

    Returns:
        ValidationResult indicating validity and any warnings.

    Example:
        >>> result = validate_ranges('glucose_fasting', 95)
        >>> print(result.range_category)
        'within_normal'

        >>> result = validate_ranges('glucose_fasting', 250)
        >>> print(result.range_category)
        'outside_normal'
        >>> print(result.warning)
        'Value 250 mg/dL is above normal range (70-100 mg/dL)'

        >>> result = validate_ranges('glucose_fasting', 5000)
        >>> print(result.is_plausible)
        False

    Note:
        Values outside physiological range are likely data entry or
        extraction errors and should be verified by the user.
    """
    # Default result for unknown biomarkers
    if biomarker not in REFERENCE_RANGES:
        return ValidationResult(
            value=value,
            unit=unit or "unknown",
            is_valid=True,  # Can't validate unknown
            is_plausible=True,
            range_category="unknown",
            warning="Reference range not available for this biomarker",
        )

    min_phys, max_phys, min_norm, max_norm, std_unit = REFERENCE_RANGES[biomarker]
    display_unit = unit or std_unit

    # Check physiological plausibility
    if value < min_phys or value > max_phys:
        return ValidationResult(
            value=value,
            unit=display_unit,
            is_valid=False,
            is_plausible=False,
            range_category="implausible",
            warning=(
                f"Value {value} {display_unit} is outside physiologically plausible range "
                f"({min_phys}-{max_phys} {std_unit}). Please verify against original report."
            ),
        )

    # Check normal range
    if value < min_norm:
        return ValidationResult(
            value=value,
            unit=display_unit,
            is_valid=True,
            is_plausible=True,
            range_category="below_normal",
            warning=f"Value {value} {display_unit} is below normal range ({min_norm}-{max_norm} {std_unit})",
        )
    elif value > max_norm:
        return ValidationResult(
            value=value,
            unit=display_unit,
            is_valid=True,
            is_plausible=True,
            range_category="above_normal",
            warning=f"Value {value} {display_unit} is above normal range ({min_norm}-{max_norm} {std_unit})",
        )
    else:
        return ValidationResult(
            value=value,
            unit=display_unit,
            is_valid=True,
            is_plausible=True,
            range_category="within_normal",
            warning=None,
        )


def normalize_and_validate(
    biomarker: str,
    value: float,
    unit: str
) -> Tuple[ConversionResult, ValidationResult]:
    """Convenience function to normalize units and validate in one call.

    Args:
        biomarker: The biomarker name
        value: The numeric value
        unit: The current unit of measurement

    Returns:
        Tuple of (ConversionResult, ValidationResult)

    Example:
        >>> conv, valid = normalize_and_validate('glucose_fasting', 5.5, 'mmol/L')
        >>> print(f"Normalized: {conv.converted_value} {conv.standard_unit}")
        >>> print(f"Status: {valid.range_category}")
    """
    conversion = normalize_units(biomarker, value, unit)
    validation = validate_ranges(biomarker, conversion.converted_value, conversion.standard_unit)
    return conversion, validation


def get_reference_range(biomarker: str) -> Optional[Dict[str, any]]:
    """Get the reference range for a biomarker.

    Args:
        biomarker: The biomarker name

    Returns:
        Dictionary with min_normal, max_normal, unit, and description,
        or None if biomarker is not recognized.

    Example:
        >>> ref = get_reference_range('glucose_fasting')
        >>> print(f"Normal: {ref['min_normal']}-{ref['max_normal']} {ref['unit']}")
        Normal: 70-100 mg/dL
    """
    if biomarker not in REFERENCE_RANGES:
        return None

    min_phys, max_phys, min_norm, max_norm, unit = REFERENCE_RANGES[biomarker]

    return {
        "biomarker": biomarker,
        "min_normal": min_norm,
        "max_normal": max_norm,
        "min_physiological": min_phys,
        "max_physiological": max_phys,
        "unit": unit,
    }


def batch_normalize(
    biomarkers: Dict[str, Dict[str, any]]
) -> Dict[str, Dict[str, any]]:
    """Normalize a batch of biomarker values.

    Args:
        biomarkers: Dictionary mapping biomarker names to dicts with
                   'value' and 'unit' keys.

    Returns:
        Dictionary with normalized values and validation results.

    Example:
        >>> data = {
        ...     'glucose_fasting': {'value': 5.5, 'unit': 'mmol/L'},
        ...     'vitamin_d': {'value': 75, 'unit': 'nmol/L'},
        ... }
        >>> results = batch_normalize(data)
        >>> for name, result in results.items():
        ...     print(f"{name}: {result['normalized_value']} {result['standard_unit']}")
    """
    results = {}

    for biomarker, data in biomarkers.items():
        value = data.get("value")
        unit = data.get("unit", "")

        if value is None:
            results[biomarker] = {
                "original_value": None,
                "normalized_value": None,
                "error": "No value provided",
            }
            continue

        try:
            conv, valid = normalize_and_validate(biomarker, float(value), unit)

            results[biomarker] = {
                "original_value": conv.original_value,
                "original_unit": conv.original_unit,
                "normalized_value": conv.converted_value,
                "standard_unit": conv.standard_unit,
                "conversion_confidence": conv.confidence,
                "range_category": valid.range_category,
                "is_plausible": valid.is_plausible,
                "warning": valid.warning,
            }
        except (ValueError, TypeError) as e:
            results[biomarker] = {
                "original_value": value,
                "normalized_value": None,
                "error": str(e),
            }

    return results
