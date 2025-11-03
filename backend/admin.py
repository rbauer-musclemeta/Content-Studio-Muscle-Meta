from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from models import Course, CourseCreate, Newsletter, NewsletterCreate, User
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from datetime import datetime
from typing import List, Optional
import uuid
import json

# Import authentication dependencies
from auth import get_current_admin_user

# Setup logging
logger = logging.getLogger(__name__)

# Database setup - avoid circular import
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Initialize database connection directly
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Admin router
admin = APIRouter(prefix="/api/admin")

# Course Management Endpoints

@admin.get("/courses", response_model=List[Course])
async def get_courses():
    """Get all courses for admin management"""
    try:
        courses = await db.courses.find({}, {"_id": 0}).to_list(1000)
        return [Course(**course) for course in courses]
    except Exception as e:
        logger.error(f"Error fetching courses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch courses")

@admin.get("/courses/{course_id}", response_model=Course)
async def get_course(course_id: str):
    """Get a specific course by ID"""
    try:
        course = await db.courses.find_one({"id": course_id}, {"_id": 0})
        if not course:
            # Return default course structure for sleep-optimization
            if course_id == "sleep-optimization":
                return Course(
                    id="sleep-optimization",
                    title="The 4-Week Sleep Optimization Blueprint",
                    subtitle="Reclaiming Your Rest & Vitality",
                    instructor="Randy Bauer, PT",
                    description="This comprehensive 4-week course is designed to empower individuals to significantly improve their sleep quality, energy levels, and overall well-being.",
                    price=97.00,
                    original_price=147.00,
                    duration="4 weeks",
                    lessons=16,
                    level="All Levels",
                    featured=True,
                    pillars=["Recovery"]
                )
            raise HTTPException(status_code=404, detail="Course not found")
        return Course(**course)
    except Exception as e:
        logger.error(f"Error fetching course {course_id}: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to fetch course")

@admin.post("/courses", response_model=Course)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new course (admin only)"""
    try:
        # Create course with generated ID
        course_dict = course_data.dict()
        course_dict["id"] = str(uuid.uuid4())
        course_dict["created_at"] = datetime.utcnow()
        course_dict["updated_at"] = datetime.utcnow()
        
        course = Course(**course_dict)
        
        # Insert into database
        await db.courses.insert_one(course.dict())
        
        logger.info(f"Created course: {course.id}")
        return course
        
    except Exception as e:
        logger.error(f"Error creating course: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create course")

@admin.put("/courses/{course_id}", response_model=Course)
async def update_course(
    course_id: str,
    course_data: CourseCreate,
    current_user: User = Depends(get_current_admin_user)
):
    """Update an existing course (admin only)"""
    try:
        # Check if course exists
        existing_course = await db.courses.find_one({"id": course_id})
        if not existing_course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Update course data
        update_data = course_data.dict()
        update_data["updated_at"] = datetime.utcnow()
        
        # Preserve original creation data
        update_data["id"] = course_id
        update_data["created_at"] = existing_course.get("created_at", datetime.utcnow())
        
        course = Course(**update_data)
        
        # Update in database
        await db.courses.update_one(
            {"id": course_id},
            {"$set": course.dict()}
        )
        
        logger.info(f"Updated course: {course_id}")
        return course
        
    except Exception as e:
        logger.error(f"Error updating course {course_id}: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to update course")

@admin.delete("/courses/{course_id}")
async def delete_course(
    course_id: str,
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a course (admin only)"""
    try:
        result = await db.courses.delete_one({"id": course_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Course not found")
        
        logger.info(f"Deleted course: {course_id}")
        return {"message": "Course deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting course {course_id}: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to delete course")

# Newsletter Management Endpoints

@admin.get("/newsletters", response_model=List[Newsletter])
async def get_newsletters():
    """Get all newsletters for admin management"""
    try:
        newsletters = await db.newsletters.find({}, {"_id": 0}).to_list(1000)
        return [Newsletter(**newsletter) for newsletter in newsletters]
    except Exception as e:
        logger.error(f"Error fetching newsletters: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch newsletters")

@admin.get("/newsletters/{newsletter_id}", response_model=Newsletter)
async def get_newsletter(newsletter_id: str):
    """Get a specific newsletter by ID"""
    try:
        newsletter = await db.newsletters.find_one({"id": newsletter_id}, {"_id": 0})
        if not newsletter:
            raise HTTPException(status_code=404, detail="Newsletter not found")
        return Newsletter(**newsletter)
    except Exception as e:
        logger.error(f"Error fetching newsletter {newsletter_id}: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to fetch newsletter")

@admin.post("/newsletters", response_model=Newsletter)
async def create_newsletter(
    newsletter_data: NewsletterCreate,
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new newsletter (admin only)"""
    try:
        # Create newsletter with generated ID
        newsletter_dict = newsletter_data.dict()
        newsletter_dict["id"] = str(uuid.uuid4())
        newsletter_dict["created_at"] = datetime.utcnow()
        newsletter_dict["updated_at"] = datetime.utcnow()
        
        newsletter = Newsletter(**newsletter_dict)
        
        # Insert into database
        await db.newsletters.insert_one(newsletter.dict())
        
        logger.info(f"Created newsletter: {newsletter.id}")
        return newsletter
        
    except Exception as e:
        logger.error(f"Error creating newsletter: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create newsletter")

@admin.put("/newsletters/{newsletter_id}", response_model=Newsletter)
async def update_newsletter(
    newsletter_id: str,
    newsletter_data: NewsletterCreate,
    current_user: User = Depends(get_current_admin_user)
):
    """Update an existing newsletter (admin only)"""
    try:
        # Check if newsletter exists
        existing_newsletter = await db.newsletters.find_one({"id": newsletter_id})
        if not existing_newsletter:
            raise HTTPException(status_code=404, detail="Newsletter not found")
        
        # Update newsletter data
        update_data = newsletter_data.dict()
        update_data["updated_at"] = datetime.utcnow()
        
        # Preserve original creation data
        update_data["id"] = newsletter_id
        update_data["created_at"] = existing_newsletter.get("created_at", datetime.utcnow())
        
        newsletter = Newsletter(**update_data)
        
        # Update in database
        await db.newsletters.update_one(
            {"id": newsletter_id},
            {"$set": newsletter.dict()}
        )
        
        logger.info(f"Updated newsletter: {newsletter_id}")
        return newsletter
        
    except Exception as e:
        logger.error(f"Error updating newsletter {newsletter_id}: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to update newsletter")

# Content Management Endpoints

@admin.post("/tts/generate")
async def generate_tts(
    text: str = Form(...),
    voice: str = Form(default="female-professional"),
    course_id: Optional[str] = Form(None),
    newsletter_id: Optional[str] = Form(None)
):
    """Generate text-to-speech audio for content"""
    try:
        # This would integrate with a TTS service like ElevenLabs, Azure TTS, etc.
        # For now, return a mock response
        audio_id = str(uuid.uuid4())
        
        # Store TTS record
        tts_record = {
            "id": audio_id,
            "text": text,
            "voice": voice,
            "course_id": course_id,
            "newsletter_id": newsletter_id,
            "status": "generating",
            "created_at": datetime.utcnow()
        }
        
        await db.tts_audio.insert_one(tts_record)
        
        # Mock audio URL (in production, this would be the actual audio file)
        audio_url = f"/api/admin/tts/{audio_id}/audio.mp3"
        
        return {
            "audio_id": audio_id,
            "audio_url": audio_url,
            "status": "completed",
            "duration": len(text.split()) * 0.5  # Rough estimate
        }
        
    except Exception as e:
        logger.error(f"Error generating TTS: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate audio")

@admin.post("/upload/resource")
async def upload_resource(
    file: UploadFile = File(...),
    course_id: Optional[str] = Form(None),
    newsletter_id: Optional[str] = Form(None),
    resource_type: str = Form(default="document")
):
    """Upload course/newsletter resources"""
    try:
        # Validate file type
        allowed_types = {
            'document': ['.pdf', '.doc', '.docx', '.txt'],
            'video': ['.mp4', '.mov', '.avi', '.mkv'],
            'audio': ['.mp3', '.wav', '.m4a'],
            'presentation': ['.ppt', '.pptx']
        }
        
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_types.get(resource_type, []):
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # In production, save to cloud storage (S3, GCS, etc.)
        resource_id = str(uuid.uuid4())
        file_path = f"/uploads/{resource_id}{file_ext}"
        
        # Save file metadata
        resource_record = {
            "id": resource_id,
            "filename": file.filename,
            "file_path": file_path,
            "file_size": file.size if hasattr(file, 'size') else 0,
            "content_type": file.content_type,
            "resource_type": resource_type,
            "course_id": course_id,
            "newsletter_id": newsletter_id,
            "created_at": datetime.utcnow()
        }
        
        await db.resources.insert_one(resource_record)
        
        return {
            "resource_id": resource_id,
            "filename": file.filename,
            "download_url": f"/api/admin/resources/{resource_id}/download",
            "resource_type": resource_type
        }
        
    except Exception as e:
        logger.error(f"Error uploading resource: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to upload resource")

@admin.get("/resources")
async def get_resources(course_id: Optional[str] = None, newsletter_id: Optional[str] = None):
    """Get uploaded resources"""
    try:
        query = {}
        if course_id:
            query["course_id"] = course_id
        if newsletter_id:
            query["newsletter_id"] = newsletter_id
            
        resources = await db.resources.find(query, {"_id": 0}).to_list(1000)
        return resources
        
    except Exception as e:
        logger.error(f"Error fetching resources: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch resources")

# Analytics Endpoints

@admin.get("/analytics/dashboard")
async def get_dashboard_analytics():
    """Get dashboard analytics data"""
    try:
        # Get course stats
        total_courses = await db.courses.count_documents({})
        
        # Get enrollment stats from payments
        paid_transactions = await db.payment_transactions.find({"payment_status": "paid"}).to_list(1000)
        total_revenue = sum(t.get("amount", 0) for t in paid_transactions)
        total_students = len(paid_transactions)
        
        # Get pending payments
        pending_payments = await db.payment_transactions.count_documents({"payment_status": "pending"})
        
        # Course popularity
        course_enrollments = {}
        for transaction in paid_transactions:
            course_id = transaction.get("course_id", "unknown")
            course_enrollments[course_id] = course_enrollments.get(course_id, 0) + 1
        
        return {
            "total_courses": total_courses,
            "total_students": total_students,
            "total_revenue": total_revenue,
            "pending_payments": pending_payments,
            "course_enrollments": course_enrollments,
            "recent_transactions": paid_transactions[-10:] if paid_transactions else []
        }
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")

@admin.get("/analytics/course/{course_id}")
async def get_course_analytics(course_id: str):
    """Get analytics for a specific course"""
    try:
        # Get course enrollments
        enrollments = await db.payment_transactions.find({
            "course_id": course_id,
            "payment_status": "paid"
        }).to_list(1000)
        
        # Calculate revenue and conversion
        total_revenue = sum(e.get("amount", 0) for e in enrollments)
        total_attempts = await db.payment_transactions.count_documents({"course_id": course_id})
        
        conversion_rate = (len(enrollments) / total_attempts * 100) if total_attempts > 0 else 0
        
        # Enrollment over time (group by date)
        enrollment_timeline = {}
        for enrollment in enrollments:
            date = enrollment.get("created_at", "").split("T")[0]  # Get date part
            enrollment_timeline[date] = enrollment_timeline.get(date, 0) + 1
        
        return {
            "course_id": course_id,
            "total_enrollments": len(enrollments),
            "total_revenue": total_revenue,
            "conversion_rate": round(conversion_rate, 2),
            "enrollment_timeline": enrollment_timeline
        }
        
    except Exception as e:
        logger.error(f"Error fetching course analytics for {course_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch course analytics")