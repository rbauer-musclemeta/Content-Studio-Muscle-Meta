"""
Assessment API Routes

Handles assessment scoring, results retrieval, email capture, and PDF generation.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Any, Optional
from datetime import datetime
import os
import logging
import base64
from io import BytesIO

# Import models
from models import (
    AssessmentResult,
    AssessmentResultCreate,
    EmailCapture,
    EmailCaptureCreate,
    DemographicData,
    AssessmentResponse,
)

# Import scoring modules
from scoring import (
    generate_full_results,
    generate_pathways,
    generate_action_plan,
    generate_personalized_message,
)

# Initialize router
assessment = APIRouter(prefix="/api/assessment", tags=["Assessment"])

# MongoDB connection (shared with server.py)
mongo_url = os.environ.get("MONGO_URL", "")
client = AsyncIOMotorClient(mongo_url) if mongo_url else None
db = client[os.environ.get("DB_NAME", "muscle_meta")] if client else None

logger = logging.getLogger(__name__)


@assessment.post("/score", response_model=Dict[str, Any])
async def calculate_score(request: AssessmentResultCreate):
    """
    Calculate assessment score from responses and generate full results.

    This endpoint:
    1. Processes assessment responses
    2. Calculates total and section scores
    3. Determines risk level
    4. Generates personalized pathways and action plan
    5. Saves results to database
    """
    try:
        # Generate full results using scoring engine
        results = generate_full_results(
            responses=request.responses,
            demographics=request.demographic_data,
            assessment_id=request.assessment_id,
            user_id=request.user_id,
        )

        # Generate personalized recommendations
        pathways = generate_pathways(results.pillar_scores, results.risk_level.value)
        action_plan = generate_action_plan(
            results.critical_flags,
            results.high_flags,
            results.risk_level.value
        )

        # Get primary pillar for message
        primary_pillar = pathways[0].pillar if pathways else "nutrition_metabolism"
        personalized_message = generate_personalized_message(
            name="Friend",  # Will be updated with email capture
            risk_level=results.risk_level.value,
            primary_pillar=primary_pillar,
        )

        # Update results with recommendations
        results.pathways = pathways
        results.action_plan = action_plan
        results.personalized_message = personalized_message

        # Save to database
        if db is not None:
            result_dict = results.dict()
            result_dict["_id"] = results.id
            await db.assessment_results.update_one(
                {"assessment_id": request.assessment_id},
                {"$set": result_dict},
                upsert=True,
            )

        logger.info(f"Assessment scored: {request.assessment_id}, Risk: {results.risk_level.value}")

        return {
            "success": True,
            "result_id": results.id,
            "assessment_id": request.assessment_id,
            "results": results.dict(),
        }

    except Exception as e:
        logger.error(f"Scoring error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate score: {str(e)}")


@assessment.get("/results/{assessment_id}", response_model=Dict[str, Any])
async def get_results(assessment_id: str):
    """
    Retrieve assessment results by assessment ID.
    """
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="Database not connected")

        result = await db.assessment_results.find_one({"assessment_id": assessment_id})

        if not result:
            raise HTTPException(status_code=404, detail="Assessment not found")

        # Remove MongoDB _id field
        result.pop("_id", None)

        return {
            "success": True,
            "results": result,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving results: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve results")


@assessment.post("/email/capture", response_model=Dict[str, Any])
async def capture_email(request: EmailCaptureCreate):
    """
    Capture email address for assessment results access.

    Creates or updates email capture record and optionally
    updates the associated assessment result with user info.
    """
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="Database not connected")

        # Check if email already exists
        existing = await db.email_captures.find_one({"email": request.email})

        email_capture = EmailCapture(
            email=request.email,
            assessment_id=request.assessment_id,
            first_name=request.first_name,
        )

        if existing:
            # Update existing record
            await db.email_captures.update_one(
                {"email": request.email},
                {"$set": {
                    "assessment_id": request.assessment_id,
                    "first_name": request.first_name,
                    "captured_at": datetime.utcnow(),
                }}
            )
        else:
            # Create new capture
            await db.email_captures.insert_one(email_capture.dict())

        # Update personalized message in assessment result if we have a name
        if request.first_name and request.assessment_id:
            result = await db.assessment_results.find_one(
                {"assessment_id": request.assessment_id}
            )
            if result:
                # Regenerate personalized message with name
                pathways = result.get("pathways", [])
                primary_pillar = pathways[0].get("pillar", "nutrition_metabolism") if pathways else "nutrition_metabolism"
                risk_level = result.get("risk_level", "moderate-high")

                new_message = generate_personalized_message(
                    name=request.first_name,
                    risk_level=risk_level,
                    primary_pillar=primary_pillar,
                )

                await db.assessment_results.update_one(
                    {"assessment_id": request.assessment_id},
                    {"$set": {"personalized_message": new_message}}
                )

        logger.info(f"Email captured: {request.email} for assessment {request.assessment_id}")

        return {
            "success": True,
            "message": "Email captured successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email capture error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to capture email")


@assessment.post("/pdf/generate", response_model=Dict[str, Any])
async def generate_pdf(assessment_id: str, background_tasks: BackgroundTasks):
    """
    Generate PDF report for assessment results.

    Returns base64-encoded PDF data.
    """
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="Database not connected")

        result = await db.assessment_results.find_one({"assessment_id": assessment_id})

        if not result:
            raise HTTPException(status_code=404, detail="Assessment not found")

        # Generate PDF (simplified version - in production use reportlab or weasyprint)
        pdf_content = generate_assessment_pdf(result)

        # Encode as base64
        pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')

        # Mark PDF as generated
        await db.assessment_results.update_one(
            {"assessment_id": assessment_id},
            {"$set": {"pdf_generated": True}}
        )

        return {
            "success": True,
            "pdf": pdf_base64,
            "filename": f"Muscle-Meta-Assessment-{assessment_id}.pdf",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF generation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF")


def generate_assessment_pdf(result: Dict[str, Any]) -> bytes:
    """
    Generate PDF content from assessment results.

    Note: This is a simplified text-based PDF. In production,
    use reportlab or weasyprint for proper PDF generation.
    """
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#009090'),
            spaceAfter=20,
        )
        story.append(Paragraph("CATABOLIC RISK ASSESSMENT RESULTS", title_style))
        story.append(Spacer(1, 12))

        # Risk Level
        risk_level = result.get("risk_level", "unknown").upper()
        risk_category = result.get("risk_category", "Unknown Risk")
        total_score = result.get("total_score", 0)
        max_score = result.get("max_score", 200)

        story.append(Paragraph(f"<b>Risk Level:</b> {risk_category}", styles["Normal"]))
        story.append(Paragraph(f"<b>Total Score:</b> {total_score}/{max_score}", styles["Normal"]))
        story.append(Spacer(1, 20))

        # Pillar Scores
        story.append(Paragraph("<b>4-PILLAR RISK PROFILE</b>", styles["Heading2"]))
        pillar_scores = result.get("pillar_scores", {})
        pillar_data = [
            ["Pillar", "Score", "Risk Level"],
            ["Exercise & Mobility", f"{pillar_scores.get('exercise_mobility', 0)}/100", get_pillar_risk_text(pillar_scores.get('exercise_mobility', 0))],
            ["Nutrition & Metabolism", f"{pillar_scores.get('nutrition_metabolism', 0)}/100", get_pillar_risk_text(pillar_scores.get('nutrition_metabolism', 0))],
            ["Recovery & Stress", f"{pillar_scores.get('recovery_stress', 0)}/100", get_pillar_risk_text(pillar_scores.get('recovery_stress', 0))],
            ["Balance & Brain Health", f"{pillar_scores.get('balance_brain', 0)}/100", get_pillar_risk_text(pillar_scores.get('balance_brain', 0))],
        ]

        pillar_table = Table(pillar_data, colWidths=[2.5*inch, 1*inch, 1.5*inch])
        pillar_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#009090')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(pillar_table)
        story.append(Spacer(1, 20))

        # Critical Alerts
        alerts = result.get("critical_alerts", [])
        if alerts:
            story.append(Paragraph("<b>CRITICAL ALERTS</b>", styles["Heading2"]))
            for alert in alerts[:5]:  # Show top 5 alerts
                severity = alert.get("severity", "warning").upper()
                message = alert.get("message", "")
                action = alert.get("action", "")
                story.append(Paragraph(f"<b>[{severity}]</b> {message}", styles["Normal"]))
                story.append(Paragraph(f"<i>Action: {action}</i>", styles["Normal"]))
                story.append(Spacer(1, 8))
            story.append(Spacer(1, 12))

        # 7-Day Action Plan Summary
        action_plan = result.get("action_plan", [])
        if action_plan:
            story.append(Paragraph("<b>7-DAY ACTION PLAN SUMMARY</b>", styles["Heading2"]))
            for day in action_plan[:3]:  # Show first 3 days
                day_num = day.get("day", 0)
                focus = day.get("focus", "")
                tasks = day.get("tasks", [])
                story.append(Paragraph(f"<b>Day {day_num}:</b> {focus}", styles["Normal"]))
                for task in tasks[:3]:  # Show top 3 tasks per day
                    action_text = task.get("action", "")
                    urgent = "⚠️ " if task.get("urgent", False) else ""
                    story.append(Paragraph(f"  □ {urgent}{action_text}", styles["Normal"]))
                story.append(Spacer(1, 8))

        # Footer
        story.append(Spacer(1, 30))
        story.append(Paragraph(
            "<i>Muscle-Meta Matrix | www.muscle-meta.com</i>",
            ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.gray)
        ))

        doc.build(story)
        return buffer.getvalue()

    except ImportError:
        # Fallback to simple text if reportlab not installed
        logger.warning("reportlab not installed, generating simple text PDF")
        return generate_simple_text_pdf(result)


def generate_simple_text_pdf(result: Dict[str, Any]) -> bytes:
    """
    Generate a simple text-based PDF-like content.
    Used as fallback when reportlab is not available.
    """
    content = []
    content.append("=" * 60)
    content.append("CATABOLIC RISK ASSESSMENT RESULTS")
    content.append("=" * 60)
    content.append("")
    content.append(f"Risk Level: {result.get('risk_category', 'Unknown')}")
    content.append(f"Total Score: {result.get('total_score', 0)}/{result.get('max_score', 200)}")
    content.append("")
    content.append("-" * 40)
    content.append("4-PILLAR RISK PROFILE")
    content.append("-" * 40)

    pillar_scores = result.get("pillar_scores", {})
    content.append(f"Exercise & Mobility: {pillar_scores.get('exercise_mobility', 0)}/100")
    content.append(f"Nutrition & Metabolism: {pillar_scores.get('nutrition_metabolism', 0)}/100")
    content.append(f"Recovery & Stress: {pillar_scores.get('recovery_stress', 0)}/100")
    content.append(f"Balance & Brain Health: {pillar_scores.get('balance_brain', 0)}/100")

    content.append("")
    content.append("-" * 40)
    content.append("Generated by Muscle-Meta Matrix")

    return "\n".join(content).encode('utf-8')


def get_pillar_risk_text(score: int) -> str:
    """Get risk level text for a pillar score."""
    if score <= 25:
        return "Low"
    elif score <= 55:
        return "Moderate"
    elif score <= 85:
        return "High"
    return "Critical"


# Mock data endpoint for testing
@assessment.get("/mock/{risk_level}", response_model=Dict[str, Any])
async def get_mock_results(risk_level: str = "moderate-high"):
    """
    Get mock assessment results for testing and development.

    Available risk levels: minimal, low-moderate, moderate-high, high, critical
    """
    from scoring import (
        get_risk_label,
        get_risk_color,
    )

    # Mock scores based on risk level
    score_ranges = {
        "minimal": (15, 25),
        "low-moderate": (35, 45),
        "moderate-high": (60, 75),
        "high": (90, 110),
        "critical": (130, 160),
    }

    import random
    score_range = score_ranges.get(risk_level, score_ranges["moderate-high"])
    total_score = random.randint(*score_range)

    # Generate mock pillar scores
    base_pillar = total_score // 2
    pillar_scores = {
        "exercise_mobility": min(100, base_pillar + random.randint(-10, 20)),
        "nutrition_metabolism": min(100, base_pillar + random.randint(-15, 15)),
        "recovery_stress": min(100, base_pillar + random.randint(-20, 10)),
        "balance_brain": min(100, base_pillar + random.randint(-10, 10)),
    }

    # Generate mock alerts
    alerts = []
    if risk_level in ["high", "critical"]:
        alerts.append({
            "id": "alert-rapid-weight-loss",
            "severity": "critical",
            "category": "Weight Loss",
            "message": "Rapid weight loss detected. This significantly increases muscle loss risk.",
            "action": "Contact healthcare provider within 1 week",
            "timeframe": "7 days",
        })
    if risk_level in ["moderate-high", "high", "critical"]:
        alerts.append({
            "id": "alert-functional-decline",
            "severity": "warning",
            "category": "Functional Performance",
            "message": "Your functional performance indicates mild impairment.",
            "action": "Begin structured exercise program this week",
            "timeframe": "7 days",
        })

    # Generate mock pathways
    pathways = [
        {
            "pillar": "nutrition_metabolism",
            "priority": 1,
            "risk_score": pillar_scores["nutrition_metabolism"],
            "pathway": "Protein-First Nutrition Protocol",
            "description": "Your nutrition and metabolic indicators show areas needing attention.",
            "expected_outcome": "Stable weight with muscle preservation",
            "timeframe": "6-8 weeks",
            "course_cta": {
                "title": "Metabolic Optimization System",
                "original_price": 197.00,
                "launch_price": 97.00,
                "url": "/courses/metabolic-optimization",
            },
        },
        {
            "pillar": "exercise_mobility",
            "priority": 2,
            "risk_score": pillar_scores["exercise_mobility"],
            "pathway": "Functional Fitness Foundation",
            "description": "Your movement and functional capacity scores indicate opportunities for improvement.",
            "expected_outcome": "20-30% improvement in functional tests",
            "timeframe": "8-12 weeks",
            "course_cta": {
                "title": "Movement Mastery Protocol",
                "original_price": 197.00,
                "launch_price": 97.00,
                "url": "/courses/movement-mastery",
            },
        },
    ]

    # Generate mock action plan
    action_plan = [
        {
            "day": 1,
            "focus": "Foundation Assessment & Goal Setting",
            "tasks": [
                {
                    "id": "task-0",
                    "category": "monitoring",
                    "action": "Review your complete assessment results",
                    "time_required": "15 min",
                    "difficulty": "easy",
                    "urgent": False,
                },
                {
                    "id": "task-1",
                    "category": "monitoring",
                    "action": "Record your current weight and note how clothes fit",
                    "time_required": "5 min",
                    "difficulty": "easy",
                    "urgent": False,
                },
            ],
            "success_metric": "Complete 2 tasks to build your foundation",
        },
        {
            "day": 2,
            "focus": "Nutrition Optimization",
            "tasks": [
                {
                    "id": "task-2",
                    "category": "nutrition",
                    "action": "Track everything you eat today",
                    "time_required": "Throughout day",
                    "difficulty": "easy",
                    "urgent": False,
                },
                {
                    "id": "task-3",
                    "category": "nutrition",
                    "action": "Add a protein source to your next meal",
                    "time_required": "5 min",
                    "difficulty": "easy",
                    "urgent": False,
                },
            ],
            "success_metric": "Complete 2 tasks to build your foundation",
        },
        {
            "day": 3,
            "focus": "Movement & Mobility",
            "tasks": [
                {
                    "id": "task-4",
                    "category": "exercise",
                    "action": "Complete the sit-to-stand test (count how many in 30 seconds)",
                    "time_required": "5 min",
                    "difficulty": "easy",
                    "urgent": False,
                },
                {
                    "id": "task-5",
                    "category": "exercise",
                    "action": "Take a 15-minute walk at a brisk pace",
                    "time_required": "15 min",
                    "difficulty": "easy",
                    "urgent": False,
                },
            ],
            "success_metric": "Complete 2 tasks to build your foundation",
        },
    ]

    mock_result = {
        "id": "mock-result-id",
        "assessment_id": "mock-assessment-123",
        "user_id": None,
        "demographic_data": {
            "age": 55,
            "gender": "male",
            "height": 70,
            "weight": 185,
        },
        "total_score": total_score,
        "max_score": 200,
        "percent_score": (total_score / 200) * 100,
        "section_scores": {
            "medical_events": random.randint(0, 30),
            "weight_loss": random.randint(0, 40),
            "medications": random.randint(0, 35),
            "neurological": random.randint(0, 25),
            "functional": random.randint(0, 40),
            "muscle_balance": random.randint(0, 25),
            "strength": random.randint(0, 20),
            "bone_health": random.randint(0, 30),
            "energy_sleep": random.randint(0, 25),
            "warning_signs": random.randint(0, 20),
            "biomarkers": random.randint(0, 15),
        },
        "risk_level": risk_level,
        "risk_category": get_risk_label(risk_level),
        "percentile": max(0, min(100, 100 - total_score // 2)),
        "pillar_scores": pillar_scores,
        "critical_alerts": alerts,
        "critical_flags": ["FUNCTIONAL_DECLINE"] if risk_level != "minimal" else [],
        "high_flags": ["LOW_PROTEIN", "NO_RESISTANCE_TRAINING"] if risk_level not in ["minimal", "low-moderate"] else [],
        "pathways": pathways,
        "action_plan": action_plan,
        "personalized_message": f"Based on your {risk_level.replace('-', ' ')} risk assessment, we've identified key areas for improvement. Your nutrition and metabolism pillar shows the greatest opportunity for positive change.",
        "pdf_generated": False,
        "assessment_date": datetime.utcnow().isoformat(),
    }

    return {
        "success": True,
        "results": mock_result,
    }
