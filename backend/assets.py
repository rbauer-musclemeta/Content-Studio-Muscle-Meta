"""
Asset Library Module

Manages the population of MM™ content assets across file types:
  - Text assets (md, html): content stored inline in MongoDB
  - Binary assets (pdf, video, audio): uploaded to disk, metadata in MongoDB
  - External assets: reference a URL (YouTube, Vimeo, CDN)

On upload, text-based assets are auto-parsed (mm_parser) to extract pillar,
category, persona, GMMBB axes, citations, and key findings.

Assets support lineage (source_asset_id) to model the real content workflow:
  Research Brief → Newsletter → Spotlight / Handout
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import uuid

import mm_parser

load_dotenv()

router = APIRouter(prefix="/api/assets", tags=["assets"])

# MongoDB connection
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
db_name = os.environ.get("DB_NAME", "muscle_meta_matrix")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Upload directory for binary assets
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Text-based file types stored inline; everything else stored as a file
INLINE_TYPES = {"md", "html", "text"}
TEXT_PARSEABLE = {"md", "html", "text"}

# Asset type taxonomy
ASSET_TYPES = [
    "research_brief",
    "newsletter",
    "research_spotlight",
    "clinical_handout",
    "video",
    "audio",
    "other",
]


# =============================================================================
# MODELS
# =============================================================================

class AssetCitation(BaseModel):
    pmid: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    key_findings: List[str] = []
    statistics: List[Dict[str, Any]] = []


class Asset(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    # Classification
    title: str
    asset_type: str = "other"          # research_brief, newsletter, etc.
    file_type: str = "other"           # md, html, pdf, video, audio
    pillar: Optional[str] = None       # exercise_mobility, etc.
    pillar_name: Optional[str] = None
    category_code: Optional[str] = None  # e.g., "P2-C6"
    persona: Optional[str] = None
    tags: List[str] = []

    # Content (one of these depending on storage strategy)
    content: Optional[str] = None      # inline text for md/html
    file_path: Optional[str] = None    # relative path under uploads/ for binaries
    file_name: Optional[str] = None    # original upload filename
    file_size: Optional[int] = None    # bytes
    mime_type: Optional[str] = None
    external_url: Optional[str] = None  # YouTube/Vimeo/CDN link

    # Extracted knowledge
    gmmbb_axes: List[Dict[str, Any]] = []
    citations: List[AssetCitation] = []
    key_findings: List[str] = []
    word_count: Optional[int] = None

    # Lineage / relationships
    source_asset_id: Optional[str] = None   # the brief this was derived from
    related_asset_ids: List[str] = []
    research_artifact_id: Optional[str] = None  # link to research module artifact

    # Generation metadata (for future asset generation)
    generated: bool = False
    generation_prompt: Optional[str] = None

    # Status
    status: str = "active"             # active, draft, archived
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AssetCreate(BaseModel):
    """Create a text/external asset without file upload (md/html inline or URL)."""
    title: Optional[str] = None
    asset_type: Optional[str] = None
    file_type: Optional[str] = None
    pillar: Optional[str] = None
    category_code: Optional[str] = None
    persona: Optional[str] = None
    tags: List[str] = []
    content: Optional[str] = None
    external_url: Optional[str] = None
    source_asset_id: Optional[str] = None
    related_asset_ids: List[str] = []
    auto_parse: bool = True


class AssetUpdate(BaseModel):
    title: Optional[str] = None
    asset_type: Optional[str] = None
    pillar: Optional[str] = None
    category_code: Optional[str] = None
    persona: Optional[str] = None
    tags: Optional[List[str]] = None
    content: Optional[str] = None
    external_url: Optional[str] = None
    key_findings: Optional[List[str]] = None
    citations: Optional[List[AssetCitation]] = None
    source_asset_id: Optional[str] = None
    related_asset_ids: Optional[List[str]] = None
    status: Optional[str] = None


# =============================================================================
# HELPERS
# =============================================================================

def _apply_parsed_metadata(asset_dict: dict, parsed: dict) -> dict:
    """Fill empty fields on an asset dict from parser output (don't overwrite user values)."""
    if not asset_dict.get("title"):
        asset_dict["title"] = parsed.get("title")
    if not asset_dict.get("asset_type") or asset_dict["asset_type"] == "other":
        asset_dict["asset_type"] = parsed.get("asset_type", "other")
    if not asset_dict.get("file_type") or asset_dict["file_type"] == "other":
        asset_dict["file_type"] = parsed.get("file_type", "other")
    if not asset_dict.get("pillar"):
        asset_dict["pillar"] = parsed.get("pillar")
        asset_dict["pillar_name"] = parsed.get("pillar_name")
    if not asset_dict.get("category_code"):
        asset_dict["category_code"] = parsed.get("category_code")
    if not asset_dict.get("persona"):
        asset_dict["persona"] = parsed.get("persona")
    if not asset_dict.get("gmmbb_axes"):
        asset_dict["gmmbb_axes"] = parsed.get("gmmbb_axes", [])
    if not asset_dict.get("citations"):
        asset_dict["citations"] = parsed.get("citations", [])
    if not asset_dict.get("key_findings"):
        asset_dict["key_findings"] = parsed.get("key_findings", [])
    asset_dict["word_count"] = parsed.get("word_count")
    return asset_dict


def _serialize(asset: dict) -> dict:
    """Strip Mongo _id for API responses."""
    asset.pop("_id", None)
    return asset


# =============================================================================
# ROUTES: Metadata
# =============================================================================

@router.get("/types")
async def get_asset_types():
    """Return the asset type taxonomy and supported file types."""
    return {
        "asset_types": ASSET_TYPES,
        "file_types": ["md", "html", "pdf", "video", "audio", "text", "other"],
        "inline_types": list(INLINE_TYPES),
    }


@router.get("/stats")
async def get_asset_stats():
    """Library statistics by type, pillar, and persona."""
    total = await db.assets.count_documents({})

    async def _group(field):
        pipeline = [{"$group": {"_id": f"${field}", "count": {"$sum": 1}}}]
        rows = await db.assets.aggregate(pipeline).to_list(50)
        return {(r["_id"] or "unassigned"): r["count"] for r in rows}

    by_type = await _group("asset_type")
    by_pillar = await _group("pillar")
    by_file_type = await _group("file_type")

    # Total citations across all assets
    cit_pipeline = [
        {"$project": {"n": {"$size": {"$ifNull": ["$citations", []]}}}},
        {"$group": {"_id": None, "total": {"$sum": "$n"}}},
    ]
    cit = await db.assets.aggregate(cit_pipeline).to_list(1)

    return {
        "total_assets": total,
        "total_citations": cit[0]["total"] if cit else 0,
        "by_type": by_type,
        "by_pillar": by_pillar,
        "by_file_type": by_file_type,
    }


# =============================================================================
# ROUTES: List & Get
# =============================================================================

@router.get("")
async def list_assets(
    pillar: Optional[str] = None,
    asset_type: Optional[str] = None,
    file_type: Optional[str] = None,
    persona: Optional[str] = None,
    tag: Optional[str] = None,
    source_asset_id: Optional[str] = None,
    search: Optional[str] = None,
    include_content: bool = False,
    limit: int = Query(default=100, le=500),
):
    """List assets with filtering. Content excluded by default to keep payloads small."""
    query: Dict[str, Any] = {}
    if pillar:
        query["pillar"] = pillar
    if asset_type:
        query["asset_type"] = asset_type
    if file_type:
        query["file_type"] = file_type
    if persona:
        query["persona"] = persona
    if tag:
        query["tags"] = tag
    if source_asset_id:
        query["source_asset_id"] = source_asset_id
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"key_findings": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
        ]

    projection = None if include_content else {"content": 0}
    cursor = db.assets.find(query, projection).sort("updated_at", -1)
    assets = await cursor.to_list(limit)
    return [_serialize(a) for a in assets]


@router.get("/{asset_id}")
async def get_asset(asset_id: str):
    """Get a single asset including inline content."""
    asset = await db.assets.find_one({"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return _serialize(asset)


@router.get("/{asset_id}/raw")
async def get_asset_raw(asset_id: str):
    """
    Serve the raw asset content:
      - inline md/html/text → returned as text
      - binary (pdf/video/audio) → streamed from disk
      - external → 302-style payload with the URL
    """
    asset = await db.assets.find_one({"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if asset.get("external_url"):
        return {"external_url": asset["external_url"]}

    if asset.get("content") is not None:
        media = "text/html" if asset.get("file_type") == "html" else "text/plain"
        return Response(content=asset["content"], media_type=f"{media}; charset=utf-8")

    if asset.get("file_path"):
        full = UPLOAD_DIR / asset["file_path"]
        if not full.exists():
            raise HTTPException(status_code=404, detail="File missing on disk")
        return FileResponse(
            path=str(full),
            media_type=asset.get("mime_type") or "application/octet-stream",
            filename=asset.get("file_name") or full.name,
        )

    raise HTTPException(status_code=404, detail="Asset has no content")


# =============================================================================
# ROUTES: Create (inline / external)
# =============================================================================

@router.post("", response_model=Asset)
async def create_asset(data: AssetCreate):
    """Create a text (md/html inline) or external (URL) asset."""
    asset = Asset(
        title=data.title or "Untitled Asset",
        asset_type=data.asset_type or "other",
        file_type=data.file_type or ("html" if (data.content or "").lstrip().startswith("<") else "md"),
        pillar=data.pillar,
        category_code=data.category_code,
        persona=data.persona,
        tags=data.tags,
        content=data.content,
        external_url=data.external_url,
        source_asset_id=data.source_asset_id,
        related_asset_ids=data.related_asset_ids,
    ).dict()

    # Auto-parse text content
    if data.auto_parse and data.content:
        is_html = asset["file_type"] == "html"
        parsed = mm_parser.parse_asset(data.content, asset["title"], is_html=is_html)
        asset = _apply_parsed_metadata(asset, parsed)

    await db.assets.insert_one(dict(asset))
    return Asset(**asset)


# =============================================================================
# ROUTES: Upload (binary or text file)
# =============================================================================

@router.post("/upload", response_model=Asset)
async def upload_asset(
    file: UploadFile = File(...),
    asset_type: Optional[str] = Form(None),
    pillar: Optional[str] = Form(None),
    category_code: Optional[str] = Form(None),
    persona: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # comma-separated
    source_asset_id: Optional[str] = Form(None),
    auto_parse: bool = Form(True),
):
    """
    Upload a file of any supported type.
      - md/html/text → content stored inline + auto-parsed
      - pdf/video/audio → stored on disk, metadata recorded
    """
    filename = file.filename or "upload"
    file_type = mm_parser.detect_file_type(filename)
    raw_bytes = await file.read()

    tag_list = [t.strip() for t in tags.split(",")] if tags else []

    asset = Asset(
        title=filename,
        asset_type=asset_type or "other",
        file_type=file_type,
        pillar=pillar,
        category_code=category_code,
        persona=persona,
        tags=tag_list,
        file_name=filename,
        file_size=len(raw_bytes),
        mime_type=file.content_type,
        source_asset_id=source_asset_id,
    ).dict()

    if file_type in INLINE_TYPES:
        # Store text content inline
        try:
            text = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = raw_bytes.decode("latin-1", errors="replace")
        asset["content"] = text

        if auto_parse and file_type in TEXT_PARSEABLE:
            parsed = mm_parser.parse_asset(text, filename, is_html=(file_type == "html"))
            asset = _apply_parsed_metadata(asset, parsed)
    else:
        # Store binary on disk under uploads/{asset_id}/filename
        asset_dir = UPLOAD_DIR / asset["id"]
        asset_dir.mkdir(parents=True, exist_ok=True)
        dest = asset_dir / filename
        dest.write_bytes(raw_bytes)
        asset["file_path"] = f"{asset['id']}/{filename}"

        # PDFs: attempt text extraction for parsing (best-effort)
        if file_type == "pdf" and auto_parse:
            text = _extract_pdf_text(dest)
            if text:
                parsed = mm_parser.parse_asset(text, filename, is_html=False)
                asset = _apply_parsed_metadata(asset, parsed)
                asset["asset_type"] = asset_type or parsed.get("asset_type", "research_brief")

    await db.assets.insert_one(dict(asset))
    return Asset(**asset)


# =============================================================================
# ROUTES: Update / Delete / Re-parse
# =============================================================================

@router.put("/{asset_id}")
async def update_asset(asset_id: str, data: AssetUpdate):
    existing = await db.assets.find_one({"id": asset_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Asset not found")

    update = {k: v for k, v in data.dict().items() if v is not None}
    if "citations" in update:
        update["citations"] = [
            c.dict() if hasattr(c, "dict") else c for c in update["citations"]
        ]
    update["updated_at"] = datetime.utcnow()

    await db.assets.update_one({"id": asset_id}, {"$set": update})
    updated = await db.assets.find_one({"id": asset_id})
    return _serialize(updated)


@router.post("/{asset_id}/reparse")
async def reparse_asset(asset_id: str):
    """Re-run the MM™ parser on an asset's content (overwrites extracted fields)."""
    asset = await db.assets.find_one({"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    text = asset.get("content")
    if not text and asset.get("file_path"):
        full = UPLOAD_DIR / asset["file_path"]
        if asset.get("file_type") == "pdf" and full.exists():
            text = _extract_pdf_text(full)

    if not text:
        raise HTTPException(status_code=400, detail="No parseable text content")

    parsed = mm_parser.parse_asset(
        text, asset.get("file_name") or asset["title"],
        is_html=(asset.get("file_type") == "html"),
    )
    update = {
        "pillar": parsed.get("pillar"),
        "pillar_name": parsed.get("pillar_name"),
        "category_code": parsed.get("category_code"),
        "persona": parsed.get("persona"),
        "gmmbb_axes": parsed.get("gmmbb_axes", []),
        "citations": parsed.get("citations", []),
        "key_findings": parsed.get("key_findings", []),
        "word_count": parsed.get("word_count"),
        "updated_at": datetime.utcnow(),
    }
    await db.assets.update_one({"id": asset_id}, {"$set": update})
    updated = await db.assets.find_one({"id": asset_id})
    return _serialize(updated)


@router.delete("/{asset_id}")
async def delete_asset(asset_id: str):
    asset = await db.assets.find_one({"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Remove binary from disk if present
    if asset.get("file_path"):
        full = UPLOAD_DIR / asset["file_path"]
        try:
            if full.exists():
                full.unlink()
                parent = full.parent
                if parent != UPLOAD_DIR and not any(parent.iterdir()):
                    parent.rmdir()
        except OSError:
            pass

    await db.assets.delete_one({"id": asset_id})
    return {"deleted": True}


# =============================================================================
# ROUTES: Lineage
# =============================================================================

@router.get("/{asset_id}/lineage")
async def get_lineage(asset_id: str):
    """Return the source brief and any assets derived from this one."""
    asset = await db.assets.find_one({"id": asset_id}, {"content": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    source = None
    if asset.get("source_asset_id"):
        source = await db.assets.find_one(
            {"id": asset["source_asset_id"]}, {"content": 0}
        )

    derived = await db.assets.find(
        {"source_asset_id": asset_id}, {"content": 0}
    ).to_list(100)

    return {
        "asset": _serialize(asset),
        "source": _serialize(source) if source else None,
        "derived": [_serialize(d) for d in derived],
    }


# =============================================================================
# Helpers
# =============================================================================

def _extract_pdf_text(path: Path) -> str:
    """Best-effort PDF text extraction. Returns '' if no PDF library available."""
    try:
        from pypdf import PdfReader  # type: ignore
    except ImportError:
        try:
            from PyPDF2 import PdfReader  # type: ignore
        except ImportError:
            return ""
    try:
        reader = PdfReader(str(path))
        return "\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception:
        return ""
