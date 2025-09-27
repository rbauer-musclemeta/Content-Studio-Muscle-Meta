#!/usr/bin/env python3
"""
Seed script to create the Pickleball 3P System course
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid

# Add the backend directory to the path
sys.path.append('/app/backend')

async def create_pickleball_course():
    """Create the complete Pickleball 3P System course"""
    
    # Database connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Course data
    course_data = {
        "id": "pickleball-3p-system",
        "title": "The Science Behind the 3P System",
        "subtitle": "Preparation, Prevention, and Performance for Pickleball Excellence",
        "instructor": "Randy Bauer, PT",
        "description": "Revolutionary Evidence-Based Approach to Pickleball Training. This comprehensive framework addresses the sport's unique challenges through three interconnected pillars, built on cutting-edge research in muscle-metabolic health, injury prevention science, and performance optimization.",
        "price": 197.00,
        "original_price": 297.00,
        "duration": "4 modules",
        "lessons": 16,
        "level": "All Levels",
        "featured": True,
        "pillars": ["Movement", "Performance", "Prevention"],
        "modules": [
            {
                "id": "module-1",
                "week": 1,
                "title": "Foundation Assessment & The Muscle-Meta Matrix",
                "subtitle": "Master the comprehensive assessment framework and understand the four pillars of muscle-metabolic health",
                "description": "Learn to conduct comprehensive self-assessments including grip strength, balance testing, functional movement screening, and metabolic flexibility evaluation. Deep dive into the 4-Pillar Muscle-Meta Matrix Framework and create your personalized training roadmap.",
                "lessons": [
                    {
                        "id": "lesson-1-1",
                        "title": "Complete Movement & Fitness Assessment",
                        "content": "Learn to conduct comprehensive self-assessments including grip strength, balance testing, functional movement screening, and metabolic flexibility evaluation",
                        "duration": "25 min",
                        "type": "video",
                        "preview": True,
                        "interactive": True,
                        "htmlContent": """
                        <div class="assessment-checklist">
                            <h4>Self-Assessment Checklist</h4>
                            <ul class="checklist">
                                <li><input type="checkbox"> Grip Strength Test</li>
                                <li><input type="checkbox"> Balance Assessment</li>
                                <li><input type="checkbox"> Functional Movement Screen</li>
                                <li><input type="checkbox"> Metabolic Flexibility Test</li>
                            </ul>
                        </div>
                        """
                    },
                    {
                        "id": "lesson-1-2",
                        "title": "The 4-Pillar Muscle-Meta Matrix Framework",
                        "content": "Deep dive into Exercise & Movement, Nutrition & Metabolism, Recovery & Stress, and Balance & Brain Health pillars",
                        "duration": "30 min",
                        "type": "video",
                        "preview": False,
                        "interactive": True
                    },
                    {
                        "id": "lesson-1-3",
                        "title": "Risk Stratification & Tier Classification",
                        "content": "Understand the Foundation Builder, Game Ready, and Elite Ready classification system and determine your starting point",
                        "duration": "20 min",
                        "type": "interactive",
                        "preview": False,
                        "interactive": True
                    },
                    {
                        "id": "lesson-1-4",
                        "title": "Personal Foundation Blueprint Creation",
                        "content": "Create your personalized training roadmap based on assessment results and tier classification",
                        "duration": "15 min",
                        "type": "pdf",
                        "preview": False,
                        "interactive": True
                    }
                ],
                "resources": [
                    {"name": "Assessment Workbook", "type": "pdf"},
                    {"name": "Movement Screening Checklist", "type": "pdf"}
                ]
            },
            {
                "id": "module-2",
                "week": 2,
                "title": "PREPARATION - Building Your Pickleball Foundation",
                "subtitle": "4-6 week systematic preparation protocols for injury-resistant play and optimal performance readiness",
                "description": "Restore pickleball-specific joint mobility and master fundamental movement patterns before high-intensity play. Build posterior chain strength, core stability, and movement competency using progressive loading principles.",
                "lessons": [
                    {
                        "id": "lesson-2-1",
                        "title": "Joint Mobility & Movement Pattern Mastery",
                        "content": "Restore pickleball-specific joint mobility and master fundamental movement patterns before high-intensity play",
                        "duration": "35 min",
                        "type": "video",
                        "preview": False,
                        "interactive": True
                    },
                    {
                        "id": "lesson-2-2",
                        "title": "Strength Foundation Development",
                        "content": "Build posterior chain strength, core stability, and movement competency using progressive loading principles",
                        "duration": "40 min",
                        "type": "video",
                        "preview": False,
                        "interactive": True
                    },
                    {
                        "id": "lesson-2-3",
                        "title": "VILPA Integration & Metabolic Base Building",
                        "content": "Integrate 4-minute daily VILPA protocols and build cardiovascular base using evidence-based movement snacks",
                        "duration": "20 min",
                        "type": "interactive",
                        "preview": False,
                        "interactive": True
                    },
                    {
                        "id": "lesson-2-4",
                        "title": "Progressive Loading Toward Sport Participation",
                        "content": "Systematic progression from foundation movements to sport-specific demands over 4-6 week timeline",
                        "duration": "25 min",
                        "type": "video",
                        "preview": False,
                        "interactive": True
                    }
                ],
                "resources": [
                    {"name": "Foundation Training Guide", "type": "pdf"},
                    {"name": "VILPA Activity Progressions", "type": "pdf"}
                ]
            },
            {
                "id": "module-3",
                "week": 3,
                "title": "PREVENTION - Your Insurance Policy",
                "subtitle": "Smart load management and movement quality protocols for documented 70% injury reduction",
                "description": "Ongoing screening protocols to identify movement limitations and injury risk factors before they cause problems. Balance training stress with recovery capacity using evidence-based monitoring.",
                "lessons": [
                    {
                        "id": "lesson-3-1",
                        "title": "Risk Screening & Movement Quality Assessment",
                        "content": "Ongoing screening protocols to identify movement limitations and injury risk factors before they cause problems",
                        "duration": "30 min",
                        "type": "video",
                        "preview": False,
                        "interactive": True
                    },
                    {
                        "id": "lesson-3-2",
                        "title": "Load Management & Recovery Protocols",
                        "content": "Balance training stress with recovery capacity using heart rate variability and subjective wellness monitoring",
                        "duration": "25 min",
                        "type": "interactive",
                        "preview": False,
                        "interactive": True
                    },
                    {
                        "id": "lesson-3-3",
                        "title": "Pre-Play Preparation Routines",
                        "content": "Dynamic warm-up sequences, activation exercises, and court-ready preparation protocols",
                        "duration": "20 min",
                        "type": "video",
                        "preview": False,
                        "interactive": True
                    },
                    {
                        "id": "lesson-3-4",
                        "title": "Environmental & Equipment Optimization",
                        "content": "Equipment selection, court surface considerations, and environmental modifications for injury prevention",
                        "duration": "15 min",
                        "type": "text",
                        "preview": False,
                        "interactive": True
                    }
                ],
                "resources": [
                    {"name": "Prevention Protocol Handbook", "type": "pdf"},
                    {"name": "Load Management Tracker", "type": "pdf"}
                ]
            },
            {
                "id": "module-4",
                "week": 4,
                "title": "PERFORMANCE - Optimizing Your Game",
                "subtitle": "Sport-specific training protocols for 25-40% performance improvement and competitive excellence",
                "description": "Plyometric training, explosive strength development, and power transfer for enhanced shot-making ability. Unpredictable stimulus-response training and competition preparation protocols.",
                "lessons": [
                    {
                        "id": "lesson-4-1",
                        "title": "Power Development & Explosive Training",
                        "content": "Plyometric training, explosive strength development, and power transfer for enhanced shot-making ability",
                        "duration": "35 min",
                        "type": "video",
                        "preview": False,
                        "interactive": True
                    },
                    {
                        "id": "lesson-4-2",
                        "title": "Reactive Agility & Court Movement",
                        "content": "Unpredictable stimulus-response training, court positioning, and movement efficiency optimization",
                        "duration": "30 min",
                        "type": "video",
                        "preview": False,
                        "interactive": True
                    },
                    {
                        "id": "lesson-4-3",
                        "title": "Endurance Integration & Energy Systems",
                        "content": "Aerobic capacity building, anaerobic power development, and energy system integration for sustained performance",
                        "duration": "25 min",
                        "type": "interactive",
                        "preview": False,
                        "interactive": True
                    },
                    {
                        "id": "lesson-4-4",
                        "title": "Competition Preparation & Peak Performance",
                        "content": "Tournament preparation, competition simulation, and peak performance maintenance strategies",
                        "duration": "20 min",
                        "type": "video",
                        "preview": False,
                        "interactive": True
                    }
                ],
                "resources": [
                    {"name": "Performance Training Manual", "type": "pdf"},
                    {"name": "Competition Readiness Checklist", "type": "pdf"}
                ]
            }
        ],
        "stats": {
            "injury_reduction": "70%",
            "performance_improvement": "25-40%",
            "annual_injury_rate": "68.5%",
            "average_injury_cost": "$2,400"
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert the course
    try:
        # Check if course already exists
        existing_course = await db.courses.find_one({"id": course_data["id"]})
        if existing_course:
            # Update existing course
            await db.courses.update_one(
                {"id": course_data["id"]},
                {"$set": course_data}
            )
            print(f"✅ Updated existing Pickleball course: {course_data['title']}")
        else:
            # Insert new course
            await db.courses.insert_one(course_data)
            print(f"✅ Created new Pickleball course: {course_data['title']}")
        
        print(f"   - Instructor: {course_data['instructor']}")
        print(f"   - Price: ${course_data['price']}")
        print(f"   - Modules: {len(course_data['modules'])}")
        print(f"   - Total Lessons: {course_data['lessons']}")
        
    except Exception as e:
        print(f"❌ Error creating course: {e}")
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_pickleball_course())