"""
Recommendations Module

Generates personalized pathways, action plans, and messages based on assessment results.
"""

from typing import List, Dict, Any
import uuid
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import (
    PillarScores,
    PathwayRecommendation,
    DailyAction,
    Task,
    CourseCTA,
    TaskCategory,
    TaskDifficulty,
)


# Course offerings mapped to pillars
COURSE_OFFERINGS: Dict[str, Dict[str, Any]] = {
    "exercise_mobility": {
        "title": "Movement Mastery Protocol",
        "original_price": 197.00,
        "launch_price": 97.00,
        "url": "/courses/movement-mastery",
        "pathway": "Functional Fitness Foundation",
        "description": "Your movement and functional capacity scores indicate opportunities for improvement. This pillar focuses on rebuilding strength, mobility, and physical capability.",
        "expected_outcome": "20-30% improvement in functional tests",
        "timeframe": "8-12 weeks",
    },
    "nutrition_metabolism": {
        "title": "Metabolic Optimization System",
        "original_price": 197.00,
        "launch_price": 97.00,
        "url": "/courses/metabolic-optimization",
        "pathway": "Protein-First Nutrition Protocol",
        "description": "Your nutrition and metabolic indicators show areas needing attention. This pillar addresses protein optimization, medication interactions, and metabolic health.",
        "expected_outcome": "Stable weight with muscle preservation",
        "timeframe": "6-8 weeks",
    },
    "recovery_stress": {
        "title": "Recovery & Resilience Program",
        "original_price": 147.00,
        "launch_price": 77.00,
        "url": "/courses/recovery-resilience",
        "pathway": "Stress-Recovery Balance System",
        "description": "Your recovery and stress markers suggest your body needs support in healing and regeneration. This pillar optimizes sleep, stress management, and recovery capacity.",
        "expected_outcome": "Improved energy and recovery quality",
        "timeframe": "4-6 weeks",
    },
    "balance_brain": {
        "title": "Neural-Balance Integration",
        "original_price": 147.00,
        "launch_price": 77.00,
        "url": "/courses/neural-balance",
        "pathway": "Brain-Body Connection Protocol",
        "description": "Your neurological and balance indicators show areas for enhancement. This pillar strengthens the brain-body connection, improves balance, and supports cognitive function.",
        "expected_outcome": "30% improvement in balance metrics",
        "timeframe": "6-8 weeks",
    },
}


def generate_pathways(
    pillar_scores: PillarScores, risk_level: str
) -> List[PathwayRecommendation]:
    """
    Generate personalized pathway recommendations based on pillar scores.

    Pathways are prioritized by risk score (highest risk = highest priority).

    Args:
        pillar_scores: The calculated pillar scores
        risk_level: Overall risk level for context

    Returns:
        List of PathwayRecommendation objects sorted by priority
    """
    pillars = [
        ("exercise_mobility", pillar_scores.exercise_mobility),
        ("nutrition_metabolism", pillar_scores.nutrition_metabolism),
        ("recovery_stress", pillar_scores.recovery_stress),
        ("balance_brain", pillar_scores.balance_brain),
    ]

    # Sort by score descending (higher score = higher risk = higher priority)
    pillars.sort(key=lambda x: x[1], reverse=True)

    pathways = []
    for priority, (pillar_key, score) in enumerate(pillars, start=1):
        offering = COURSE_OFFERINGS[pillar_key]

        pathway = PathwayRecommendation(
            pillar=pillar_key,
            priority=priority,
            risk_score=score,
            pathway=offering["pathway"],
            description=offering["description"],
            expected_outcome=offering["expected_outcome"],
            timeframe=offering["timeframe"],
            course_cta=CourseCTA(
                title=offering["title"],
                original_price=offering["original_price"],
                launch_price=offering["launch_price"],
                url=offering["url"],
            ),
        )
        pathways.append(pathway)

    return pathways


# Action plan templates by flag/risk type
ACTION_TEMPLATES: Dict[str, List[Dict[str, Any]]] = {
    "RAPID_WEIGHT_LOSS": [
        {
            "category": "nutrition",
            "action": "Calculate your protein needs (1.2-1.6g per kg body weight)",
            "time_required": "15 min",
            "difficulty": "easy",
            "urgent": True,
        },
        {
            "category": "nutrition",
            "action": "Plan 4-5 protein-rich meals/snacks for tomorrow",
            "time_required": "20 min",
            "difficulty": "easy",
            "urgent": True,
        },
        {
            "category": "medical",
            "action": "Schedule appointment with healthcare provider to discuss weight loss",
            "time_required": "10 min",
            "difficulty": "easy",
            "urgent": True,
        },
    ],
    "GLP1_MONITORING": [
        {
            "category": "nutrition",
            "action": "Review protein intake - aim for 30g protein per meal minimum",
            "time_required": "15 min",
            "difficulty": "easy",
            "urgent": False,
        },
        {
            "category": "exercise",
            "action": "Schedule resistance training sessions (2-3x per week)",
            "time_required": "20 min",
            "difficulty": "moderate",
            "urgent": False,
        },
    ],
    "FUNCTIONAL_DECLINE": [
        {
            "category": "exercise",
            "action": "Practice sit-to-stand exercises (3 sets of 10)",
            "time_required": "10 min",
            "difficulty": "moderate",
            "urgent": False,
        },
        {
            "category": "exercise",
            "action": "Take a 15-minute walk at a brisk pace",
            "time_required": "15 min",
            "difficulty": "easy",
            "urgent": False,
        },
    ],
    "NO_RESISTANCE_TRAINING": [
        {
            "category": "exercise",
            "action": "Try 5 wall push-ups and 5 chair squats",
            "time_required": "5 min",
            "difficulty": "easy",
            "urgent": False,
        },
        {
            "category": "exercise",
            "action": "Watch beginner resistance training tutorial",
            "time_required": "15 min",
            "difficulty": "easy",
            "urgent": False,
        },
    ],
    "LOW_PROTEIN": [
        {
            "category": "nutrition",
            "action": "Add a protein source to your next meal (eggs, chicken, fish, legumes)",
            "time_required": "5 min",
            "difficulty": "easy",
            "urgent": False,
        },
        {
            "category": "nutrition",
            "action": "Purchase high-protein snacks (Greek yogurt, cheese, nuts)",
            "time_required": "30 min",
            "difficulty": "easy",
            "urgent": False,
        },
    ],
    "SLEEP_QUALITY_CONCERN": [
        {
            "category": "monitoring",
            "action": "Set a consistent bedtime for tonight",
            "time_required": "5 min",
            "difficulty": "easy",
            "urgent": False,
        },
        {
            "category": "monitoring",
            "action": "Remove phone from bedroom 1 hour before sleep",
            "time_required": "1 min",
            "difficulty": "easy",
            "urgent": False,
        },
    ],
    "BONE_HEALTH_RISK": [
        {
            "category": "nutrition",
            "action": "Check calcium and Vitamin D intake for today",
            "time_required": "10 min",
            "difficulty": "easy",
            "urgent": False,
        },
        {
            "category": "exercise",
            "action": "Do 10 minutes of weight-bearing exercise (walking, stairs)",
            "time_required": "10 min",
            "difficulty": "easy",
            "urgent": False,
        },
    ],
}

# Default daily focuses
DEFAULT_DAILY_FOCUSES = [
    "Foundation Assessment & Goal Setting",
    "Nutrition Optimization",
    "Movement & Mobility",
    "Recovery & Sleep",
    "Strength Building",
    "Integration & Habits",
    "Review & Planning Ahead",
]


def generate_action_plan(
    critical_flags: List[str], high_flags: List[str], risk_level: str
) -> List[DailyAction]:
    """
    Generate a 7-day action plan based on detected flags and risk level.

    Args:
        critical_flags: List of critical flag identifiers
        high_flags: List of high-risk flag identifiers
        risk_level: Overall risk level

    Returns:
        List of DailyAction objects for 7 days
    """
    action_plan = []
    all_flags = critical_flags + high_flags
    task_counter = 0

    for day in range(1, 8):
        tasks = []
        focus = DEFAULT_DAILY_FOCUSES[day - 1]

        # Day 1: Assessment and urgent actions
        if day == 1:
            tasks.append(
                Task(
                    id=f"task-{task_counter}",
                    category=TaskCategory.MONITORING,
                    action="Review your complete assessment results",
                    time_required="15 min",
                    difficulty=TaskDifficulty.EASY,
                    urgent=False,
                )
            )
            task_counter += 1

            tasks.append(
                Task(
                    id=f"task-{task_counter}",
                    category=TaskCategory.MONITORING,
                    action="Record your current weight and note how clothes fit",
                    time_required="5 min",
                    difficulty=TaskDifficulty.EASY,
                    urgent=False,
                )
            )
            task_counter += 1

            # Add urgent tasks from critical flags
            for flag in critical_flags:
                if flag in ACTION_TEMPLATES:
                    for action in ACTION_TEMPLATES[flag]:
                        if action.get("urgent", False):
                            tasks.append(
                                Task(
                                    id=f"task-{task_counter}",
                                    category=TaskCategory(action["category"]),
                                    action=action["action"],
                                    time_required=action["time_required"],
                                    difficulty=TaskDifficulty(action["difficulty"]),
                                    urgent=True,
                                )
                            )
                            task_counter += 1

        # Day 2: Nutrition focus
        elif day == 2:
            tasks.append(
                Task(
                    id=f"task-{task_counter}",
                    category=TaskCategory.NUTRITION,
                    action="Track everything you eat today",
                    time_required="Throughout day",
                    difficulty=TaskDifficulty.EASY,
                    urgent=False,
                )
            )
            task_counter += 1

            # Add nutrition-related tasks
            for flag in ["LOW_PROTEIN", "RAPID_WEIGHT_LOSS"]:
                if flag in all_flags and flag in ACTION_TEMPLATES:
                    for action in ACTION_TEMPLATES[flag]:
                        if action["category"] == "nutrition" and not action.get("urgent"):
                            tasks.append(
                                Task(
                                    id=f"task-{task_counter}",
                                    category=TaskCategory.NUTRITION,
                                    action=action["action"],
                                    time_required=action["time_required"],
                                    difficulty=TaskDifficulty(action["difficulty"]),
                                    urgent=False,
                                )
                            )
                            task_counter += 1

        # Day 3: Movement focus
        elif day == 3:
            tasks.append(
                Task(
                    id=f"task-{task_counter}",
                    category=TaskCategory.EXERCISE,
                    action="Complete the sit-to-stand test (count how many in 30 seconds)",
                    time_required="5 min",
                    difficulty=TaskDifficulty.EASY,
                    urgent=False,
                )
            )
            task_counter += 1

            # Add exercise-related tasks
            for flag in ["FUNCTIONAL_DECLINE", "NO_RESISTANCE_TRAINING", "SEDENTARY_LIFESTYLE"]:
                if flag in all_flags and flag in ACTION_TEMPLATES:
                    for action in ACTION_TEMPLATES[flag]:
                        if action["category"] == "exercise":
                            tasks.append(
                                Task(
                                    id=f"task-{task_counter}",
                                    category=TaskCategory.EXERCISE,
                                    action=action["action"],
                                    time_required=action["time_required"],
                                    difficulty=TaskDifficulty(action["difficulty"]),
                                    urgent=False,
                                )
                            )
                            task_counter += 1

        # Day 4: Recovery focus
        elif day == 4:
            tasks.append(
                Task(
                    id=f"task-{task_counter}",
                    category=TaskCategory.MONITORING,
                    action="Rate your sleep quality last night (1-10)",
                    time_required="2 min",
                    difficulty=TaskDifficulty.EASY,
                    urgent=False,
                )
            )
            task_counter += 1

            # Add recovery-related tasks
            for flag in ["SLEEP_QUALITY_CONCERN"]:
                if flag in all_flags and flag in ACTION_TEMPLATES:
                    for action in ACTION_TEMPLATES[flag]:
                        tasks.append(
                            Task(
                                id=f"task-{task_counter}",
                                category=TaskCategory(action["category"]),
                                action=action["action"],
                                time_required=action["time_required"],
                                difficulty=TaskDifficulty(action["difficulty"]),
                                urgent=False,
                            )
                        )
                        task_counter += 1

        # Day 5: Strength building
        elif day == 5:
            tasks.append(
                Task(
                    id=f"task-{task_counter}",
                    category=TaskCategory.EXERCISE,
                    action="Test your grip strength (squeeze a stress ball or towel)",
                    time_required="5 min",
                    difficulty=TaskDifficulty.EASY,
                    urgent=False,
                )
            )
            task_counter += 1

            tasks.append(
                Task(
                    id=f"task-{task_counter}",
                    category=TaskCategory.EXERCISE,
                    action="Do a 20-minute resistance workout (bodyweight or light weights)",
                    time_required="20 min",
                    difficulty=TaskDifficulty.MODERATE,
                    urgent=False,
                )
            )
            task_counter += 1

        # Day 6: Integration
        elif day == 6:
            tasks.append(
                Task(
                    id=f"task-{task_counter}",
                    category=TaskCategory.MONITORING,
                    action="Review what worked well this week",
                    time_required="10 min",
                    difficulty=TaskDifficulty.EASY,
                    urgent=False,
                )
            )
            task_counter += 1

            tasks.append(
                Task(
                    id=f"task-{task_counter}",
                    category=TaskCategory.NUTRITION,
                    action="Meal prep protein-rich options for next week",
                    time_required="60 min",
                    difficulty=TaskDifficulty.MODERATE,
                    urgent=False,
                )
            )
            task_counter += 1

        # Day 7: Review and plan
        elif day == 7:
            tasks.append(
                Task(
                    id=f"task-{task_counter}",
                    category=TaskCategory.MONITORING,
                    action="Weigh yourself and compare to Day 1",
                    time_required="5 min",
                    difficulty=TaskDifficulty.EASY,
                    urgent=False,
                )
            )
            task_counter += 1

            tasks.append(
                Task(
                    id=f"task-{task_counter}",
                    category=TaskCategory.MONITORING,
                    action="Set 3 goals for next week based on your progress",
                    time_required="15 min",
                    difficulty=TaskDifficulty.EASY,
                    urgent=False,
                )
            )
            task_counter += 1

            if risk_level in ["high", "critical"]:
                tasks.append(
                    Task(
                        id=f"task-{task_counter}",
                        category=TaskCategory.MEDICAL,
                        action="Confirm healthcare provider appointment is scheduled",
                        time_required="5 min",
                        difficulty=TaskDifficulty.EASY,
                        urgent=True,
                    )
                )
                task_counter += 1

        # Calculate success metric based on tasks
        success_metric = f"Complete {len(tasks)} tasks to build your foundation"

        action_plan.append(
            DailyAction(
                day=day,
                focus=focus,
                tasks=tasks,
                success_metric=success_metric,
            )
        )

    return action_plan


# Message templates by risk level
MESSAGE_TEMPLATES: Dict[str, str] = {
    "critical": """{name}, your assessment reveals several critical areas requiring immediate attention. The good news is that you've taken the first step by identifying these risks. With focused intervention on your {primary_pillar} and the right support, significant improvements are achievable within weeks. This is exactly why we created the Muscle-Meta Matrix—to give you a clear path forward.""",
    "high": """{name}, your results show elevated risk in key areas, particularly {primary_pillar}. While these findings deserve attention, they also represent an opportunity. People at your stage often see the most dramatic improvements with proper intervention. Let's turn these numbers around together.""",
    "moderate-high": """{name}, your assessment shows you're at a crossroads. Your {primary_pillar} score indicates areas where small changes now can prevent bigger problems later. You have the chance to intervene early—that's a significant advantage.""",
    "low-moderate": """{name}, your results are encouraging overall, with room for optimization in {primary_pillar}. You're in a great position to build on your existing foundation and enhance your muscle health for the long term.""",
    "minimal": """{name}, congratulations! Your assessment shows minimal catabolic risk. Your focus should be on maintaining these excellent results and potentially optimizing your {primary_pillar} for peak performance.""",
}


def generate_personalized_message(
    name: str, risk_level: str, primary_pillar: str
) -> str:
    """
    Generate a personalized message based on risk level and primary concern.

    Args:
        name: User's name or "Friend" if not provided
        risk_level: The overall risk level
        primary_pillar: The highest-priority pillar key

    Returns:
        Personalized message string
    """
    # Format pillar name for display
    pillar_display = primary_pillar.replace("_", " & ").title()

    template = MESSAGE_TEMPLATES.get(risk_level, MESSAGE_TEMPLATES["moderate-high"])
    return template.format(name=name, primary_pillar=pillar_display)
