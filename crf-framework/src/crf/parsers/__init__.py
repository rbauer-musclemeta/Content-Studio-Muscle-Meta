"""Lab report and DEXA scan PDF parsing module.

This module provides utilities for extracting biomarker values from uploaded
PDF documents such as blood lab reports and DEXA scans. The extracted values
are intended for convenience and educational purposes only.

IMPORTANT DISCLAIMER:
    This parser is a convenience tool for pre-populating assessment forms.
    Users MUST verify all extracted values against their original lab reports.
    This is NOT a medical device and should not be used for clinical decisions.

Main Functions:
    parse_lab_report: Extract biomarkers from a blood lab PDF
    parse_dexa_scan: Extract T-scores and body composition from DEXA PDFs
    normalize_units: Convert biomarker units to standard formats
    validate_ranges: Check if values fall within physiological ranges

Example Usage:
    >>> from crf.parsers import parse_lab_report
    >>> result = parse_lab_report("/path/to/lab_report.pdf")
    >>> print(result['biomarkers'])
    {'albumin': {'value': 4.2, 'unit': 'g/dL', 'confidence': 0.95}, ...}
"""

from crf.parsers.lab_parser import parse_lab_report
from crf.parsers.dexa_parser import parse_dexa_scan, extract_t_scores, extract_body_composition
from crf.parsers.normalizer import normalize_units, validate_ranges
from crf.parsers.pdf_extractor import extract_text_from_pdf
from crf.parsers.biomarker_patterns import BIOMARKER_PATTERNS, DEXA_PATTERNS

__all__ = [
    # Main parsing functions
    "parse_lab_report",
    "parse_dexa_scan",
    # DEXA-specific extractors
    "extract_t_scores",
    "extract_body_composition",
    # Unit normalization and validation
    "normalize_units",
    "validate_ranges",
    # Low-level utilities
    "extract_text_from_pdf",
    # Pattern definitions
    "BIOMARKER_PATTERNS",
    "DEXA_PATTERNS",
]
