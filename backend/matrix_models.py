"""
Muscle-Meta Matrix Models for Personalized Assessment and Learning
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import uuid


# Enums for risk levels and categories
class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class Pillar(str, Enum):
    EXERCISE_MOVEMENT = "exercise_movement"
    NUTRITION_METABOLISM = "nutrition_metabolism"
    RECOVERY_STRESS = "recovery_stress"
    BALANCE_BRAIN = "balance_brain"


# Muscle-Meta Matrix Framework Definition
MATRIX_FRAMEWORK = {
    "exercise_movement": {
        "name": "Exercise & Movement",
        "description": "Physical activity, strength, mobility, and functional movement patterns",
        "categories": [
            {
                "id": "strength_training",
                "name": "Strength Training",
                "description": "Resistance exercise, muscle building, progressive overload"
            },
            {
                "id": "cardiovascular_fitness",
                "name": "Cardiovascular Fitness",
                "description": "Aerobic capacity, endurance, heart health"
            },
            {
                "id": "mobility_flexibility",
                "name": "Mobility & Flexibility",
                "description": "Range of motion, joint health, movement quality"
            }
        ]
    },
    "nutrition_metabolism": {
        "name": "Nutrition & Metabolism",
        "description": "Diet quality, metabolic health, and nutritional optimization",
        "categories": [
            {
                "id": "dietary_quality",
                "name": "Dietary Quality",
                "description": "Whole foods, macronutrient balance, meal consistency"
            },
            {
                "id": "metabolic_markers",
                "name": "Metabolic Markers",
                "description": "Blood sugar, insulin sensitivity, metabolic flexibility"
            },
            {
                "id": "hydration_supplements",
                "name": "Hydration & Supplements",
                "description": "Water intake, supplementation, nutrient timing"
            }
        ]
    },
    "recovery_stress": {
        "name": "Recovery & Stress",
        "description": "Sleep quality, stress management, and recovery optimization",
        "categories": [
            {
                "id": "sleep_quality",
                "name": "Sleep Quality",
                "description": "Duration, consistency, sleep hygiene, recovery"
            },
            {
                "id": "stress_management",
                "name": "Stress Management",
                "description": "Mental health, coping strategies, resilience"
            },
            {
                "id": "recovery_practices",
                "name": "Recovery Practices",
                "description": "Active recovery, rest days, recovery modalities"
            }
        ]
    },
    "balance_brain": {
        "name": "Balance & Brain Health",
        "description": "Cognitive function, coordination, and neurological wellness",
        "categories": [
            {
                "id": "cognitive_function",
                "name": "Cognitive Function",
                "description": "Mental clarity, focus, memory, brain health"
            },
            {
                "id": "balance_coordination",
                "name": "Balance & Coordination",
                "description": "Proprioception, stability, fall prevention"
            },
            {
                "id": "mind_body_connection",
                "name": "Mind-Body Connection",
                "description": "Mindfulness, body awareness, intentional movement"
            }
        ]
    }
}


# Assessment Question Model
class AssessmentQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pillar: Pillar
    category: str  # One of the 12 categories
    question_text: str
    question_type: str  # "scale", "multiple_choice", "yes_no", "numeric"
    options: Optional[List[Dict[str, any]]] = None  # For multiple choice
    scoring_map: Dict[str, int]  # Maps answer to score (0-100)
    weight: float = 1.0  # Weight of this question in category score
    order: int = 0


# User's Answer to Assessment Question
class AssessmentAnswer(BaseModel):
    question_id: str
    answer: str  # User's answer (can be text, number, or option ID)
    score: int  # Calculated score for this answer (0-100)


# Category Score (aggregated from questions)
class CategoryScore(BaseModel):
    category_id: str
    category_name: str
    pillar: Pillar
    score: float  # 0-100
    risk_level: RiskLevel
    answers: List[AssessmentAnswer] = []


# Pillar Score (aggregated from categories)
class PillarScore(BaseModel):
    pillar: Pillar
    pillar_name: str
    score: float  # 0-100 (average of 3 categories)
    risk_level: RiskLevel
    categories: List[CategoryScore]


# Complete User Assessment Result
class UserAssessment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    assessment_type: str = "initial"  # "initial", "reassessment", "progress_check"
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    overall_score: float  # 0-100 (average of 4 pillars)
    overall_risk_level: RiskLevel
    pillar_scores: List[PillarScore]
    recommendations: List[str] = []  # Personalized recommendations
    priority_areas: List[str] = []  # Categories needing most attention
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserAssessmentCreate(BaseModel):
    user_id: str
    assessment_type: str = "initial"
    answers: List[AssessmentAnswer]


# User Progress Tracking (compare assessments over time)
class ProgressComparison(BaseModel):
    user_id: str
    baseline_assessment_id: str
    current_assessment_id: str
    time_period_days: int
    overall_improvement: float  # Percentage improvement
    pillar_improvements: Dict[str, float]  # Pillar -> improvement %
    category_improvements: Dict[str, float]  # Category -> improvement %
    achievements: List[str] = []  # Milestones reached
    next_goals: List[str] = []


# Course Mapping (which courses address which categories)
class CourseMapping(BaseModel):
    course_id: str
    course_title: str
    target_pillars: List[Pillar]
    target_categories: List[str]  # List of category IDs
    recommended_for_risk_levels: List[RiskLevel]


# Personalized Learning Path
class LearningPath(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    assessment_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    priority_courses: List[CourseMapping]  # Ordered by priority
    optional_courses: List[CourseMapping]
    estimated_completion_weeks: int
    goals: List[str] = []


# Assessment Question Bank (pre-defined questions)
ASSESSMENT_QUESTIONS = [
    # Exercise & Movement - Strength Training
    {
        "pillar": "exercise_movement",
        "category": "strength_training",
        "question_text": "How many days per week do you perform resistance/strength training?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "0 days (I don't do strength training)", "score": 0},
            {"id": "1", "text": "1 day per week", "score": 25},
            {"id": "2", "text": "2 days per week", "score": 50},
            {"id": "3", "text": "3-4 days per week", "score": 85},
            {"id": "4", "text": "5+ days per week", "score": 100}
        ],
        "scoring_map": {"0": 0, "1": 25, "2": 50, "3": 85, "4": 100},
        "weight": 1.5,
        "order": 1
    },
    {
        "pillar": "exercise_movement",
        "category": "strength_training",
        "question_text": "Can you perform 10 proper bodyweight squats without discomfort?",
        "question_type": "yes_no",
        "scoring_map": {"yes": 100, "no": 0},
        "weight": 1.0,
        "order": 2
    },
    {
        "pillar": "exercise_movement",
        "category": "strength_training",
        "question_text": "Rate your current strength level (1-10)",
        "question_type": "scale",
        "scoring_map": {str(i): i * 10 for i in range(1, 11)},
        "weight": 1.0,
        "order": 3
    },

    # Exercise & Movement - Cardiovascular Fitness
    {
        "pillar": "exercise_movement",
        "category": "cardiovascular_fitness",
        "question_text": "How many minutes of moderate-to-vigorous cardio do you get per week?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "0-30 minutes", "score": 0},
            {"id": "1", "text": "30-75 minutes", "score": 40},
            {"id": "2", "text": "75-150 minutes (recommended)", "score": 85},
            {"id": "3", "text": "150-300 minutes", "score": 100},
            {"id": "4", "text": "300+ minutes", "score": 90}
        ],
        "scoring_map": {"0": 0, "1": 40, "2": 85, "3": 100, "4": 90},
        "weight": 1.5,
        "order": 4
    },
    {
        "pillar": "exercise_movement",
        "category": "cardiovascular_fitness",
        "question_text": "Can you climb 2 flights of stairs without significant breathlessness?",
        "question_type": "yes_no",
        "scoring_map": {"yes": 100, "no": 20},
        "weight": 1.0,
        "order": 5
    },

    # Exercise & Movement - Mobility & Flexibility
    {
        "pillar": "exercise_movement",
        "category": "mobility_flexibility",
        "question_text": "How often do you perform stretching or mobility work?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "Never", "score": 0},
            {"id": "1", "text": "1-2 times per week", "score": 40},
            {"id": "2", "text": "3-4 times per week", "score": 70},
            {"id": "3", "text": "5-7 times per week", "score": 100}
        ],
        "scoring_map": {"0": 0, "1": 40, "2": 70, "3": 100},
        "weight": 1.0,
        "order": 6
    },
    {
        "pillar": "exercise_movement",
        "category": "mobility_flexibility",
        "question_text": "Can you touch your toes without bending your knees?",
        "question_type": "yes_no",
        "scoring_map": {"yes": 100, "no": 30},
        "weight": 0.8,
        "order": 7
    },

    # Nutrition & Metabolism - Dietary Quality
    {
        "pillar": "nutrition_metabolism",
        "category": "dietary_quality",
        "question_text": "How many servings of vegetables do you eat per day?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "0-1 servings", "score": 0},
            {"id": "1", "text": "2-3 servings", "score": 50},
            {"id": "2", "text": "4-5 servings", "score": 85},
            {"id": "3", "text": "6+ servings", "score": 100}
        ],
        "scoring_map": {"0": 0, "1": 50, "2": 85, "3": 100},
        "weight": 1.2,
        "order": 8
    },
    {
        "pillar": "nutrition_metabolism",
        "category": "dietary_quality",
        "question_text": "How often do you eat processed/fast food?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "Daily", "score": 0},
            {"id": "1", "text": "4-6 times per week", "score": 20},
            {"id": "2", "text": "1-3 times per week", "score": 60},
            {"id": "3", "text": "Rarely (1-2 times per month)", "score": 90},
            {"id": "4", "text": "Never", "score": 100}
        ],
        "scoring_map": {"0": 0, "1": 20, "2": 60, "3": 90, "4": 100},
        "weight": 1.0,
        "order": 9
    },

    # Nutrition & Metabolism - Metabolic Markers
    {
        "pillar": "nutrition_metabolism",
        "category": "metabolic_markers",
        "question_text": "Do you experience energy crashes or fatigue after meals?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "Frequently (most days)", "score": 0},
            {"id": "1", "text": "Often (several times per week)", "score": 30},
            {"id": "2", "text": "Occasionally", "score": 60},
            {"id": "3", "text": "Rarely", "score": 85},
            {"id": "4", "text": "Never", "score": 100}
        ],
        "scoring_map": {"0": 0, "1": 30, "2": 60, "3": 85, "4": 100},
        "weight": 1.3,
        "order": 10
    },
    {
        "pillar": "nutrition_metabolism",
        "category": "metabolic_markers",
        "question_text": "When was your last comprehensive metabolic blood panel?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "Never", "score": 0},
            {"id": "1", "text": "More than 2 years ago", "score": 20},
            {"id": "2", "text": "1-2 years ago", "score": 50},
            {"id": "3", "text": "Within the past year", "score": 100}
        ],
        "scoring_map": {"0": 0, "1": 20, "2": 50, "3": 100},
        "weight": 0.8,
        "order": 11
    },

    # Nutrition & Metabolism - Hydration & Supplements
    {
        "pillar": "nutrition_metabolism",
        "category": "hydration_supplements",
        "question_text": "How much water do you drink per day?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "Less than 4 cups (32 oz)", "score": 0},
            {"id": "1", "text": "4-6 cups (32-48 oz)", "score": 40},
            {"id": "2", "text": "7-8 cups (56-64 oz)", "score": 85},
            {"id": "3", "text": "8+ cups (64+ oz)", "score": 100}
        ],
        "scoring_map": {"0": 0, "1": 40, "2": 85, "3": 100},
        "weight": 1.0,
        "order": 12
    },

    # Recovery & Stress - Sleep Quality
    {
        "pillar": "recovery_stress",
        "category": "sleep_quality",
        "question_text": "How many hours of sleep do you get per night on average?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "Less than 5 hours", "score": 0},
            {"id": "1", "text": "5-6 hours", "score": 30},
            {"id": "2", "text": "6-7 hours", "score": 60},
            {"id": "3", "text": "7-8 hours (optimal)", "score": 100},
            {"id": "4", "text": "8-9 hours", "score": 95},
            {"id": "5", "text": "9+ hours", "score": 70}
        ],
        "scoring_map": {"0": 0, "1": 30, "2": 60, "3": 100, "4": 95, "5": 70},
        "weight": 1.5,
        "order": 13
    },
    {
        "pillar": "recovery_stress",
        "category": "sleep_quality",
        "question_text": "How would you rate your sleep quality?",
        "question_type": "scale",
        "scoring_map": {str(i): i * 10 for i in range(1, 11)},
        "weight": 1.3,
        "order": 14
    },
    {
        "pillar": "recovery_stress",
        "category": "sleep_quality",
        "question_text": "Do you have a consistent sleep schedule (same bedtime/wake time)?",
        "question_type": "yes_no",
        "scoring_map": {"yes": 100, "no": 20},
        "weight": 1.0,
        "order": 15
    },

    # Recovery & Stress - Stress Management
    {
        "pillar": "recovery_stress",
        "category": "stress_management",
        "question_text": "How would you rate your current stress level?",
        "question_type": "scale",
        "scoring_map": {str(i): (11 - i) * 10 for i in range(1, 11)},  # Inverted: 1 = 100, 10 = 10
        "weight": 1.5,
        "order": 16
    },
    {
        "pillar": "recovery_stress",
        "category": "stress_management",
        "question_text": "Do you practice stress-reduction techniques (meditation, breathing exercises, etc.)?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "Never", "score": 0},
            {"id": "1", "text": "Occasionally", "score": 40},
            {"id": "2", "text": "Several times per week", "score": 70},
            {"id": "3", "text": "Daily", "score": 100}
        ],
        "scoring_map": {"0": 0, "1": 40, "2": 70, "3": 100},
        "weight": 1.2,
        "order": 17
    },

    # Recovery & Stress - Recovery Practices
    {
        "pillar": "recovery_stress",
        "category": "recovery_practices",
        "question_text": "How many rest/recovery days do you take per week?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "0 days (I never rest)", "score": 20},
            {"id": "1", "text": "1 day", "score": 60},
            {"id": "2", "text": "2 days", "score": 100},
            {"id": "3", "text": "3+ days", "score": 80}
        ],
        "scoring_map": {"0": 20, "1": 60, "2": 100, "3": 80},
        "weight": 1.0,
        "order": 18
    },

    # Balance & Brain - Cognitive Function
    {
        "pillar": "balance_brain",
        "category": "cognitive_function",
        "question_text": "How often do you experience brain fog or difficulty concentrating?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "Daily", "score": 0},
            {"id": "1", "text": "Several times per week", "score": 30},
            {"id": "2", "text": "Occasionally", "score": 60},
            {"id": "3", "text": "Rarely", "score": 85},
            {"id": "4", "text": "Never", "score": 100}
        ],
        "scoring_map": {"0": 0, "1": 30, "2": 60, "3": 85, "4": 100},
        "weight": 1.3,
        "order": 19
    },
    {
        "pillar": "balance_brain",
        "category": "cognitive_function",
        "question_text": "Do you engage in mentally stimulating activities (reading, puzzles, learning)?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "Rarely", "score": 20},
            {"id": "1", "text": "1-2 times per week", "score": 50},
            {"id": "2", "text": "3-5 times per week", "score": 80},
            {"id": "3", "text": "Daily", "score": 100}
        ],
        "scoring_map": {"0": 20, "1": 50, "2": 80, "3": 100},
        "weight": 1.0,
        "order": 20
    },

    # Balance & Brain - Balance & Coordination
    {
        "pillar": "balance_brain",
        "category": "balance_coordination",
        "question_text": "Can you stand on one leg for 30+ seconds without support?",
        "question_type": "yes_no",
        "scoring_map": {"yes": 100, "no": 20},
        "weight": 1.2,
        "order": 21
    },
    {
        "pillar": "balance_brain",
        "category": "balance_coordination",
        "question_text": "How often do you practice balance exercises?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "Never", "score": 0},
            {"id": "1", "text": "Occasionally", "score": 40},
            {"id": "2", "text": "2-3 times per week", "score": 70},
            {"id": "3", "text": "4+ times per week", "score": 100}
        ],
        "scoring_map": {"0": 0, "1": 40, "2": 70, "3": 100},
        "weight": 1.0,
        "order": 22
    },

    # Balance & Brain - Mind-Body Connection
    {
        "pillar": "balance_brain",
        "category": "mind_body_connection",
        "question_text": "Do you practice mindfulness or mind-body exercises (yoga, tai chi, etc.)?",
        "question_type": "multiple_choice",
        "options": [
            {"id": "0", "text": "Never", "score": 0},
            {"id": "1", "text": "Occasionally", "score": 40},
            {"id": "2", "text": "1-2 times per week", "score": 70},
            {"id": "3", "text": "3+ times per week", "score": 100}
        ],
        "scoring_map": {"0": 0, "1": 40, "2": 70, "3": 100},
        "weight": 1.0,
        "order": 23
    },
    {
        "pillar": "balance_brain",
        "category": "mind_body_connection",
        "question_text": "Rate your body awareness (ability to sense body position and movement)",
        "question_type": "scale",
        "scoring_map": {str(i): i * 10 for i in range(1, 11)},
        "weight": 0.8,
        "order": 24
    }
]


# Risk Level Thresholds
def get_risk_level(score: float) -> RiskLevel:
    """Determine risk level based on score (0-100)"""
    if score >= 80:
        return RiskLevel.LOW
    elif score >= 60:
        return RiskLevel.MODERATE
    elif score >= 40:
        return RiskLevel.HIGH
    else:
        return RiskLevel.CRITICAL
