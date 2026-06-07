"""
Research Module — Prompt Library + Artifact Storage

Stores research prompt templates and artifacts with full citation tracking.
Supports PMID, DOI, and extracted findings (statistics, quotes, key points).
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import uuid

load_dotenv()

router = APIRouter(prefix="/api/research", tags=["research"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'muscle_meta_matrix')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]


# =============================================================================
# PILLARS & CATEGORIES (matching CLAUDE.md)
# =============================================================================

PILLARS = {
    "exercise_mobility": {
        "name": "Exercise & Mobility",
        "categories": ["strength_sarcopenia", "balance_fall_risk", "functional_capacity"]
    },
    "nutrition_metabolism": {
        "name": "Nutrition & Metabolism",
        "categories": ["metabolic_flexibility", "protein_anabolic", "gut_health"]
    },
    "recovery_resilience": {
        "name": "Recovery & Resilience",
        "categories": ["sleep_circadian", "stress_hpa", "mitochondrial_health"]
    },
    "medical_clinical": {
        "name": "Medical & Clinical",
        "categories": ["bone_health", "catabolic_risk", "comorbidity_management"]
    }
}

CATEGORIES = {
    "strength_sarcopenia": "Strength & Sarcopenia",
    "balance_fall_risk": "Balance & Fall Risk",
    "functional_capacity": "Functional Capacity",
    "metabolic_flexibility": "Metabolic Flexibility",
    "protein_anabolic": "Protein & Anabolic Signaling",
    "gut_health": "Gut Health",
    "sleep_circadian": "Sleep & Circadian",
    "stress_hpa": "Stress & HPA Axis",
    "mitochondrial_health": "Mitochondrial Health",
    "bone_health": "Bone Health",
    "catabolic_risk": "Catabolic Risk",
    "comorbidity_management": "Comorbidity Management"
}


# =============================================================================
# MODELS: Citations
# =============================================================================

class Citation(BaseModel):
    """Structured research citation with extracted findings"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    # Identifiers (at least one required)
    pmid: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None

    # Bibliographic
    title: str
    authors: List[str] = []
    journal: Optional[str] = None
    year: Optional[int] = None

    # Extracted content
    key_findings: List[str] = []
    statistics: List[Dict[str, Any]] = []  # {"metric": "...", "value": "...", "context": "..."}
    quotes: List[Dict[str, str]] = []      # {"text": "...", "page": "..."}
    methodology: Optional[str] = None
    population: Optional[str] = None       # Study population (e.g., "adults 65+, n=240")

    # Quality indicators
    study_type: Optional[str] = None       # RCT, meta-analysis, cohort, case-control, etc.
    evidence_level: Optional[str] = None   # I, II, III, IV, V

    # Internal
    notes: Optional[str] = None
    added_at: datetime = Field(default_factory=datetime.utcnow)

class CitationCreate(BaseModel):
    pmid: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    title: str
    authors: List[str] = []
    journal: Optional[str] = None
    year: Optional[int] = None
    key_findings: List[str] = []
    statistics: List[Dict[str, Any]] = []
    quotes: List[Dict[str, str]] = []
    methodology: Optional[str] = None
    population: Optional[str] = None
    study_type: Optional[str] = None
    evidence_level: Optional[str] = None
    notes: Optional[str] = None


# =============================================================================
# MODELS: Research Prompt Templates
# =============================================================================

class ResearchPromptTemplate(BaseModel):
    """Reusable research prompt template linked to pillar/category"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    # Classification
    pillar: str                            # exercise_mobility, nutrition_metabolism, etc.
    category: Optional[str] = None         # strength_sarcopenia, etc. (null = pillar-wide)

    # Content
    name: str                              # Template name (e.g., "Sarcopenia Deep Dive")
    prompt_template: str                   # The actual prompt text with {{variables}}
    variables: List[str] = []              # Variable names used in template
    default_values: Dict[str, str] = {}    # Default values for variables

    # Usage hints
    target_platform: str = "perplexity"    # perplexity, pubmed, google_scholar
    expected_output: Optional[str] = None  # What kind of response to expect

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    usage_count: int = 0

class ResearchPromptTemplateCreate(BaseModel):
    pillar: str
    category: Optional[str] = None
    name: str
    prompt_template: str
    variables: List[str] = []
    default_values: Dict[str, str] = {}
    target_platform: str = "perplexity"
    expected_output: Optional[str] = None


# =============================================================================
# MODELS: Research Artifacts
# =============================================================================

class ResearchArtifact(BaseModel):
    """Research artifact with citations and extracted knowledge"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    # Classification
    pillar: str
    category: str
    tags: List[str] = []

    # Content
    title: str
    summary: str                           # High-level summary
    research_question: Optional[str] = None

    # Source tracking
    perplexity_query: Optional[str] = None # Original query used
    notebooklm_id: Optional[str] = None    # Link to NotebookLM if synced

    # Citations
    citations: List[Citation] = []

    # Aggregated findings (across all citations)
    consolidated_findings: List[str] = []
    clinical_implications: List[str] = []

    # Assessment linkage
    related_assessments: List[str] = []    # Assessment IDs this informs
    suggested_questions: List[Dict[str, Any]] = []  # Questions this might generate

    # Status
    status: str = "draft"                  # draft, reviewed, published
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ResearchArtifactCreate(BaseModel):
    pillar: str
    category: str
    tags: List[str] = []
    title: str
    summary: str
    research_question: Optional[str] = None
    perplexity_query: Optional[str] = None
    notebooklm_id: Optional[str] = None
    citations: List[CitationCreate] = []
    consolidated_findings: List[str] = []
    clinical_implications: List[str] = []
    related_assessments: List[str] = []
    suggested_questions: List[Dict[str, Any]] = []
    status: str = "draft"


# =============================================================================
# ROUTES: Pillars & Categories
# =============================================================================

@router.get("/pillars")
async def get_pillars():
    """Get all pillars and their categories"""
    return {
        "pillars": PILLARS,
        "categories": CATEGORIES
    }


# =============================================================================
# ROUTES: Research Prompt Templates
# =============================================================================

@router.get("/prompts")
async def list_prompts(
    pillar: Optional[str] = None,
    category: Optional[str] = None
):
    """List all research prompt templates, optionally filtered"""
    query = {}
    if pillar:
        query["pillar"] = pillar
    if category:
        query["category"] = category

    prompts = await db.research_prompts.find(query).to_list(100)
    return [ResearchPromptTemplate(**p) for p in prompts]

@router.get("/prompts/{prompt_id}")
async def get_prompt(prompt_id: str):
    """Get a single prompt template"""
    prompt = await db.research_prompts.find_one({"id": prompt_id})
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return ResearchPromptTemplate(**prompt)

@router.post("/prompts", response_model=ResearchPromptTemplate)
async def create_prompt(data: ResearchPromptTemplateCreate):
    """Create a new research prompt template"""
    if data.pillar not in PILLARS:
        raise HTTPException(status_code=400, detail=f"Invalid pillar: {data.pillar}")
    if data.category and data.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {data.category}")

    prompt = ResearchPromptTemplate(**data.dict())
    await db.research_prompts.insert_one(prompt.dict())
    return prompt

@router.put("/prompts/{prompt_id}", response_model=ResearchPromptTemplate)
async def update_prompt(prompt_id: str, data: ResearchPromptTemplateCreate):
    """Update a research prompt template"""
    existing = await db.research_prompts.find_one({"id": prompt_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Prompt not found")

    update_data = data.dict()
    update_data["updated_at"] = datetime.utcnow()

    await db.research_prompts.update_one(
        {"id": prompt_id},
        {"$set": update_data}
    )

    updated = await db.research_prompts.find_one({"id": prompt_id})
    return ResearchPromptTemplate(**updated)

@router.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str):
    """Delete a research prompt template"""
    result = await db.research_prompts.delete_one({"id": prompt_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return {"deleted": True}

@router.post("/prompts/{prompt_id}/render")
async def render_prompt(prompt_id: str, variables: Dict[str, str] = {}):
    """Render a prompt template with variable substitution"""
    prompt = await db.research_prompts.find_one({"id": prompt_id})
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    template = prompt["prompt_template"]
    merged_vars = {**prompt.get("default_values", {}), **variables}

    rendered = template
    for key, value in merged_vars.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", value)

    # Increment usage count
    await db.research_prompts.update_one(
        {"id": prompt_id},
        {"$inc": {"usage_count": 1}}
    )

    return {
        "prompt_id": prompt_id,
        "rendered": rendered,
        "variables_used": merged_vars,
        "target_platform": prompt.get("target_platform", "perplexity")
    }


# =============================================================================
# ROUTES: Research Artifacts
# =============================================================================

@router.get("/artifacts")
async def list_artifacts(
    pillar: Optional[str] = None,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=200)
):
    """List research artifacts with filtering"""
    query = {}
    if pillar:
        query["pillar"] = pillar
    if category:
        query["category"] = category
    if tag:
        query["tags"] = tag
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"summary": {"$regex": search, "$options": "i"}},
            {"consolidated_findings": {"$regex": search, "$options": "i"}}
        ]

    artifacts = await db.research_artifacts.find(query).sort("updated_at", -1).to_list(limit)
    return [ResearchArtifact(**a) for a in artifacts]

@router.get("/artifacts/{artifact_id}")
async def get_artifact(artifact_id: str):
    """Get a single research artifact with full citations"""
    artifact = await db.research_artifacts.find_one({"id": artifact_id})
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return ResearchArtifact(**artifact)

@router.post("/artifacts", response_model=ResearchArtifact)
async def create_artifact(data: ResearchArtifactCreate):
    """Create a new research artifact"""
    if data.pillar not in PILLARS:
        raise HTTPException(status_code=400, detail=f"Invalid pillar: {data.pillar}")
    if data.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {data.category}")

    # Convert citation creates to citations with IDs
    citations = [Citation(**c.dict()) for c in data.citations]

    artifact_data = data.dict()
    artifact_data["citations"] = [c.dict() for c in citations]

    artifact = ResearchArtifact(**artifact_data)
    await db.research_artifacts.insert_one(artifact.dict())
    return artifact

@router.put("/artifacts/{artifact_id}", response_model=ResearchArtifact)
async def update_artifact(artifact_id: str, data: ResearchArtifactCreate):
    """Update a research artifact"""
    existing = await db.research_artifacts.find_one({"id": artifact_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Artifact not found")

    citations = [Citation(**c.dict()) for c in data.citations]

    update_data = data.dict()
    update_data["citations"] = [c.dict() for c in citations]
    update_data["updated_at"] = datetime.utcnow()

    await db.research_artifacts.update_one(
        {"id": artifact_id},
        {"$set": update_data}
    )

    updated = await db.research_artifacts.find_one({"id": artifact_id})
    return ResearchArtifact(**updated)

@router.delete("/artifacts/{artifact_id}")
async def delete_artifact(artifact_id: str):
    """Delete a research artifact"""
    result = await db.research_artifacts.delete_one({"id": artifact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return {"deleted": True}


# =============================================================================
# ROUTES: Citation Management (within artifacts)
# =============================================================================

@router.post("/artifacts/{artifact_id}/citations", response_model=Citation)
async def add_citation(artifact_id: str, data: CitationCreate):
    """Add a citation to an existing artifact"""
    artifact = await db.research_artifacts.find_one({"id": artifact_id})
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")

    citation = Citation(**data.dict())

    await db.research_artifacts.update_one(
        {"id": artifact_id},
        {
            "$push": {"citations": citation.dict()},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    return citation

@router.delete("/artifacts/{artifact_id}/citations/{citation_id}")
async def remove_citation(artifact_id: str, citation_id: str):
    """Remove a citation from an artifact"""
    result = await db.research_artifacts.update_one(
        {"id": artifact_id},
        {
            "$pull": {"citations": {"id": citation_id}},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Citation not found")

    return {"deleted": True}


# =============================================================================
# ROUTES: Search & Discovery
# =============================================================================

@router.get("/search/citations")
async def search_citations(
    pmid: Optional[str] = None,
    doi: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = Query(default=20, le=100)
):
    """Search across all citations in all artifacts"""
    pipeline = [
        {"$unwind": "$citations"},
    ]

    match_stage = {}
    if pmid:
        match_stage["citations.pmid"] = pmid
    if doi:
        match_stage["citations.doi"] = doi
    if q:
        match_stage["$or"] = [
            {"citations.title": {"$regex": q, "$options": "i"}},
            {"citations.key_findings": {"$regex": q, "$options": "i"}}
        ]

    if match_stage:
        pipeline.append({"$match": match_stage})

    pipeline.extend([
        {"$project": {
            "artifact_id": "$id",
            "artifact_title": "$title",
            "pillar": 1,
            "category": 1,
            "citation": "$citations"
        }},
        {"$limit": limit}
    ])

    results = await db.research_artifacts.aggregate(pipeline).to_list(limit)
    return results

@router.get("/stats")
async def get_research_stats():
    """Get statistics about the research library"""
    artifact_count = await db.research_artifacts.count_documents({})
    prompt_count = await db.research_prompts.count_documents({})

    # Count by pillar
    pillar_pipeline = [
        {"$group": {"_id": "$pillar", "count": {"$sum": 1}}}
    ]
    by_pillar = await db.research_artifacts.aggregate(pillar_pipeline).to_list(10)

    # Count citations
    citation_pipeline = [
        {"$project": {"citation_count": {"$size": {"$ifNull": ["$citations", []]}}}},
        {"$group": {"_id": None, "total": {"$sum": "$citation_count"}}}
    ]
    citation_result = await db.research_artifacts.aggregate(citation_pipeline).to_list(1)
    total_citations = citation_result[0]["total"] if citation_result else 0

    return {
        "total_artifacts": artifact_count,
        "total_prompts": prompt_count,
        "total_citations": total_citations,
        "by_pillar": {p["_id"]: p["count"] for p in by_pillar}
    }


# =============================================================================
# ROUTES: Seed Data (Development)
# =============================================================================

@router.post("/seed")
async def seed_sample_data():
    """Seed sample research prompts and artifacts for development"""

    # Sample prompt templates
    prompts = [
        {
            "pillar": "nutrition_metabolism",
            "category": "protein_anabolic",
            "name": "Leucine Threshold Research",
            "prompt_template": "Provide current research on leucine threshold for muscle protein synthesis in {{population}}. Focus on: 1) Optimal per-meal leucine intake (grams), 2) mTOR activation timing, 3) Anabolic resistance in {{age_group}}. Cite PMIDs for all claims.",
            "variables": ["population", "age_group"],
            "default_values": {"population": "adults over 50", "age_group": "older adults"},
            "target_platform": "perplexity",
            "expected_output": "List of studies with dosing recommendations"
        },
        {
            "pillar": "exercise_mobility",
            "category": "strength_sarcopenia",
            "name": "Sarcopenia Intervention Meta-Analysis",
            "prompt_template": "Find meta-analyses published {{year_range}} on resistance training interventions for sarcopenia. Include: effect sizes for muscle mass, strength outcomes, optimal training parameters (frequency, intensity, volume). Prioritize EWGSOP2-aligned studies. Provide DOIs.",
            "variables": ["year_range"],
            "default_values": {"year_range": "2020-2024"},
            "target_platform": "perplexity"
        },
        {
            "pillar": "medical_clinical",
            "category": "bone_health",
            "name": "Osteosarcopenia Pathophysiology",
            "prompt_template": "Research the shared pathophysiology of osteosarcopenia, focusing on: 1) Myokine-bone crosstalk, 2) NF-κB inflammatory cascade, 3) Vitamin D receptor polymorphisms. Target {{specificity}}. Include PMIDs.",
            "variables": ["specificity"],
            "default_values": {"specificity": "clinical relevance for intervention design"},
            "target_platform": "perplexity"
        }
    ]

    # Sample artifact with citations
    sample_artifact = {
        "pillar": "nutrition_metabolism",
        "category": "protein_anabolic",
        "tags": ["leucine", "mTOR", "muscle protein synthesis", "anabolic resistance"],
        "title": "Leucine Threshold in Older Adults: Evidence Synthesis",
        "summary": "Research synthesis on optimal leucine intake for overcoming anabolic resistance in adults 50+. Key finding: 2.5-3g leucine per meal triggers maximal MPS response.",
        "research_question": "What is the minimum effective leucine dose to maximize muscle protein synthesis in adults over 50?",
        "perplexity_query": "Provide current research on leucine threshold for muscle protein synthesis in adults over 50...",
        "citations": [
            {
                "pmid": "31121843",
                "doi": "10.1093/advances/nmz019",
                "title": "Dietary Protein and Muscle Mass: Translating Science to Application and Health Benefit",
                "authors": ["Phillips SM", "Chevalier S", "Leidy HJ"],
                "journal": "Advances in Nutrition",
                "year": 2019,
                "key_findings": [
                    "Older adults require ~0.4g protein/kg per meal (vs 0.24g in younger adults)",
                    "Leucine trigger for MPS: ~2.5g in older adults vs ~1.7g in young",
                    "Per-meal distribution matters more than daily total for MPS"
                ],
                "statistics": [
                    {"metric": "Leucine threshold (older)", "value": "2.5g", "context": "Minimum to trigger maximal MPS"},
                    {"metric": "Leucine threshold (young)", "value": "1.7g", "context": "For comparison"}
                ],
                "study_type": "review",
                "evidence_level": "II"
            },
            {
                "pmid": "27807480",
                "doi": "10.1007/s12603-016-0827-2",
                "title": "Protein Ingestion to Stimulate Myofibrillar Protein Synthesis Requires Greater Relative Protein Intakes in Healthy Older Versus Younger Men",
                "authors": ["Moore DR", "Churchward-Venne TA", "Witard O"],
                "journal": "J Gerontol A Biol Sci Med Sci",
                "year": 2015,
                "key_findings": [
                    "Anabolic resistance confirmed: older adults need 68% more protein per meal",
                    "Threshold shifts from 0.24 to 0.40 g/kg per meal with aging"
                ],
                "statistics": [
                    {"metric": "Protein per meal (older)", "value": "0.40 g/kg", "context": "To achieve same MPS as young"},
                    {"metric": "Relative increase needed", "value": "68%", "context": "Compared to young adults"}
                ],
                "population": "Healthy older men (n=48)",
                "study_type": "RCT",
                "evidence_level": "I"
            }
        ],
        "consolidated_findings": [
            "Older adults (50+) require ~2.5-3g leucine per meal to maximize muscle protein synthesis",
            "This represents a ~47% higher threshold compared to young adults (~1.7g)",
            "Per-meal protein distribution (0.4g/kg per meal) is more important than daily total",
            "Anabolic resistance is a consistent finding across multiple RCTs"
        ],
        "clinical_implications": [
            "Recommend leucine-rich protein sources at each meal (whey, eggs, meat, fish)",
            "Target 30-40g high-quality protein per meal for adults 50+",
            "Distribute protein evenly across 3-4 meals rather than loading at dinner"
        ],
        "status": "reviewed"
    }

    # Insert prompts
    for p in prompts:
        prompt = ResearchPromptTemplate(**p)
        existing = await db.research_prompts.find_one({"name": p["name"]})
        if not existing:
            await db.research_prompts.insert_one(prompt.dict())

    # Insert artifact
    artifact_data = sample_artifact.copy()
    artifact_data["citations"] = [Citation(**c).dict() for c in sample_artifact["citations"]]
    artifact = ResearchArtifact(**artifact_data)
    existing = await db.research_artifacts.find_one({"title": sample_artifact["title"]})
    if not existing:
        await db.research_artifacts.insert_one(artifact.dict())

    return {
        "seeded": True,
        "prompts_added": len(prompts),
        "artifacts_added": 1
    }
