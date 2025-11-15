"""
Assessment API Routes for Muscle-Meta Matrix Personalized Learning
"""
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict
import os
from datetime import datetime

from matrix_models import (
    UserAssessment,
    UserAssessmentCreate,
    AssessmentQuestion,
    AssessmentAnswer,
    CategoryScore,
    PillarScore,
    ProgressComparison,
    LearningPath,
    RiskLevel,
    Pillar,
    MATRIX_FRAMEWORK,
    ASSESSMENT_QUESTIONS,
    get_risk_level
)
from models import User
from auth import get_current_active_user

# Create router
assessment_router = APIRouter(prefix="/api/assessment", tags=["assessment"])

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


@assessment_router.get("/framework")
async def get_matrix_framework():
    """
    Get the complete Muscle-Meta Matrix framework structure
    (4 Pillars and 12 Categories)
    """
    return {
        "framework": MATRIX_FRAMEWORK,
        "total_pillars": 4,
        "total_categories": 12,
        "risk_levels": ["low", "moderate", "high", "critical"]
    }


@assessment_router.get("/questions")
async def get_assessment_questions():
    """
    Get all assessment questions for the onboarding survey
    Returns questions ordered by pillar and order field
    """
    # Convert questions to AssessmentQuestion models
    questions = []
    for i, q_data in enumerate(ASSESSMENT_QUESTIONS):
        question = {
            "id": f"q_{i+1}",
            "pillar": q_data["pillar"],
            "category": q_data["category"],
            "question_text": q_data["question_text"],
            "question_type": q_data["question_type"],
            "options": q_data.get("options", []),
            "scoring_map": q_data["scoring_map"],
            "weight": q_data["weight"],
            "order": q_data["order"]
        }
        questions.append(question)

    # Sort by order
    questions.sort(key=lambda x: x["order"])

    return {
        "questions": questions,
        "total_questions": len(questions)
    }


@assessment_router.post("/submit", response_model=UserAssessment)
async def submit_assessment(
    assessment_data: UserAssessmentCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Submit a completed assessment and calculate scores

    This endpoint:
    1. Validates all answers
    2. Calculates scores for each category (0-100)
    3. Calculates scores for each pillar (average of 3 categories)
    4. Calculates overall score (average of 4 pillars)
    5. Determines risk levels
    6. Generates personalized recommendations
    7. Stores the assessment in the database
    """

    # Verify user_id matches authenticated user
    if assessment_data.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot submit assessment for another user")

    # Calculate scores
    assessment_result = calculate_assessment_scores(assessment_data)

    # Store in database
    await db.user_assessments.insert_one(assessment_result.dict())

    # Update user's profile with latest assessment
    await db.users.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "latest_assessment_id": assessment_result.id,
                "latest_assessment_date": assessment_result.completed_at,
                "updated_at": datetime.utcnow()
            }
        }
    )

    return assessment_result


def calculate_assessment_scores(assessment_data: UserAssessmentCreate) -> UserAssessment:
    """
    Calculate all scores and risk levels from assessment answers
    """

    # Group answers by category
    category_answers: Dict[str, List[AssessmentAnswer]] = {}

    for i, answer in enumerate(assessment_data.answers):
        question = ASSESSMENT_QUESTIONS[i]
        category = question["category"]

        if category not in category_answers:
            category_answers[category] = []

        category_answers[category].append(answer)

    # Calculate category scores
    category_scores: List[CategoryScore] = []
    pillar_category_map: Dict[str, List[CategoryScore]] = {}

    for pillar_id, pillar_data in MATRIX_FRAMEWORK.items():
        pillar_category_map[pillar_id] = []

        for category_data in pillar_data["categories"]:
            category_id = category_data["id"]
            answers = category_answers.get(category_id, [])

            # Calculate weighted average score for category
            if answers:
                total_weighted_score = sum(
                    answer.score * ASSESSMENT_QUESTIONS[j]["weight"]
                    for j, answer in enumerate(answers)
                    if ASSESSMENT_QUESTIONS[j]["category"] == category_id
                )
                total_weight = sum(
                    ASSESSMENT_QUESTIONS[j]["weight"]
                    for j, answer in enumerate(answers)
                    if ASSESSMENT_QUESTIONS[j]["category"] == category_id
                )

                category_score_value = total_weighted_score / total_weight if total_weight > 0 else 0
            else:
                category_score_value = 0

            category_score = CategoryScore(
                category_id=category_id,
                category_name=category_data["name"],
                pillar=pillar_id,
                score=round(category_score_value, 1),
                risk_level=get_risk_level(category_score_value),
                answers=answers
            )

            category_scores.append(category_score)
            pillar_category_map[pillar_id].append(category_score)

    # Calculate pillar scores (average of 3 categories)
    pillar_scores: List[PillarScore] = []

    for pillar_id, categories in pillar_category_map.items():
        pillar_data = MATRIX_FRAMEWORK[pillar_id]

        avg_score = sum(cat.score for cat in categories) / len(categories) if categories else 0

        pillar_score = PillarScore(
            pillar=pillar_id,
            pillar_name=pillar_data["name"],
            score=round(avg_score, 1),
            risk_level=get_risk_level(avg_score),
            categories=categories
        )

        pillar_scores.append(pillar_score)

    # Calculate overall score (average of 4 pillars)
    overall_score = sum(p.score for p in pillar_scores) / len(pillar_scores) if pillar_scores else 0
    overall_risk_level = get_risk_level(overall_score)

    # Generate recommendations
    recommendations = generate_recommendations(pillar_scores, category_scores)

    # Identify priority areas (lowest scoring categories)
    sorted_categories = sorted(category_scores, key=lambda x: x.score)
    priority_areas = [
        f"{cat.category_name} ({cat.pillar.replace('_', ' ').title()})"
        for cat in sorted_categories[:3]
    ]

    # Create assessment result
    assessment = UserAssessment(
        user_id=assessment_data.user_id,
        assessment_type=assessment_data.assessment_type,
        completed_at=datetime.utcnow(),
        overall_score=round(overall_score, 1),
        overall_risk_level=overall_risk_level,
        pillar_scores=pillar_scores,
        recommendations=recommendations,
        priority_areas=priority_areas
    )

    return assessment


def generate_recommendations(
    pillar_scores: List[PillarScore],
    category_scores: List[CategoryScore]
) -> List[str]:
    """Generate personalized recommendations based on scores"""

    recommendations = []

    # Sort pillars by score (lowest first)
    sorted_pillars = sorted(pillar_scores, key=lambda x: x.score)

    for pillar in sorted_pillars[:2]:  # Focus on 2 lowest pillars
        if pillar.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            pillar_name = pillar.pillar_name

            # Find lowest category in this pillar
            lowest_category = min(pillar.categories, key=lambda x: x.score)

            recommendations.append(
                f"Priority: Address {pillar_name} - Start with {lowest_category.category_name} "
                f"(Current score: {lowest_category.score}/100)"
            )

    # Add specific recommendations based on categories
    for category in category_scores:
        if category.risk_level == RiskLevel.CRITICAL:
            recommendations.append(
                f"Critical: {category.category_name} needs immediate attention. "
                f"Consider enrolling in our {category.pillar.replace('_', ' ').title()} course."
            )

    return recommendations[:5]  # Limit to 5 recommendations


@assessment_router.get("/user/{user_id}/latest", response_model=UserAssessment)
async def get_user_latest_assessment(
    user_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get the user's most recent assessment"""

    # Verify access
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find latest assessment
    assessment = await db.user_assessments.find_one(
        {"user_id": user_id},
        sort=[("completed_at", -1)]
    )

    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found for user")

    assessment.pop("_id", None)
    return UserAssessment(**assessment)


@assessment_router.get("/user/{user_id}/history", response_model=List[UserAssessment])
async def get_user_assessment_history(
    user_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get all assessments for a user (to track progress over time)"""

    # Verify access
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find all assessments, sorted by date (newest first)
    assessments = await db.user_assessments.find(
        {"user_id": user_id}
    ).sort("completed_at", -1).to_list(100)

    # Remove MongoDB _id
    for assessment in assessments:
        assessment.pop("_id", None)

    return [UserAssessment(**a) for a in assessments]


@assessment_router.get("/user/{user_id}/progress", response_model=ProgressComparison)
async def get_user_progress(
    user_id: str,
    baseline_assessment_id: str = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Compare two assessments to show progress over time
    If baseline_assessment_id is not provided, uses the earliest assessment
    """

    # Verify access
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get assessments
    assessments = await db.user_assessments.find(
        {"user_id": user_id}
    ).sort("completed_at", 1).to_list(100)

    if len(assessments) < 2:
        raise HTTPException(
            status_code=400,
            detail="Need at least 2 assessments to compare progress"
        )

    # Get baseline (first or specified)
    if baseline_assessment_id:
        baseline = next((a for a in assessments if a["id"] == baseline_assessment_id), None)
        if not baseline:
            raise HTTPException(status_code=404, detail="Baseline assessment not found")
    else:
        baseline = assessments[0]

    # Get current (most recent)
    current = assessments[-1]

    baseline.pop("_id", None)
    current.pop("_id", None)
    baseline_obj = UserAssessment(**baseline)
    current_obj = UserAssessment(**current)

    # Calculate improvements
    overall_improvement = current_obj.overall_score - baseline_obj.overall_score

    pillar_improvements = {}
    for curr_pillar in current_obj.pillar_scores:
        base_pillar = next(
            (p for p in baseline_obj.pillar_scores if p.pillar == curr_pillar.pillar),
            None
        )
        if base_pillar:
            improvement = curr_pillar.score - base_pillar.score
            pillar_improvements[curr_pillar.pillar] = round(improvement, 1)

    category_improvements = {}
    for curr_pillar in current_obj.pillar_scores:
        for curr_cat in curr_pillar.categories:
            base_pillar = next(
                (p for p in baseline_obj.pillar_scores if p.pillar == curr_pillar.pillar),
                None
            )
            if base_pillar:
                base_cat = next(
                    (c for c in base_pillar.categories if c.category_id == curr_cat.category_id),
                    None
                )
                if base_cat:
                    improvement = curr_cat.score - base_cat.score
                    category_improvements[curr_cat.category_id] = round(improvement, 1)

    # Calculate time period
    time_delta = current_obj.completed_at - baseline_obj.completed_at
    time_period_days = time_delta.days

    # Generate achievements
    achievements = []
    if overall_improvement >= 10:
        achievements.append(f"Improved overall score by {overall_improvement:.1f} points!")

    for pillar_id, improvement in pillar_improvements.items():
        if improvement >= 15:
            pillar_name = MATRIX_FRAMEWORK[pillar_id]["name"]
            achievements.append(f"Major improvement in {pillar_name} (+{improvement:.1f} points)")

    # Risk level improvements
    if baseline_obj.overall_risk_level != current_obj.overall_risk_level:
        risk_levels = [RiskLevel.CRITICAL, RiskLevel.HIGH, RiskLevel.MODERATE, RiskLevel.LOW]
        if risk_levels.index(current_obj.overall_risk_level) > risk_levels.index(baseline_obj.overall_risk_level):
            achievements.append(f"Reduced risk level from {baseline_obj.overall_risk_level} to {current_obj.overall_risk_level}")

    # Generate next goals
    next_goals = []
    for pillar in current_obj.pillar_scores:
        if pillar.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            next_goals.append(f"Continue improving {pillar.pillar_name}")

    if not next_goals:
        next_goals.append("Maintain your excellent progress across all pillars")

    return ProgressComparison(
        user_id=user_id,
        baseline_assessment_id=baseline_obj.id,
        current_assessment_id=current_obj.id,
        time_period_days=time_period_days,
        overall_improvement=round(overall_improvement, 1),
        pillar_improvements=pillar_improvements,
        category_improvements=category_improvements,
        achievements=achievements,
        next_goals=next_goals
    )


@assessment_router.get("/user/{user_id}/recommendations", response_model=LearningPath)
async def get_personalized_learning_path(
    user_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate personalized learning path based on latest assessment
    Recommends courses that target user's highest-risk areas
    """

    # Verify access
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get latest assessment
    assessment = await db.user_assessments.find_one(
        {"user_id": user_id},
        sort=[("completed_at", -1)]
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Complete an assessment first to get personalized recommendations"
        )

    assessment.pop("_id", None)
    assessment_obj = UserAssessment(**assessment)

    # TODO: Implement course recommendation logic based on risk levels
    # For now, return placeholder

    return LearningPath(
        user_id=user_id,
        assessment_id=assessment_obj.id,
        priority_courses=[],
        optional_courses=[],
        estimated_completion_weeks=4,
        goals=assessment_obj.recommendations
    )
