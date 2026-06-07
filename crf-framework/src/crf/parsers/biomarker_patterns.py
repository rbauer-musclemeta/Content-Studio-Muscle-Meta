"""Regex patterns for extracting biomarker values from lab report text.

This module defines comprehensive regex patterns for identifying and extracting
biomarker values from parsed PDF text. Patterns are designed to match common
variations in lab report formatting across major laboratory providers.

DISCLAIMER:
    Pattern matching is imperfect. Extracted values are for convenience only
    and MUST be verified by users against their original lab reports. This
    is NOT a medical device.

Pattern Design Principles:
    1. Case-insensitive matching (applied at runtime)
    2. Multiple patterns per biomarker to handle format variations
    3. Capture groups for value and optionally unit
    4. Patterns ordered from most specific to most general
"""

import re
from typing import Dict, List, Tuple

# Type alias for pattern definitions
# Each biomarker maps to a list of (pattern, expected_unit) tuples
PatternDict = Dict[str, List[Tuple[str, str]]]


# =============================================================================
# BLOOD LAB BIOMARKER PATTERNS
# =============================================================================

BIOMARKER_PATTERNS: PatternDict = {
    # -------------------------------------------------------------------------
    # NUTRITIONAL MARKERS
    # -------------------------------------------------------------------------
    "albumin": [
        # Most specific patterns first
        (r"albumin[,\s]*serum[:\s]+(\d+\.?\d*)\s*g/dL", "g/dL"),
        (r"albumin[:\s]+(\d+\.?\d*)\s*g/dL", "g/dL"),
        (r"albumin[:\s]+(\d+\.?\d*)\s*g/L", "g/L"),
        (r"albumin[:\s]+(\d+\.?\d*)", "g/dL"),  # Assume g/dL if no unit
        (r"(?:serum\s+)?albumin\s+(\d+\.?\d*)", "g/dL"),
    ],

    "prealbumin": [
        (r"prealbumin[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"transthyretin[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"pre-?albumin[:\s]+(\d+\.?\d*)", "mg/dL"),
    ],

    "total_protein": [
        (r"total\s+protein[:\s]+(\d+\.?\d*)\s*g/dL", "g/dL"),
        (r"protein[,\s]*total[:\s]+(\d+\.?\d*)\s*g/dL", "g/dL"),
        (r"total\s+protein[:\s]+(\d+\.?\d*)", "g/dL"),
    ],

    # -------------------------------------------------------------------------
    # INFLAMMATORY MARKERS
    # -------------------------------------------------------------------------
    "crp": [
        # High-sensitivity CRP
        (r"hs-?crp[:\s]+(\d+\.?\d*)\s*mg/L", "mg/L"),
        (r"high[\s-]*sensitivity\s+c[\s-]*reactive\s+protein[:\s]+(\d+\.?\d*)", "mg/L"),
        # Standard CRP
        (r"c[\s-]*reactive\s+protein[:\s]+(\d+\.?\d*)\s*mg/L", "mg/L"),
        (r"c[\s-]*reactive\s+protein[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"crp[:\s]+(\d+\.?\d*)\s*mg/L", "mg/L"),
        (r"crp[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"crp[:\s]+(\d+\.?\d*)", "mg/L"),
    ],

    "il6": [
        (r"interleukin[\s-]*6[:\s]+(\d+\.?\d*)\s*pg/mL", "pg/mL"),
        (r"il[\s-]*6[:\s]+(\d+\.?\d*)\s*pg/mL", "pg/mL"),
        (r"il[\s-]*6[:\s]+(\d+\.?\d*)", "pg/mL"),
    ],

    "tnf_alpha": [
        (r"tnf[\s-]*(?:alpha|a)[:\s]+(\d+\.?\d*)\s*pg/mL", "pg/mL"),
        (r"tumor\s+necrosis\s+factor[\s-]*(?:alpha|a)?[:\s]+(\d+\.?\d*)", "pg/mL"),
    ],

    # -------------------------------------------------------------------------
    # MUSCLE METABOLISM MARKERS
    # -------------------------------------------------------------------------
    "creatinine": [
        (r"creatinine[,\s]*serum[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"creatinine[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"creatinine[:\s]+(\d+\.?\d*)\s*umol/L", "umol/L"),
        (r"creatinine[:\s]+(\d+\.?\d*)", "mg/dL"),
    ],

    "creatine_kinase": [
        (r"creatine\s+kinase[:\s]+(\d+\.?\d*)\s*U/L", "U/L"),
        (r"ck[,\s]*total[:\s]+(\d+\.?\d*)\s*U/L", "U/L"),
        (r"ck[:\s]+(\d+\.?\d*)\s*U/L", "U/L"),
        (r"cpk[:\s]+(\d+\.?\d*)\s*U/L", "U/L"),
        (r"creatine\s+kinase[:\s]+(\d+\.?\d*)", "U/L"),
    ],

    "bun": [
        (r"blood\s+urea\s+nitrogen[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"bun[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"urea\s+nitrogen[:\s]+(\d+\.?\d*)", "mg/dL"),
        (r"bun[:\s]+(\d+\.?\d*)", "mg/dL"),
    ],

    # -------------------------------------------------------------------------
    # HORMONAL MARKERS
    # -------------------------------------------------------------------------
    "testosterone": [
        # Total testosterone (most common)
        (r"testosterone[,\s]*total[:\s]+(\d+\.?\d*)\s*ng/dL", "ng/dL"),
        (r"total\s+testosterone[:\s]+(\d+\.?\d*)\s*ng/dL", "ng/dL"),
        (r"testosterone[:\s]+(\d+\.?\d*)\s*ng/dL", "ng/dL"),
        (r"testosterone[:\s]+(\d+\.?\d*)\s*nmol/L", "nmol/L"),
        (r"testosterone[,\s]*total[:\s]+(\d+\.?\d*)", "ng/dL"),
    ],

    "testosterone_free": [
        (r"testosterone[,\s]*free[:\s]+(\d+\.?\d*)\s*pg/mL", "pg/mL"),
        (r"free\s+testosterone[:\s]+(\d+\.?\d*)\s*pg/mL", "pg/mL"),
        (r"testosterone[,\s]*free[:\s]+(\d+\.?\d*)\s*ng/dL", "ng/dL"),
    ],

    "cortisol": [
        (r"cortisol[,\s]*(?:am|morning)[:\s]+(\d+\.?\d*)\s*(?:mcg|ug)/dL", "mcg/dL"),
        (r"cortisol[:\s]+(\d+\.?\d*)\s*(?:mcg|ug)/dL", "mcg/dL"),
        (r"cortisol[:\s]+(\d+\.?\d*)\s*nmol/L", "nmol/L"),
        (r"cortisol[:\s]+(\d+\.?\d*)", "mcg/dL"),
    ],

    "igf1": [
        (r"igf[\s-]*1[:\s]+(\d+\.?\d*)\s*ng/mL", "ng/mL"),
        (r"insulin[\s-]*like\s+growth\s+factor[\s-]*1?[:\s]+(\d+\.?\d*)", "ng/mL"),
        (r"somatomedin[\s-]*c[:\s]+(\d+\.?\d*)", "ng/mL"),
    ],

    "tsh": [
        (r"tsh[:\s]+(\d+\.?\d*)\s*(?:mIU|uIU)/(?:L|mL)", "mIU/L"),
        (r"thyroid\s+stimulating\s+hormone[:\s]+(\d+\.?\d*)", "mIU/L"),
        (r"tsh[:\s]+(\d+\.?\d*)", "mIU/L"),
    ],

    "dhea_s": [
        (r"dhea[\s-]*s(?:ulfate)?[:\s]+(\d+\.?\d*)\s*(?:mcg|ug)/dL", "mcg/dL"),
        (r"dhea[\s-]*sulfate[:\s]+(\d+\.?\d*)", "mcg/dL"),
    ],

    # -------------------------------------------------------------------------
    # METABOLIC MARKERS
    # -------------------------------------------------------------------------
    "glucose_fasting": [
        (r"glucose[,\s]*fasting[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"fasting\s+glucose[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"glucose[,\s]*serum[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"glucose[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"blood\s+glucose[:\s]+(\d+\.?\d*)", "mg/dL"),
    ],

    "hba1c": [
        (r"hba1c[:\s]+(\d+\.?\d*)\s*%", "%"),
        (r"hemoglobin\s+a1c[:\s]+(\d+\.?\d*)\s*%", "%"),
        (r"glycated\s+hemoglobin[:\s]+(\d+\.?\d*)", "%"),
        (r"hgba1c[:\s]+(\d+\.?\d*)", "%"),
        (r"a1c[:\s]+(\d+\.?\d*)\s*%", "%"),
        (r"a1c[:\s]+(\d+\.?\d*)", "%"),
    ],

    "insulin_fasting": [
        (r"insulin[,\s]*fasting[:\s]+(\d+\.?\d*)\s*(?:uIU|mU)/mL", "uIU/mL"),
        (r"fasting\s+insulin[:\s]+(\d+\.?\d*)", "uIU/mL"),
        (r"insulin[:\s]+(\d+\.?\d*)\s*(?:uIU|mU)/mL", "uIU/mL"),
        (r"insulin[:\s]+(\d+\.?\d*)", "uIU/mL"),
    ],

    "triglycerides": [
        (r"triglycerides[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"triglyceride[:\s]+(\d+\.?\d*)", "mg/dL"),
    ],

    "cholesterol_total": [
        (r"cholesterol[,\s]*total[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"total\s+cholesterol[:\s]+(\d+\.?\d*)", "mg/dL"),
    ],

    "hdl": [
        (r"hdl[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"hdl[\s-]*cholesterol[:\s]+(\d+\.?\d*)", "mg/dL"),
    ],

    "ldl": [
        (r"ldl[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"ldl[\s-]*cholesterol[:\s]+(\d+\.?\d*)", "mg/dL"),
        (r"ldl[\s-]*(?:calculated|calc)[:\s]+(\d+\.?\d*)", "mg/dL"),
    ],

    # -------------------------------------------------------------------------
    # VITAMIN/MINERAL MARKERS
    # -------------------------------------------------------------------------
    "vitamin_d": [
        (r"vitamin\s+d[,\s]*25[\s-]*(?:oh|hydroxy)[:\s]+(\d+\.?\d*)\s*ng/mL", "ng/mL"),
        (r"25[\s-]*(?:oh|hydroxy)[\s-]*vitamin\s+d[:\s]+(\d+\.?\d*)", "ng/mL"),
        (r"25[\s-]*hydroxyvitamin\s+d[:\s]+(\d+\.?\d*)", "ng/mL"),
        (r"vitamin\s+d[,\s]*25[\s-]*oh[:\s]+(\d+\.?\d*)", "ng/mL"),
        (r"vit\s+d[,\s]*25[\s-]*oh[:\s]+(\d+\.?\d*)", "ng/mL"),
        (r"vitamin\s+d[:\s]+(\d+\.?\d*)\s*ng/mL", "ng/mL"),
        (r"vitamin\s+d[:\s]+(\d+\.?\d*)\s*nmol/L", "nmol/L"),
    ],

    "vitamin_b12": [
        (r"vitamin\s+b[\s-]*12[:\s]+(\d+\.?\d*)\s*pg/mL", "pg/mL"),
        (r"b[\s-]*12[:\s]+(\d+\.?\d*)\s*pg/mL", "pg/mL"),
        (r"cobalamin[:\s]+(\d+\.?\d*)", "pg/mL"),
        (r"vitamin\s+b12[:\s]+(\d+\.?\d*)", "pg/mL"),
    ],

    "folate": [
        (r"folate[:\s]+(\d+\.?\d*)\s*ng/mL", "ng/mL"),
        (r"folic\s+acid[:\s]+(\d+\.?\d*)", "ng/mL"),
    ],

    "ferritin": [
        (r"ferritin[:\s]+(\d+\.?\d*)\s*ng/mL", "ng/mL"),
        (r"ferritin[:\s]+(\d+\.?\d*)\s*(?:mcg|ug)/L", "ng/mL"),
        (r"ferritin[:\s]+(\d+\.?\d*)", "ng/mL"),
    ],

    "iron": [
        (r"iron[,\s]*serum[:\s]+(\d+\.?\d*)\s*(?:mcg|ug)/dL", "mcg/dL"),
        (r"iron[:\s]+(\d+\.?\d*)\s*(?:mcg|ug)/dL", "mcg/dL"),
        (r"iron[:\s]+(\d+\.?\d*)", "mcg/dL"),
    ],

    "magnesium": [
        (r"magnesium[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
        (r"magnesium[:\s]+(\d+\.?\d*)\s*mEq/L", "mEq/L"),
        (r"mg[:\s]+(\d+\.?\d*)\s*mg/dL", "mg/dL"),
    ],

    "zinc": [
        (r"zinc[:\s]+(\d+\.?\d*)\s*(?:mcg|ug)/dL", "mcg/dL"),
        (r"zinc[:\s]+(\d+\.?\d*)", "mcg/dL"),
    ],

    # -------------------------------------------------------------------------
    # LIVER FUNCTION
    # -------------------------------------------------------------------------
    "alt": [
        (r"alt[:\s]+(\d+\.?\d*)\s*U/L", "U/L"),
        (r"alanine\s+aminotransferase[:\s]+(\d+\.?\d*)", "U/L"),
        (r"sgpt[:\s]+(\d+\.?\d*)", "U/L"),
    ],

    "ast": [
        (r"ast[:\s]+(\d+\.?\d*)\s*U/L", "U/L"),
        (r"aspartate\s+aminotransferase[:\s]+(\d+\.?\d*)", "U/L"),
        (r"sgot[:\s]+(\d+\.?\d*)", "U/L"),
    ],

    "ggt": [
        (r"ggt[:\s]+(\d+\.?\d*)\s*U/L", "U/L"),
        (r"gamma[\s-]*gt[:\s]+(\d+\.?\d*)", "U/L"),
        (r"gamma[\s-]*glutamyl[\s-]*transferase[:\s]+(\d+\.?\d*)", "U/L"),
    ],

    # -------------------------------------------------------------------------
    # KIDNEY FUNCTION
    # -------------------------------------------------------------------------
    "egfr": [
        (r"egfr[:\s]+(\d+\.?\d*)\s*mL/min", "mL/min/1.73m2"),
        (r"glomerular\s+filtration\s+rate[:\s]+(\d+\.?\d*)", "mL/min/1.73m2"),
        (r"gfr[:\s]+(\d+\.?\d*)", "mL/min/1.73m2"),
    ],

    # -------------------------------------------------------------------------
    # COMPLETE BLOOD COUNT (CBC)
    # -------------------------------------------------------------------------
    "hemoglobin": [
        (r"hemoglobin[:\s]+(\d+\.?\d*)\s*g/dL", "g/dL"),
        (r"hgb[:\s]+(\d+\.?\d*)\s*g/dL", "g/dL"),
        (r"hb[:\s]+(\d+\.?\d*)", "g/dL"),
    ],

    "hematocrit": [
        (r"hematocrit[:\s]+(\d+\.?\d*)\s*%", "%"),
        (r"hct[:\s]+(\d+\.?\d*)", "%"),
    ],

    "wbc": [
        (r"wbc[:\s]+(\d+\.?\d*)\s*(?:K|k|x10\^?3)/(?:uL|mcL)", "K/uL"),
        (r"white\s+blood\s+cell[s]?[:\s]+(\d+\.?\d*)", "K/uL"),
        (r"leukocytes[:\s]+(\d+\.?\d*)", "K/uL"),
    ],

    "platelets": [
        (r"platelets?[:\s]+(\d+\.?\d*)\s*(?:K|k|x10\^?3)/(?:uL|mcL)", "K/uL"),
        (r"plt[:\s]+(\d+\.?\d*)", "K/uL"),
    ],
}


# =============================================================================
# DEXA SCAN PATTERNS
# =============================================================================

DEXA_PATTERNS: PatternDict = {
    # -------------------------------------------------------------------------
    # T-SCORES (Bone Mineral Density)
    # -------------------------------------------------------------------------
    "t_score_spine": [
        (r"(?:lumbar\s+)?spine\s+t[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
        (r"l1[\s-]*l4\s+t[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
        (r"spine[:\s]+.*?t[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
        (r"lumbar\s+(?:spine\s+)?bmd.*?t[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
    ],

    "t_score_hip": [
        (r"(?:total\s+)?hip\s+t[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
        (r"hip[:\s]+.*?t[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
        (r"total\s+hip\s+bmd.*?t[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
    ],

    "t_score_femoral_neck": [
        (r"femoral\s+neck\s+t[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
        (r"fem(?:oral)?\s+neck[:\s]+.*?t[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
        (r"neck\s+t[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
    ],

    "t_score_forearm": [
        (r"(?:distal\s+)?(?:1/3\s+)?(?:radius|forearm)\s+t[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
        (r"forearm[:\s]+.*?t[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
    ],

    # -------------------------------------------------------------------------
    # Z-SCORES (Age-matched comparison)
    # -------------------------------------------------------------------------
    "z_score_spine": [
        (r"(?:lumbar\s+)?spine\s+z[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
        (r"l1[\s-]*l4\s+z[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
    ],

    "z_score_hip": [
        (r"(?:total\s+)?hip\s+z[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
    ],

    "z_score_femoral_neck": [
        (r"femoral\s+neck\s+z[\s-]*score[:\s]+(-?\d+\.?\d*)", ""),
    ],

    # -------------------------------------------------------------------------
    # BODY COMPOSITION
    # -------------------------------------------------------------------------
    "lean_mass_total": [
        (r"(?:total\s+)?lean\s+(?:body\s+)?mass[:\s]+(\d+\.?\d*)\s*(?:kg|lbs?)", "kg"),
        (r"lbm[:\s]+(\d+\.?\d*)\s*(?:kg|lbs?)", "kg"),
        (r"lean\s+tissue[:\s]+(\d+\.?\d*)", "kg"),
    ],

    "fat_mass_total": [
        (r"(?:total\s+)?fat\s+mass[:\s]+(\d+\.?\d*)\s*(?:kg|lbs?)", "kg"),
        (r"body\s+fat[:\s]+(\d+\.?\d*)\s*(?:kg|lbs?)", "kg"),
    ],

    "body_fat_percentage": [
        (r"(?:total\s+)?body\s+fat[:\s]+(\d+\.?\d*)\s*%", "%"),
        (r"fat\s+(?:mass\s+)?percent(?:age)?[:\s]+(\d+\.?\d*)", "%"),
        (r"%\s*fat[:\s]+(\d+\.?\d*)", "%"),
    ],

    "asm": [
        # Appendicular Skeletal Muscle Mass
        (r"appendicular\s+(?:skeletal\s+)?muscle\s+mass[:\s]+(\d+\.?\d*)\s*(?:kg|lbs?)", "kg"),
        (r"asm[:\s]+(\d+\.?\d*)\s*(?:kg|lbs?)", "kg"),
        (r"alm[:\s]+(\d+\.?\d*)\s*(?:kg|lbs?)", "kg"),  # Appendicular Lean Mass
        (r"asmm[:\s]+(\d+\.?\d*)", "kg"),
    ],

    "asmi": [
        # ASM Index (ASM/height^2)
        (r"asm(?:i|m)?[\s/]+(?:height|ht)?\s*(?:\^?2|squared)?[:\s]+(\d+\.?\d*)\s*kg/m", "kg/m2"),
        (r"appendicular.*?index[:\s]+(\d+\.?\d*)", "kg/m2"),
        (r"asmi[:\s]+(\d+\.?\d*)", "kg/m2"),
    ],

    "android_fat": [
        (r"android\s+(?:region\s+)?fat[:\s]+(\d+\.?\d*)\s*%", "%"),
        (r"android[:\s]+(\d+\.?\d*)\s*%", "%"),
    ],

    "gynoid_fat": [
        (r"gynoid\s+(?:region\s+)?fat[:\s]+(\d+\.?\d*)\s*%", "%"),
        (r"gynoid[:\s]+(\d+\.?\d*)\s*%", "%"),
    ],

    "android_gynoid_ratio": [
        (r"a(?:ndroid)?[\s/]+g(?:ynoid)?\s+ratio[:\s]+(\d+\.?\d*)", ""),
        (r"android[\s/]+gynoid[:\s]+(\d+\.?\d*)", ""),
    ],

    "vat": [
        # Visceral Adipose Tissue
        (r"visceral\s+(?:adipose\s+)?(?:tissue|fat)[:\s]+(\d+\.?\d*)\s*(?:g|cm\^?3|cm3)", "g"),
        (r"vat[:\s]+(\d+\.?\d*)\s*(?:g|cm)", "g"),
    ],
}


def compile_patterns(patterns_dict: PatternDict) -> Dict[str, List[Tuple[re.Pattern, str]]]:
    """Compile all regex patterns for faster matching.

    Args:
        patterns_dict: Dictionary of biomarker patterns.

    Returns:
        Dictionary with compiled regex patterns.
    """
    compiled = {}
    for biomarker, patterns in patterns_dict.items():
        compiled[biomarker] = [
            (re.compile(pattern, re.IGNORECASE), unit)
            for pattern, unit in patterns
        ]
    return compiled


# Pre-compiled patterns for performance
COMPILED_BIOMARKER_PATTERNS = compile_patterns(BIOMARKER_PATTERNS)
COMPILED_DEXA_PATTERNS = compile_patterns(DEXA_PATTERNS)
