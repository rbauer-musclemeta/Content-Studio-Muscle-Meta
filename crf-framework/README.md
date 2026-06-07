# CRF-muscle-meta

**Catabolic Risk Assessment Framework** - A comprehensive Python framework for evaluating catabolic risk factors related to muscle metabolism, sarcopenia, and muscle loss.

## Overview

This framework provides tools for healthcare professionals, researchers, and fitness practitioners to:

- Assess catabolic risk based on patient demographics, lifestyle, and clinical data
- Evaluate biomarkers relevant to muscle metabolism
- Calculate comprehensive risk scores with category breakdowns
- Generate personalized intervention recommendations
- Track and monitor patients over time

## Features

- **Patient Profiling**: Capture demographic, lifestyle, and health data
- **Risk Factor Assessment**: Evaluate 22+ evidence-based risk factors across 6 categories
- **Biomarker Integration**: Incorporate lab values for enhanced accuracy
- **Intelligent Scoring**: Weighted scoring system with confidence metrics
- **Recommendation Engine**: Personalized intervention plans based on risk profile
- **Validation**: Input validation with plausibility checks

## Installation

```bash
# Clone the repository
git clone https://github.com/rbauer-musclemeta/CRF-muscle-meta.git
cd CRF-muscle-meta

# Install in development mode
pip install -e ".[dev]"

# Or install dependencies directly
pip install -r requirements.txt
```

## Quick Start

```python
from datetime import date
from crf import (
    Patient, PatientProfile, CatabolicRiskCalculator, RecommendationEngine
)
from crf.models.patient import Sex, ActivityLevel

# Create patient profile
profile = PatientProfile(
    patient_id="PATIENT_001",
    date_of_birth=date(1960, 5, 15),
    sex=Sex.MALE,
    height_cm=175,
    weight_kg=72,
)

# Add lifestyle data
patient = Patient(
    profile=profile,
    activity_level=ActivityLevel.SEDENTARY,
    protein_intake_g_per_kg=0.6,
    sleep_hours=5.5,
    chronic_conditions=["Type 2 Diabetes"],
)

# Calculate risk
calculator = CatabolicRiskCalculator()
risk_score = calculator.assess_patient(patient)

print(f"Risk Level: {risk_score.risk_level.value}")
print(f"Risk Percentage: {risk_score.percentage}%")
print(f"Top Factors: {risk_score.top_risk_factors[:3]}")

# Generate recommendations
engine = RecommendationEngine()
plan = engine.generate_plan(patient, risk_score)

for rec in plan.recommendations[:3]:
    print(f"[{rec.priority.value}] {rec.title}")
```

## Risk Categories

The framework evaluates risk factors across six categories:

| Category | Examples |
|----------|----------|
| **Nutritional** | Protein intake, caloric deficit, malnutrition risk |
| **Physical** | Immobility, low activity, reduced grip strength, slow gait |
| **Medical** | Chronic inflammation, disease states, catabolic medications |
| **Lifestyle** | Sleep quality, stress levels, smoking, alcohol use |
| **Age-Related** | Advanced age, sarcopenia history, unintentional weight loss |
| **Hormonal** | Testosterone, thyroid function, insulin resistance |

## Biomarkers Supported

The framework can incorporate the following biomarkers:

- **Nutritional**: Albumin, Prealbumin, Total Protein
- **Inflammatory**: CRP, IL-6, TNF-alpha
- **Muscle Metabolism**: Creatinine, Creatine Kinase, BUN
- **Hormonal**: Testosterone, Cortisol, IGF-1, TSH
- **Metabolic**: Fasting Glucose, HbA1c, Fasting Insulin
- **Vitamins**: Vitamin D, Vitamin B12

## Project Structure

```
CRF-muscle-meta/
├── src/crf/
│   ├── models/
│   │   ├── patient.py       # Patient data models
│   │   ├── risk_factors.py  # Risk factor definitions
│   │   └── biomarkers.py    # Biomarker models
│   ├── assessment/
│   │   ├── calculator.py    # Main risk calculator
│   │   ├── scoring.py       # Scoring engine
│   │   └── recommendations.py # Recommendation engine
│   ├── validators/
│   │   └── input_validator.py # Input validation
│   └── utils/
│       └── helpers.py       # Utility functions
├── tests/
│   ├── test_calculator.py
│   └── test_scoring.py
├── examples/
│   └── basic_assessment.py
├── pyproject.toml
└── requirements.txt
```

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=crf

# Run specific test file
pytest tests/test_calculator.py -v
```

## Risk Levels

| Level | Percentage | Interpretation |
|-------|------------|----------------|
| LOW | 0-19% | Minimal catabolic risk, continue current practices |
| MODERATE | 20-39% | Some risk factors present, targeted interventions recommended |
| HIGH | 40-59% | Significant risk, medical evaluation and intervention needed |
| SEVERE | 60%+ | Critical risk level, urgent comprehensive intervention required |

## Example Output

```
RISK SUMMARY
----------------------------------------
Overall Risk Level: MODERATE
Risk Score: 12.5 / 52.0
Risk Percentage: 24.0%
Assessment Confidence: 85%

TOP RISK FACTORS
----------------------------------------
  1. Inadequate Protein Intake
  2. Low Physical Activity
  3. Advanced Age

RISK BY CATEGORY
----------------------------------------
  Nutritional  [████████░░░░░░░░░░░░] 40.0%
  Physical     [██████░░░░░░░░░░░░░░] 30.0%
  Age_related  [████░░░░░░░░░░░░░░░░] 20.0%
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - see LICENSE file for details.

## Disclaimer

This tool is intended for informational and research purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical decisions.

## References

- Cruz-Jentoft AJ, et al. Sarcopenia: European consensus on definition and diagnosis. Age Ageing. 2010.
- Deutz NE, et al. Protein intake and exercise for optimal muscle function with aging. Clin Nutr. 2014.
- Bauer J, et al. Evidence-based recommendations for optimal dietary protein intake in older people. JAMDA. 2013.
