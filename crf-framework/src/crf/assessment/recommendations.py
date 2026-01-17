"""Recommendation engine for catabolic risk interventions."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from crf.models.patient import Patient, ActivityLevel
from crf.models.risk_factors import RiskCategory
from crf.assessment.scoring import RiskScore, RiskLevel


class RecommendationPriority(str, Enum):
    """Priority level for recommendations."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RecommendationCategory(str, Enum):
    """Category of recommendation."""

    NUTRITION = "nutrition"
    EXERCISE = "exercise"
    MEDICAL = "medical"
    LIFESTYLE = "lifestyle"
    MONITORING = "monitoring"


class Recommendation(BaseModel):
    """Individual recommendation for intervention."""

    title: str = Field(..., description="Short recommendation title")
    description: str = Field(..., description="Detailed recommendation")
    category: RecommendationCategory = Field(..., description="Recommendation category")
    priority: RecommendationPriority = Field(..., description="Priority level")
    rationale: Optional[str] = Field(default=None, description="Why this is recommended")
    target_factors: list[str] = Field(
        default_factory=list, description="Risk factors this addresses"
    )


class InterventionPlan(BaseModel):
    """Complete intervention plan based on risk assessment."""

    patient_id: str = Field(..., description="Patient identifier")
    risk_level: RiskLevel = Field(..., description="Current risk level")
    recommendations: list[Recommendation] = Field(default_factory=list)
    follow_up_interval_days: int = Field(
        default=90, description="Recommended follow-up interval"
    )
    summary: str = Field(default="", description="Plan summary")


class RecommendationEngine:
    """Engine for generating personalized recommendations."""

    def generate_plan(
        self,
        patient: Patient,
        risk_score: RiskScore,
    ) -> InterventionPlan:
        """Generate a complete intervention plan based on assessment.

        Args:
            patient: Patient data
            risk_score: Calculated risk score

        Returns:
            Complete intervention plan with recommendations
        """
        recommendations = []

        # Generate recommendations based on risk factors
        recommendations.extend(self._nutrition_recommendations(patient, risk_score))
        recommendations.extend(self._exercise_recommendations(patient, risk_score))
        recommendations.extend(self._lifestyle_recommendations(patient, risk_score))
        recommendations.extend(self._medical_recommendations(risk_score))
        recommendations.extend(self._monitoring_recommendations(risk_score))

        # Sort by priority
        priority_order = {
            RecommendationPriority.CRITICAL: 0,
            RecommendationPriority.HIGH: 1,
            RecommendationPriority.MEDIUM: 2,
            RecommendationPriority.LOW: 3,
        }
        recommendations.sort(key=lambda x: priority_order[x.priority])

        # Determine follow-up interval based on risk level
        follow_up_intervals = {
            RiskLevel.LOW: 180,
            RiskLevel.MODERATE: 90,
            RiskLevel.HIGH: 30,
            RiskLevel.SEVERE: 14,
        }

        plan = InterventionPlan(
            patient_id=patient.profile.patient_id,
            risk_level=risk_score.risk_level,
            recommendations=recommendations,
            follow_up_interval_days=follow_up_intervals[risk_score.risk_level],
            summary=self._generate_summary(risk_score, len(recommendations)),
        )

        return plan

    def _nutrition_recommendations(
        self, patient: Patient, risk_score: RiskScore
    ) -> list[Recommendation]:
        """Generate nutrition-related recommendations."""
        recs = []
        top_factors = [f.lower() for f in risk_score.top_risk_factors]

        # Protein recommendations
        if any("protein" in f for f in top_factors):
            target = patient.recommended_protein_g
            recs.append(
                Recommendation(
                    title="Increase Protein Intake",
                    description=f"Aim for {target:.0f}g protein daily ({target/patient.profile.weight_kg:.1f}g/kg). "
                    "Distribute intake across 3-4 meals with 25-40g per meal. "
                    "Prioritize high-quality sources: lean meats, fish, eggs, dairy, legumes.",
                    category=RecommendationCategory.NUTRITION,
                    priority=RecommendationPriority.HIGH,
                    rationale="Adequate protein is essential for muscle protein synthesis and preventing catabolism.",
                    target_factors=["Inadequate Protein Intake"],
                )
            )

        # Caloric recommendations
        if any("caloric" in f or "deficit" in f for f in top_factors):
            target = patient.estimated_caloric_needs
            recs.append(
                Recommendation(
                    title="Address Caloric Deficit",
                    description=f"Target approximately {target} kcal/day based on your activity level. "
                    "Focus on nutrient-dense foods. Consider smaller, frequent meals if appetite is limited.",
                    category=RecommendationCategory.NUTRITION,
                    priority=RecommendationPriority.HIGH,
                    rationale="Chronic caloric deficit triggers muscle catabolism for energy.",
                    target_factors=["Caloric Deficit"],
                )
            )

        # Malnutrition risk
        if any("malnutrition" in f for f in top_factors):
            recs.append(
                Recommendation(
                    title="Nutritional Assessment",
                    description="Consult with a registered dietitian for comprehensive nutritional assessment. "
                    "Consider oral nutritional supplements if food intake is inadequate. "
                    "Screen for micronutrient deficiencies (Vitamin D, B12, iron).",
                    category=RecommendationCategory.NUTRITION,
                    priority=RecommendationPriority.CRITICAL,
                    rationale="Malnutrition significantly accelerates muscle loss.",
                    target_factors=["Malnutrition Risk"],
                )
            )

        # General nutrition for elevated risk
        if risk_score.risk_level in [RiskLevel.HIGH, RiskLevel.SEVERE]:
            recs.append(
                Recommendation(
                    title="Anti-Inflammatory Diet",
                    description="Emphasize anti-inflammatory foods: fatty fish, leafy greens, berries, "
                    "olive oil, nuts. Limit processed foods, refined sugars, and excessive omega-6 fats.",
                    category=RecommendationCategory.NUTRITION,
                    priority=RecommendationPriority.MEDIUM,
                    rationale="Chronic inflammation promotes muscle protein breakdown.",
                    target_factors=["Chronic Inflammation"],
                )
            )

        return recs

    def _exercise_recommendations(
        self, patient: Patient, risk_score: RiskScore
    ) -> list[Recommendation]:
        """Generate exercise-related recommendations."""
        recs = []
        top_factors = [f.lower() for f in risk_score.top_risk_factors]

        # Activity level recommendations
        if patient.activity_level in [ActivityLevel.SEDENTARY, ActivityLevel.LIGHT]:
            priority = (
                RecommendationPriority.CRITICAL
                if any("immobility" in f for f in top_factors)
                else RecommendationPriority.HIGH
            )

            recs.append(
                Recommendation(
                    title="Initiate Resistance Training",
                    description="Begin progressive resistance exercise 2-3 times per week. "
                    "Start with bodyweight exercises or light resistance. "
                    "Focus on major muscle groups: legs, back, chest, shoulders. "
                    "Consider working with a physical therapist or certified trainer initially.",
                    category=RecommendationCategory.EXERCISE,
                    priority=priority,
                    rationale="Resistance training is the most effective intervention for preventing muscle loss.",
                    target_factors=["Low Physical Activity", "Immobility/Bed Rest"],
                )
            )

        # For older adults or those with physical risk factors
        if patient.profile.age >= 65 or any("grip" in f or "gait" in f for f in top_factors):
            recs.append(
                Recommendation(
                    title="Functional Fitness Program",
                    description="Include exercises that mimic daily activities: sit-to-stand, step-ups, "
                    "carrying objects. Practice balance exercises daily. "
                    "Consider tai chi or yoga for flexibility and balance.",
                    category=RecommendationCategory.EXERCISE,
                    priority=RecommendationPriority.HIGH,
                    rationale="Functional training maintains independence and reduces fall risk.",
                    target_factors=["Reduced Grip Strength", "Slow Gait Speed", "Advanced Age"],
                )
            )

        # General activity recommendation
        if risk_score.risk_level != RiskLevel.LOW:
            recs.append(
                Recommendation(
                    title="Increase Daily Movement",
                    description="Aim for 7,000-10,000 steps daily. Break up prolonged sitting every 30-60 minutes. "
                    "Include light activity throughout the day: walking, gardening, household tasks.",
                    category=RecommendationCategory.EXERCISE,
                    priority=RecommendationPriority.MEDIUM,
                    rationale="Regular movement maintains muscle function and metabolic health.",
                    target_factors=["Low Physical Activity"],
                )
            )

        return recs

    def _lifestyle_recommendations(
        self, patient: Patient, risk_score: RiskScore
    ) -> list[Recommendation]:
        """Generate lifestyle-related recommendations."""
        recs = []
        top_factors = [f.lower() for f in risk_score.top_risk_factors]

        # Sleep recommendations
        if any("sleep" in f for f in top_factors) or (
            patient.sleep_hours is not None and patient.sleep_hours < 7
        ):
            recs.append(
                Recommendation(
                    title="Optimize Sleep Quality",
                    description="Target 7-9 hours of sleep per night. Maintain consistent sleep/wake times. "
                    "Create a dark, cool sleeping environment. Limit screen time before bed. "
                    "Avoid caffeine after early afternoon.",
                    category=RecommendationCategory.LIFESTYLE,
                    priority=RecommendationPriority.MEDIUM,
                    rationale="Sleep is essential for muscle recovery and growth hormone release.",
                    target_factors=["Poor Sleep Quality"],
                )
            )

        # Stress recommendations
        if any("stress" in f for f in top_factors) or (
            patient.stress_level is not None and patient.stress_level >= 6
        ):
            recs.append(
                Recommendation(
                    title="Stress Management",
                    description="Implement daily stress-reduction practices: deep breathing, meditation, "
                    "or mindfulness (10-20 minutes daily). Consider cognitive behavioral techniques. "
                    "Ensure adequate leisure time and social connection.",
                    category=RecommendationCategory.LIFESTYLE,
                    priority=RecommendationPriority.MEDIUM,
                    rationale="Chronic stress elevates cortisol, promoting muscle breakdown.",
                    target_factors=["High Chronic Stress"],
                )
            )

        # Smoking
        if any("smoking" in f for f in top_factors):
            recs.append(
                Recommendation(
                    title="Smoking Cessation",
                    description="Smoking accelerates muscle loss. Consult healthcare provider about "
                    "cessation aids (nicotine replacement, medications). Consider support groups or apps.",
                    category=RecommendationCategory.LIFESTYLE,
                    priority=RecommendationPriority.HIGH,
                    rationale="Smoking impairs muscle protein synthesis and increases inflammation.",
                    target_factors=["Smoking"],
                )
            )

        # Alcohol
        if any("alcohol" in f for f in top_factors):
            recs.append(
                Recommendation(
                    title="Moderate Alcohol Intake",
                    description="Limit alcohol to ≤1 drink/day for women, ≤2 for men. "
                    "Avoid binge drinking. Consider alcohol-free days each week.",
                    category=RecommendationCategory.LIFESTYLE,
                    priority=RecommendationPriority.MEDIUM,
                    rationale="Excess alcohol impairs muscle protein synthesis and nutrient absorption.",
                    target_factors=["Excessive Alcohol"],
                )
            )

        return recs

    def _medical_recommendations(self, risk_score: RiskScore) -> list[Recommendation]:
        """Generate medical-related recommendations."""
        recs = []
        top_factors = [f.lower() for f in risk_score.top_risk_factors]

        # For high/severe risk
        if risk_score.risk_level in [RiskLevel.HIGH, RiskLevel.SEVERE]:
            recs.append(
                Recommendation(
                    title="Medical Evaluation",
                    description="Schedule comprehensive evaluation with healthcare provider. "
                    "Discuss current risk factors and potential underlying conditions. "
                    "Review medications for catabolic effects.",
                    category=RecommendationCategory.MEDICAL,
                    priority=RecommendationPriority.CRITICAL,
                    rationale="Medical oversight is essential for high-risk individuals.",
                    target_factors=risk_score.top_risk_factors,
                )
            )

        # Medication review
        if any("medication" in f for f in top_factors):
            recs.append(
                Recommendation(
                    title="Medication Review",
                    description="Discuss with physician whether current medications (especially corticosteroids) "
                    "can be reduced, replaced, or discontinued. Never stop medications without medical guidance.",
                    category=RecommendationCategory.MEDICAL,
                    priority=RecommendationPriority.HIGH,
                    rationale="Some medications have significant catabolic effects on muscle.",
                    target_factors=["Catabolic Medications"],
                )
            )

        # Inflammation
        if any("inflammation" in f for f in top_factors):
            recs.append(
                Recommendation(
                    title="Inflammation Management",
                    description="Work with healthcare provider to identify and treat sources of chronic inflammation. "
                    "Consider testing for inflammatory markers (CRP, ESR). "
                    "Address any underlying autoimmune or infectious conditions.",
                    category=RecommendationCategory.MEDICAL,
                    priority=RecommendationPriority.HIGH,
                    rationale="Chronic inflammation is a major driver of muscle catabolism.",
                    target_factors=["Chronic Inflammation"],
                )
            )

        # Hormonal factors
        if any("testosterone" in f or "hormonal" in f or "thyroid" in f for f in top_factors):
            recs.append(
                Recommendation(
                    title="Hormonal Evaluation",
                    description="Consider comprehensive hormone panel testing (testosterone, thyroid, cortisol). "
                    "Discuss hormone optimization strategies with endocrinologist if indicated.",
                    category=RecommendationCategory.MEDICAL,
                    priority=RecommendationPriority.MEDIUM,
                    rationale="Hormonal imbalances significantly impact muscle metabolism.",
                    target_factors=["Low Testosterone", "Thyroid Dysfunction"],
                )
            )

        return recs

    def _monitoring_recommendations(self, risk_score: RiskScore) -> list[Recommendation]:
        """Generate monitoring-related recommendations."""
        recs = []

        # Monitoring based on risk level
        if risk_score.risk_level == RiskLevel.SEVERE:
            interval = "every 2 weeks"
            tests = "weight, grip strength, inflammatory markers"
        elif risk_score.risk_level == RiskLevel.HIGH:
            interval = "monthly"
            tests = "weight, grip strength, basic labs"
        elif risk_score.risk_level == RiskLevel.MODERATE:
            interval = "every 3 months"
            tests = "weight, functional assessments"
        else:
            interval = "every 6 months"
            tests = "weight, general wellness check"

        recs.append(
            Recommendation(
                title="Regular Monitoring",
                description=f"Schedule follow-up assessments {interval}. "
                f"Track: {tests}. "
                "Keep a log of weight, dietary intake, and exercise. "
                "Report any unintentional weight loss or functional decline promptly.",
                category=RecommendationCategory.MONITORING,
                priority=RecommendationPriority.MEDIUM
                if risk_score.risk_level == RiskLevel.LOW
                else RecommendationPriority.HIGH,
                rationale="Regular monitoring enables early detection of worsening risk.",
                target_factors=risk_score.top_risk_factors,
            )
        )

        # Body composition monitoring for higher risk
        if risk_score.risk_level in [RiskLevel.HIGH, RiskLevel.SEVERE]:
            recs.append(
                Recommendation(
                    title="Body Composition Assessment",
                    description="Consider periodic body composition analysis (DXA, BIA) to track muscle mass changes. "
                    "This provides objective measurement of intervention effectiveness.",
                    category=RecommendationCategory.MONITORING,
                    priority=RecommendationPriority.MEDIUM,
                    rationale="Weight alone doesn't distinguish between muscle and fat changes.",
                    target_factors=["Unintentional Weight Loss", "Sarcopenia History"],
                )
            )

        return recs

    def _generate_summary(self, risk_score: RiskScore, num_recommendations: int) -> str:
        """Generate a summary of the intervention plan."""
        level = risk_score.risk_level.value.upper()
        top_category = risk_score.get_highest_risk_category()

        summary = f"Risk Level: {level} ({risk_score.percentage:.1f}%). "

        if top_category:
            summary += f"Primary concern: {top_category.category.value} factors. "

        if risk_score.top_risk_factors:
            top_3 = risk_score.top_risk_factors[:3]
            summary += f"Key risk factors: {', '.join(top_3)}. "

        summary += f"Plan includes {num_recommendations} recommendations."

        return summary
