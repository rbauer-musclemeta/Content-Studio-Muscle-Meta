#!/usr/bin/env python3
"""
Basic example of using the Catabolic Risk Assessment Framework.

This script demonstrates how to:
1. Create a patient profile
2. Add optional lifestyle and health data
3. Include biomarker results
4. Calculate catabolic risk score
5. Generate personalized recommendations
"""

from datetime import date

from crf import (
    Patient,
    PatientProfile,
    Biomarkers,
    CatabolicRiskCalculator,
    RecommendationEngine,
)
from crf.models.patient import Sex, ActivityLevel
from crf.utils.helpers import format_risk_report


def main():
    """Run a basic catabolic risk assessment example."""

    # Step 1: Create patient profile
    print("Creating patient profile...")

    profile = PatientProfile(
        patient_id="EXAMPLE_001",
        date_of_birth=date(1958, 7, 22),  # 65+ years old
        sex=Sex.MALE,
        height_cm=175,
        weight_kg=72,
        assessment_date=date.today(),
    )

    print(f"  Patient ID: {profile.patient_id}")
    print(f"  Age: {profile.age} years")
    print(f"  BMI: {profile.bmi}")
    print()

    # Step 2: Create complete patient with lifestyle data
    patient = Patient(
        profile=profile,
        activity_level=ActivityLevel.LIGHT,
        protein_intake_g_per_kg=0.7,  # Below recommended
        caloric_intake_kcal=1800,
        sleep_hours=6.0,
        stress_level=5,
        chronic_conditions=["Type 2 Diabetes"],
        medications=["Metformin 500mg"],
        recent_weight_loss_kg=3.5,  # Unintentional weight loss
    )

    print("Patient lifestyle data:")
    print(f"  Activity Level: {patient.activity_level.value}")
    print(f"  Protein Intake: {patient.protein_intake_g_per_kg} g/kg/day")
    print(f"  Recommended Protein: {patient.recommended_protein_g} g/day")
    print(f"  Caloric Intake: {patient.caloric_intake_kcal} kcal/day")
    print(f"  Estimated Needs: {patient.estimated_caloric_needs} kcal/day")
    print(f"  Sleep: {patient.sleep_hours} hours")
    print(f"  Chronic Conditions: {', '.join(patient.chronic_conditions)}")
    print()

    # Step 3: Add biomarker results (optional but improves accuracy)
    biomarkers = Biomarkers()
    biomarkers.albumin.value = 3.3  # Slightly low
    biomarkers.crp.value = 5.5  # Elevated (inflammation)
    biomarkers.vitamin_d.value = 22  # Low
    biomarkers.testosterone.value = 280  # Low-normal
    biomarkers.cortisol.value = 20  # Slightly elevated
    biomarkers.glucose_fasting.value = 118  # Pre-diabetic range
    biomarkers.hba1c.value = 6.2  # Pre-diabetic range

    print("Biomarker results:")
    for bm in biomarkers.get_measured_biomarkers():
        status = bm.evaluate_status()
        print(f"  {bm.name}: {bm.value} {bm.unit} [{status.value}]")

    if biomarkers.homa_ir:
        print(f"  HOMA-IR (calculated): {biomarkers.homa_ir}")
    if biomarkers.testosterone_cortisol_ratio:
        print(f"  T/C Ratio (calculated): {biomarkers.testosterone_cortisol_ratio}")
    print()

    # Step 4: Calculate risk score
    print("Calculating catabolic risk score...")
    calculator = CatabolicRiskCalculator()
    risk_score = calculator.assess_patient(patient, biomarkers=biomarkers)

    print(f"\n  Risk Level: {risk_score.risk_level.value.upper()}")
    print(f"  Risk Score: {risk_score.total_score:.1f} / {risk_score.max_possible_score:.1f}")
    print(f"  Risk Percentage: {risk_score.percentage:.1f}%")
    print(f"  Confidence: {risk_score.confidence * 100:.0f}%")
    print()

    print("Top Risk Factors:")
    for i, factor in enumerate(risk_score.top_risk_factors[:5], 1):
        print(f"  {i}. {factor}")
    print()

    # Step 5: Generate recommendations
    print("Generating intervention plan...")
    recommendation_engine = RecommendationEngine()
    plan = recommendation_engine.generate_plan(patient, risk_score)

    print(f"\n  Follow-up recommended in: {plan.follow_up_interval_days} days")
    print(f"  Number of recommendations: {len(plan.recommendations)}")
    print()

    # Print top recommendations by priority
    print("Key Recommendations:")
    for rec in plan.recommendations[:5]:
        print(f"\n  [{rec.priority.value.upper()}] {rec.title}")
        print(f"    Category: {rec.category.value}")
        print(f"    {rec.description[:100]}...")
    print()

    # Step 6: Generate full formatted report
    print("\n" + "=" * 60)
    print("FULL ASSESSMENT REPORT")
    print("=" * 60 + "\n")

    report = format_risk_report(risk_score, plan)
    print(report)

    # Quick screening example
    print("\n" + "=" * 60)
    print("QUICK SCREENING EXAMPLE")
    print("=" * 60 + "\n")

    quick_result = calculator.quick_screen(patient)
    print(f"Risk Level: {quick_result['risk_level']}")
    print(f"Risk Percentage: {quick_result['risk_percentage']}%")
    print(f"Top Concerns: {', '.join(quick_result['top_concerns'])}")
    print(f"Recommendation: {quick_result['recommendation']}")


if __name__ == "__main__":
    main()
