"""Main lab report parsing interface.

This module provides the primary interface for extracting biomarker values
from PDF lab reports. It orchestrates PDF text extraction, pattern matching,
unit normalization, and range validation.

IMPORTANT DISCLAIMER:
    This parser is a CONVENIENCE TOOL for pre-populating assessment forms.
    It is NOT a medical device and should NOT be used for clinical decisions.
    Users MUST verify ALL extracted values against their original lab reports
    before relying on them for any purpose.

Supported Lab Report Types:
    - Standard blood chemistry panels (CMP, BMP)
    - Lipid panels
    - Thyroid panels
    - Hormone panels (testosterone, cortisol, IGF-1)
    - Vitamin/mineral panels (D, B12, ferritin, iron)
    - CBC (Complete Blood Count)
    - Inflammatory markers (CRP, IL-6)

Extraction Accuracy:
    - Pattern matching typically achieves 80-95% accuracy on well-formatted reports
    - Scanned PDFs without text layers will have very low or zero extraction
    - Handwritten values cannot be extracted
    - Always verify extracted values against the original document
"""

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from crf.parsers.pdf_extractor import extract_text_from_pdf, get_pdf_metadata
from crf.parsers.biomarker_patterns import COMPILED_BIOMARKER_PATTERNS
from crf.parsers.normalizer import normalize_and_validate, get_reference_range

logger = logging.getLogger(__name__)


@dataclass
class ExtractedBiomarker:
    """A single extracted biomarker value with metadata.

    Attributes:
        name: Standardized biomarker name (e.g., 'glucose_fasting')
        value: Extracted numeric value
        unit: Unit of measurement (may be original or standardized)
        original_unit: The unit as it appeared in the document
        normalized_value: Value after unit normalization
        standard_unit: Standard unit for this biomarker
        confidence: Extraction confidence score (0.0-1.0)
        pattern_matched: The regex pattern that matched
        range_category: 'within_normal', 'above_normal', 'below_normal', 'implausible'
        reference_low: Normal range lower bound
        reference_high: Normal range upper bound
        warning: Any warnings about the value
    """
    name: str
    value: float
    unit: str
    original_unit: str = ""
    normalized_value: Optional[float] = None
    standard_unit: Optional[str] = None
    confidence: float = 0.8
    pattern_matched: str = ""
    range_category: str = "unknown"
    reference_low: Optional[float] = None
    reference_high: Optional[float] = None
    warning: Optional[str] = None


@dataclass
class LabReportResult:
    """Complete result from parsing a lab report PDF.

    Attributes:
        biomarkers: Dictionary of extracted biomarkers by name
        confidence: Dictionary of confidence scores per biomarker
        raw_text: The extracted text for manual verification
        warnings: List of parsing warnings or issues
        metadata: PDF metadata (title, date, etc.)
        extraction_stats: Statistics about the extraction
    """
    biomarkers: Dict[str, ExtractedBiomarker] = field(default_factory=dict)
    confidence: Dict[str, float] = field(default_factory=dict)
    raw_text: str = ""
    warnings: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    extraction_stats: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert result to dictionary format.

        Returns:
            Dictionary representation suitable for JSON serialization
            and integration with the CRF assessment framework.
        """
        biomarkers_dict = {}
        for name, bio in self.biomarkers.items():
            biomarkers_dict[name] = {
                "value": bio.normalized_value or bio.value,
                "unit": bio.standard_unit or bio.unit,
                "original_value": bio.value,
                "original_unit": bio.original_unit,
                "confidence": bio.confidence,
                "range_category": bio.range_category,
                "reference_low": bio.reference_low,
                "reference_high": bio.reference_high,
                "warning": bio.warning,
            }

        return {
            "biomarkers": biomarkers_dict,
            "confidence": self.confidence,
            "warnings": self.warnings,
            "raw_text": self.raw_text,
            "metadata": self.metadata,
            "extraction_stats": self.extraction_stats,
            "disclaimer": (
                "EDUCATIONAL SCREENING AID - NOT A MEDICAL DEVICE. "
                "Extracted values are for convenience only and MUST be verified "
                "against the original lab report before use."
            ),
        }

    def get_abnormal_values(self) -> Dict[str, ExtractedBiomarker]:
        """Get biomarkers with values outside normal range.

        Returns:
            Dictionary of biomarkers with abnormal values.
        """
        abnormal = {}
        for name, bio in self.biomarkers.items():
            if bio.range_category in ("above_normal", "below_normal", "implausible"):
                abnormal[name] = bio
        return abnormal

    def get_high_confidence_values(
        self,
        threshold: float = 0.8
    ) -> Dict[str, ExtractedBiomarker]:
        """Get biomarkers extracted with high confidence.

        Args:
            threshold: Minimum confidence score (default 0.8)

        Returns:
            Dictionary of biomarkers meeting confidence threshold.
        """
        return {
            name: bio for name, bio in self.biomarkers.items()
            if bio.confidence >= threshold
        }


def parse_lab_report(file_path: str) -> LabReportResult:
    """Extract biomarkers from a PDF lab report.

    This is the main entry point for lab report parsing. It performs:
    1. PDF text extraction
    2. Pattern matching for known biomarkers
    3. Unit normalization to standard units
    4. Range validation against physiological limits
    5. Confidence scoring for each extraction

    Args:
        file_path: Absolute or relative path to the PDF file.

    Returns:
        LabReportResult containing:
            - biomarkers: Extracted values with metadata
            - confidence: Confidence scores per biomarker
            - raw_text: Original extracted text for verification
            - warnings: List of parsing issues or concerns

    Example:
        >>> result = parse_lab_report("/path/to/blood_work.pdf")
        >>> print(f"Extracted {len(result.biomarkers)} biomarkers")
        >>> for name, bio in result.biomarkers.items():
        ...     print(f"{name}: {bio.value} {bio.unit} ({bio.range_category})")

        >>> # Check for abnormal values
        >>> abnormal = result.get_abnormal_values()
        >>> if abnormal:
        ...     print("\\nAbnormal values found:")
        ...     for name, bio in abnormal.items():
        ...         print(f"  {name}: {bio.warning}")

    Note:
        - Users MUST verify extracted values against original reports
        - Scanned PDFs without text layers will have limited extraction
        - Pattern matching may not recognize all lab report formats
        - This is NOT a medical device - for educational purposes only
    """
    result = LabReportResult()

    # Step 1: Extract text from PDF
    try:
        text = extract_text_from_pdf(file_path)
        result.raw_text = text
    except FileNotFoundError as e:
        result.warnings.append(f"File not found: {str(e)}")
        return result
    except ValueError as e:
        result.warnings.append(f"Invalid file: {str(e)}")
        return result
    except Exception as e:
        result.warnings.append(f"PDF extraction error: {str(e)}")
        return result

    if not text or len(text.strip()) < 50:
        result.warnings.append(
            "Very little text extracted from PDF. This may be a scanned document "
            "without a text layer, or a protected PDF. Manual entry may be required."
        )
        return result

    # Step 2: Extract PDF metadata
    try:
        result.metadata = get_pdf_metadata(file_path)
    except Exception:
        pass  # Metadata is optional

    # Step 3: Extract biomarkers using pattern matching
    extracted_count = 0
    pattern_matches = 0

    for biomarker_name, patterns in COMPILED_BIOMARKER_PATTERNS.items():
        for compiled_pattern, expected_unit in patterns:
            match = compiled_pattern.search(text)
            if match:
                pattern_matches += 1
                try:
                    # Extract the numeric value
                    value_str = match.group(1)
                    value = float(value_str)

                    # Skip if we already have this biomarker (first match wins)
                    if biomarker_name in result.biomarkers:
                        continue

                    # Determine the unit
                    unit = _extract_unit_from_match(match, text, expected_unit)

                    # Normalize and validate
                    conv, valid = normalize_and_validate(biomarker_name, value, unit)

                    # Get reference range
                    ref_range = get_reference_range(biomarker_name)

                    # Calculate confidence based on various factors
                    confidence = _calculate_confidence(
                        pattern_match=True,
                        unit_found=bool(unit and unit != expected_unit),
                        range_valid=valid.is_plausible,
                        conversion_confidence=conv.confidence,
                    )

                    # Create the extracted biomarker
                    extracted = ExtractedBiomarker(
                        name=biomarker_name,
                        value=value,
                        unit=unit,
                        original_unit=unit,
                        normalized_value=conv.converted_value,
                        standard_unit=conv.standard_unit,
                        confidence=confidence,
                        pattern_matched=compiled_pattern.pattern,
                        range_category=valid.range_category,
                        reference_low=ref_range["min_normal"] if ref_range else None,
                        reference_high=ref_range["max_normal"] if ref_range else None,
                        warning=valid.warning,
                    )

                    result.biomarkers[biomarker_name] = extracted
                    result.confidence[biomarker_name] = confidence
                    extracted_count += 1

                    # If value is implausible, add warning
                    if not valid.is_plausible:
                        result.warnings.append(
                            f"{biomarker_name}: {valid.warning}"
                        )

                    break  # Move to next biomarker after successful extraction

                except (ValueError, IndexError) as e:
                    logger.debug(f"Failed to parse {biomarker_name}: {e}")
                    continue

    # Step 4: Compile extraction statistics
    result.extraction_stats = {
        "total_patterns_tested": len(COMPILED_BIOMARKER_PATTERNS),
        "pattern_matches": pattern_matches,
        "biomarkers_extracted": extracted_count,
        "text_length": len(text),
        "pages_detected": text.count("--- PAGE"),
    }

    # Step 5: Add summary warnings
    if extracted_count == 0:
        result.warnings.append(
            "No biomarkers extracted. The PDF format may not be recognized, "
            "or it may be a scanned document without OCR text."
        )
    elif extracted_count < 5:
        result.warnings.append(
            f"Only {extracted_count} biomarkers extracted. Some values may need "
            "manual entry if the lab report uses non-standard formatting."
        )

    # Always add the verification reminder
    result.warnings.append(
        "REMINDER: Please verify all extracted values against your original "
        "lab report. This tool is for convenience only and is not a medical device."
    )

    return result


def _extract_unit_from_match(
    match,
    full_text: str,
    expected_unit: str
) -> str:
    """Extract the unit of measurement from the match context.

    Looks at the text immediately following the numeric value to
    identify the unit. Falls back to the expected unit if none found.

    Args:
        match: The regex match object
        full_text: The full extracted text
        expected_unit: The expected/default unit for this biomarker

    Returns:
        The identified unit string.
    """
    if not expected_unit:
        return ""

    # Check if unit appears in the match or shortly after
    end_pos = match.end()
    context = full_text[end_pos:end_pos + 20]  # Look at next 20 chars

    # Common unit patterns to look for
    unit_patterns = [
        "g/dL", "g/L", "mg/dL", "mg/L", "ng/mL", "ng/dL", "pg/mL",
        "nmol/L", "mmol/L", "umol/L", "uIU/mL", "mIU/L", "U/L",
        "mcg/dL", "ug/dL", "K/uL", "%",
    ]

    context_lower = context.lower()
    for unit in unit_patterns:
        if unit.lower() in context_lower:
            return unit

    return expected_unit


def _calculate_confidence(
    pattern_match: bool,
    unit_found: bool,
    range_valid: bool,
    conversion_confidence: float
) -> float:
    """Calculate overall confidence score for an extraction.

    Confidence is based on:
    - Pattern match quality
    - Unit identification
    - Value within physiological range
    - Unit conversion confidence

    Args:
        pattern_match: Whether pattern matched successfully
        unit_found: Whether unit was explicitly found in text
        range_valid: Whether value is within physiological range
        conversion_confidence: Confidence in unit conversion

    Returns:
        Confidence score between 0.0 and 1.0
    """
    if not pattern_match:
        return 0.0

    confidence = 0.7  # Base confidence for pattern match

    if unit_found:
        confidence += 0.1

    if range_valid:
        confidence += 0.1
    else:
        confidence -= 0.3  # Significant penalty for implausible values

    # Factor in conversion confidence
    confidence = confidence * conversion_confidence

    return min(max(confidence, 0.0), 1.0)


def extract_biomarkers_for_assessment(
    file_path: str,
    required_biomarkers: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Extract biomarkers formatted for CRF assessment integration.

    This function provides output formatted specifically for integration
    with the Muscle-Meta Matrix CRF assessment framework.

    Args:
        file_path: Path to the lab report PDF.
        required_biomarkers: Optional list of required biomarker names.
                           If provided, missing required biomarkers will
                           be flagged in warnings.

    Returns:
        Dictionary formatted for CRF integration:
        {
            'biomarker_values': {...},  # For Biomarkers model
            'missing_required': [...],   # Required but not found
            'warnings': [...],           # Parsing warnings
            'confidence_summary': {...}, # Summary statistics
        }

    Example:
        >>> required = ['albumin', 'crp', 'glucose_fasting', 'hba1c']
        >>> data = extract_biomarkers_for_assessment(
        ...     "/path/to/labs.pdf",
        ...     required_biomarkers=required
        ... )
        >>> if data['missing_required']:
        ...     print(f"Please enter: {data['missing_required']}")
    """
    result = parse_lab_report(file_path)

    # Format for Biomarkers model
    biomarker_values = {}
    for name, bio in result.biomarkers.items():
        biomarker_values[name] = {
            "value": bio.normalized_value or bio.value,
            "unit": bio.standard_unit or bio.unit,
        }

    # Check for missing required biomarkers
    missing = []
    if required_biomarkers:
        for req in required_biomarkers:
            if req not in result.biomarkers:
                missing.append(req)

    # Calculate confidence summary
    confidence_values = list(result.confidence.values())
    confidence_summary = {
        "mean_confidence": sum(confidence_values) / len(confidence_values) if confidence_values else 0,
        "min_confidence": min(confidence_values) if confidence_values else 0,
        "max_confidence": max(confidence_values) if confidence_values else 0,
        "high_confidence_count": len([c for c in confidence_values if c >= 0.8]),
        "low_confidence_count": len([c for c in confidence_values if c < 0.5]),
    }

    return {
        "biomarker_values": biomarker_values,
        "extracted_count": len(result.biomarkers),
        "missing_required": missing,
        "warnings": result.warnings,
        "confidence_summary": confidence_summary,
        "raw_text_preview": result.raw_text[:500] if result.raw_text else "",
        "full_result": result.to_dict(),
    }
