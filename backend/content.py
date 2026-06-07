"""
Content Studio — AI-Powered Content Generation

Transforms research briefs into varied content formats:
  - Newsletter articles
  - Research spotlights
  - Clinical handouts
  - Social media posts (LinkedIn, etc.)

Uses the MM™ design system and brand voice for consistent output.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import uuid
import json
import asyncio

load_dotenv()

router = APIRouter(prefix="/api/content", tags=["content"])

# MongoDB connection
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
db_name = os.environ.get("DB_NAME", "muscle_meta_matrix")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# LiteLLM for AI generation
try:
    import litellm
    litellm.set_verbose = False
    LITELLM_AVAILABLE = True
except ImportError:
    LITELLM_AVAILABLE = False


# =============================================================================
# MM™ BRAND SYSTEM PROMPT
# =============================================================================

MM_SYSTEM_PROMPT = """You are a content creator for the Muscle-Meta Matrix™ (MM™) platform.
You write for adults 45+ focused on preventing and reversing age-related muscle loss, metabolic decline, and functional decline.

## Brand Voice
- Authoritative yet accessible — backed by science, explained simply
- Empowering — focus on what readers CAN do, not fear-mongering
- Precise — use specific numbers, cite studies (PMID/DOI when available)
- Active aging positive — readers are active, engaged, seeking optimization

## 4 Pillars Framework
1. Exercise & Mobility — strength, balance, functional capacity
2. Nutrition & Metabolism — metabolic flexibility, protein optimization, gut health
3. Recovery & Resilience — sleep, stress, mitochondrial health
4. Medical & Clinical — bone health, catabolic risk, comorbidity management

## GMMBB Axis
Content should reference the relevant axes when appropriate:
- Gut — microbiome, inflammation, nutrient absorption
- Muscle — sarcopenia, mTOR, protein synthesis
- Metabolic — insulin sensitivity, fat oxidation, energy
- Brain — cognition, HPA axis, sleep architecture
- Bone — osteosarcopenia, DEXA, fracture risk

## Personas
- Rebuilder — recovering from setback, rebuilding foundation
- Active Ager — maintaining vitality, preventing decline
- Optimizer — high-performer seeking marginal gains
- Preventer — proactive about future health

## Formatting
- Use clear headings (H2, H3) for structure
- Include bullet points for key takeaways
- Bold key statistics and findings
- End with actionable recommendations
"""

# Output format templates
OUTPUT_TEMPLATES = {
    "newsletter": """
## Newsletter Format Requirements
Write a newsletter article (800-1200 words) with:
- Compelling headline using one of these patterns: "How to [X]", "[Number] Ways to [X]", "The Science of [X]"
- Include current year ({year}) in headline if timely
- Opening hook (2-3 sentences) with a surprising stat or question
- 3-5 main sections with H2 headings
- Each section should have 2-3 H3 subpoints
- Cite at least 3 research sources with PMID or DOI
- Include a "Key Takeaways" bullet list (5-7 items)
- End with "Your Action Step" — one specific thing to do this week
- Closing that invites engagement

Target persona: {persona}
Primary pillar: {pillar}
""",

    "research_spotlight": """
## Research Spotlight Format Requirements
Write a research spotlight (400-600 words) that:
- Has a clear, specific title referencing the study
- Opens with the key finding in 1-2 sentences
- "Study Details" section: population, methods, duration
- "Key Results" section: 3-5 bullet points with specific numbers
- "What This Means For You" section: practical implications
- "Clinical Considerations" section: caveats, who should be careful
- "Citation" section: full reference with PMID/DOI

Target persona: {persona}
Primary pillar: {pillar}
""",

    "clinical_handout": """
## Clinical Handout Format Requirements
Write a patient-friendly handout (300-500 words) that:
- Has a clear, simple title
- Uses plain language (8th grade reading level)
- Opens with "Why This Matters" (2-3 sentences)
- Has numbered steps or bullet points for actions
- Includes a simple table or checklist if appropriate
- "Talk To Your Provider About" section with 2-3 questions
- "Warning Signs" section if relevant
- Ends with encouragement

Target persona: {persona}
Primary pillar: {pillar}
""",

    "linkedin_post": """
## LinkedIn Post Format Requirements
Write a LinkedIn post (150-250 words) that:
- Opens with a hook line that stops scrolling
- Shares one key insight from the research
- Uses short paragraphs (1-2 sentences each)
- Includes relevant statistics
- Has a clear call-to-action or question
- Uses 3-5 relevant hashtags at the end
- Professional but conversational tone

Target persona: {persona}
Primary pillar: {pillar}
""",
}

PILLAR_NAMES = {
    "exercise_mobility": "Exercise & Mobility",
    "nutrition_metabolism": "Nutrition & Metabolism",
    "recovery_resilience": "Recovery & Resilience",
    "medical_clinical": "Medical & Clinical",
}

PERSONA_DESCRIPTIONS = {
    "rebuilder": "Rebuilder — someone recovering from injury, illness, or extended inactivity",
    "active_ager": "Active Ager — engaged adult maintaining vitality and preventing decline",
    "optimizer": "Optimizer — high-performer seeking evidence-based marginal gains",
    "preventer": "Preventer — proactive individual focused on future health",
}


# =============================================================================
# MODELS
# =============================================================================

class GenerationRequest(BaseModel):
    source_asset_id: str
    output_type: Literal["newsletter", "research_spotlight", "clinical_handout", "linkedin_post"]
    persona: Optional[str] = "active_ager"
    pillar: Optional[str] = None  # Inherit from source if not specified
    additional_instructions: Optional[str] = None
    model: Optional[str] = "gpt-4o"  # Default model


class GenerationJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_asset_id: str
    output_type: str
    status: Literal["pending", "generating", "completed", "failed"] = "pending"
    progress: int = 0
    generated_content: Optional[str] = None
    generated_asset_id: Optional[str] = None
    error: Optional[str] = None
    model_used: Optional[str] = None
    tokens_used: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class GenerationResponse(BaseModel):
    job_id: str
    status: str
    message: str


# =============================================================================
# ROUTES
# =============================================================================

@router.get("/status")
async def get_content_status():
    """Check if content generation is available."""
    return {
        "available": LITELLM_AVAILABLE,
        "models": ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022"] if LITELLM_AVAILABLE else [],
        "output_types": list(OUTPUT_TEMPLATES.keys()),
        "personas": list(PERSONA_DESCRIPTIONS.keys()),
    }


@router.post("/generate", response_model=GenerationResponse)
async def generate_content(request: GenerationRequest, background_tasks: BackgroundTasks):
    """
    Start an async content generation job.

    The generation runs in the background. Poll /jobs/{job_id} for status.
    """
    if not LITELLM_AVAILABLE:
        raise HTTPException(status_code=503, detail="LiteLLM not available. Install with: pip install litellm")

    # Fetch source asset
    source = await db.assets.find_one({"id": request.source_asset_id})
    if not source:
        raise HTTPException(status_code=404, detail="Source asset not found")

    if not source.get("content"):
        raise HTTPException(status_code=400, detail="Source asset has no text content")

    # Create job record
    job = GenerationJob(
        source_asset_id=request.source_asset_id,
        output_type=request.output_type,
        model_used=request.model,
    )
    await db.generation_jobs.insert_one(job.dict())

    # Start background generation
    background_tasks.add_task(
        _run_generation,
        job_id=job.id,
        source=source,
        output_type=request.output_type,
        persona=request.persona or "active_ager",
        pillar=request.pillar or source.get("pillar"),
        additional_instructions=request.additional_instructions,
        model=request.model or "gpt-4o",
    )

    return GenerationResponse(
        job_id=job.id,
        status="pending",
        message=f"Generation started. Poll /api/content/jobs/{job.id} for status.",
    )


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a generation job."""
    job = await db.generation_jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.pop("_id", None)
    return job


@router.get("/jobs")
async def list_jobs(limit: int = 20):
    """List recent generation jobs."""
    jobs = await db.generation_jobs.find().sort("created_at", -1).to_list(limit)
    return [_serialize(j) for j in jobs]


@router.post("/generate-sync")
async def generate_content_sync(request: GenerationRequest):
    """
    Synchronous generation — blocks until complete.
    Use for small outputs (LinkedIn posts) or when you need immediate results.
    """
    if not LITELLM_AVAILABLE:
        raise HTTPException(status_code=503, detail="LiteLLM not available")

    source = await db.assets.find_one({"id": request.source_asset_id})
    if not source:
        raise HTTPException(status_code=404, detail="Source asset not found")

    if not source.get("content"):
        raise HTTPException(status_code=400, detail="Source asset has no text content")

    try:
        result = await _generate_with_llm(
            source_content=source.get("content", ""),
            source_title=source.get("title", ""),
            source_citations=source.get("citations", []),
            output_type=request.output_type,
            persona=request.persona or "active_ager",
            pillar=request.pillar or source.get("pillar"),
            additional_instructions=request.additional_instructions,
            model=request.model or "gpt-4o",
        )

        # Optionally save as new asset
        new_asset = await _save_generated_asset(
            content=result["content"],
            source_asset=source,
            output_type=request.output_type,
        )

        return {
            "success": True,
            "content": result["content"],
            "tokens_used": result.get("tokens_used"),
            "model_used": result.get("model_used"),
            "asset_id": new_asset["id"] if new_asset else None,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# GENERATION LOGIC
# =============================================================================

async def _run_generation(
    job_id: str,
    source: dict,
    output_type: str,
    persona: str,
    pillar: str,
    additional_instructions: str,
    model: str,
):
    """Background task that runs the actual generation."""
    try:
        # Update status to generating
        await db.generation_jobs.update_one(
            {"id": job_id},
            {"$set": {"status": "generating", "progress": 10}}
        )

        # Run generation
        result = await _generate_with_llm(
            source_content=source.get("content", ""),
            source_title=source.get("title", ""),
            source_citations=source.get("citations", []),
            output_type=output_type,
            persona=persona,
            pillar=pillar,
            additional_instructions=additional_instructions,
            model=model,
        )

        await db.generation_jobs.update_one(
            {"id": job_id},
            {"$set": {"progress": 80}}
        )

        # Save as new asset
        new_asset = await _save_generated_asset(
            content=result["content"],
            source_asset=source,
            output_type=output_type,
        )

        # Mark complete
        await db.generation_jobs.update_one(
            {"id": job_id},
            {"$set": {
                "status": "completed",
                "progress": 100,
                "generated_content": result["content"],
                "generated_asset_id": new_asset["id"] if new_asset else None,
                "tokens_used": result.get("tokens_used"),
                "completed_at": datetime.utcnow(),
            }}
        )

    except Exception as e:
        await db.generation_jobs.update_one(
            {"id": job_id},
            {"$set": {
                "status": "failed",
                "error": str(e),
                "completed_at": datetime.utcnow(),
            }}
        )


async def _generate_with_llm(
    source_content: str,
    source_title: str,
    source_citations: list,
    output_type: str,
    persona: str,
    pillar: str,
    additional_instructions: str,
    model: str,
) -> dict:
    """Call LLM to generate content."""

    # Build the prompt
    year = datetime.now().year
    pillar_name = PILLAR_NAMES.get(pillar, pillar or "General")
    persona_desc = PERSONA_DESCRIPTIONS.get(persona, persona)

    template = OUTPUT_TEMPLATES.get(output_type, OUTPUT_TEMPLATES["newsletter"])
    format_instructions = template.format(
        year=year,
        persona=persona_desc,
        pillar=pillar_name,
    )

    # Format citations for context
    citations_text = ""
    if source_citations:
        citations_text = "\n\n## Available Citations from Source:\n"
        for c in source_citations[:10]:  # Limit to 10
            if c.get("pmid"):
                citations_text += f"- PMID: {c['pmid']}"
            if c.get("doi"):
                citations_text += f" | DOI: {c['doi']}"
            if c.get("title"):
                citations_text += f" — {c['title'][:100]}"
            citations_text += "\n"

    user_prompt = f"""Transform the following research content into a {output_type.replace('_', ' ')}.

## Source Title
{source_title}

## Source Content
{source_content[:8000]}
{citations_text}

{format_instructions}

{f"## Additional Instructions: {additional_instructions}" if additional_instructions else ""}

Generate the {output_type.replace('_', ' ')} now:
"""

    # Call LiteLLM
    response = await asyncio.to_thread(
        litellm.completion,
        model=model,
        messages=[
            {"role": "system", "content": MM_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=2000,
        temperature=0.7,
    )

    content = response.choices[0].message.content
    tokens = response.usage.total_tokens if response.usage else None

    return {
        "content": content,
        "tokens_used": tokens,
        "model_used": model,
    }


async def _save_generated_asset(
    content: str,
    source_asset: dict,
    output_type: str,
) -> dict:
    """Save generated content as a new asset linked to source."""

    # Derive title from first heading or source
    title_match = None
    for line in content.split("\n"):
        if line.startswith("# ") or line.startswith("## "):
            title_match = line.lstrip("#").strip()
            break

    title = title_match or f"{output_type.replace('_', ' ').title()} — {source_asset.get('title', 'Generated')}"

    asset = {
        "id": str(uuid.uuid4()),
        "title": title,
        "asset_type": output_type,
        "file_type": "md",
        "pillar": source_asset.get("pillar"),
        "pillar_name": source_asset.get("pillar_name"),
        "category_code": source_asset.get("category_code"),
        "persona": source_asset.get("persona"),
        "content": content,
        "source_asset_id": source_asset.get("id"),
        "generated": True,
        "generation_prompt": output_type,
        "citations": source_asset.get("citations", []),
        "word_count": len(content.split()),
        "status": "draft",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    await db.assets.insert_one(asset)
    return asset


def _serialize(doc: dict) -> dict:
    """Remove MongoDB _id for API responses."""
    doc.pop("_id", None)
    return doc
