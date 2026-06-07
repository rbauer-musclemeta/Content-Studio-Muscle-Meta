"""
MM™ Asset Parser

Extracts structured metadata from Muscle-Meta Matrix content assets
(research briefs, newsletters, spotlights, handouts) regardless of file type.

The MM™ content format embeds metadata in headers:
  - Pillar code (P1-P4) and name
  - Category code (C1-C12) and label
  - Persona (Rebuilder, Active Ager, etc.)
  - GMMBB axis weighting
  - Citations (PMIDs, DOIs) inline and in appendix tables

This parser is heuristic and best-effort — it auto-populates fields on upload,
which the user can then refine in the Asset Library UI.
"""

import re
from typing import Dict, List, Optional, Any

# ---------------------------------------------------------------------------
# Pillar mapping (P1-P4 → canonical pillar key + name)
# ---------------------------------------------------------------------------

PILLAR_CODE_MAP = {
    "1": ("exercise_mobility", "Exercise & Mobility"),
    "2": ("nutrition_metabolism", "Nutrition & Metabolism"),
    "3": ("recovery_resilience", "Recovery & Resilience"),
    "4": ("medical_clinical", "Medical & Clinical"),
}

# Pillar names sometimes appear spelled out
PILLAR_NAME_PATTERNS = [
    (r"exercise\s*&?\s*mobility", "exercise_mobility"),
    (r"nutrition\s*&?\s*metabolism", "nutrition_metabolism"),
    (r"recovery\s*&?\s*(stress|resilience)", "recovery_resilience"),
    (r"(medical\s*&?\s*clinical|balance\s*&?\s*brain)", "medical_clinical"),
]

# ---------------------------------------------------------------------------
# Regex patterns
# ---------------------------------------------------------------------------

PMID_RE = re.compile(r"PMID:?\s*(\d{6,9})", re.IGNORECASE)
DOI_RE = re.compile(r"\b(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+)")
PCODE_RE = re.compile(r"\bP\s*0?([1-4])\s*[·\-–]\s*C\s*0?(\d{1,2})\b", re.IGNORECASE)
PILLAR_NUM_RE = re.compile(r"Pillar\s*0?([1-4])", re.IGNORECASE)
CATEGORY_CODE_RE = re.compile(r"\bC\s*0?(\d{1,2})\b")
MD_LINK_RE = re.compile(r"\[([^\]]+)\]\((https?://[^\s)]+)\)")

GMMBB_AXES = ["Gut", "Muscle", "Metabolic", "Brain", "Bone"]

# URL path segments that publishers append after the DOI (not part of the DOI)
DOI_TRAILING_RE = re.compile(r"/(full|abstract|meta|pdf|html|epdf|short)/?$", re.IGNORECASE)


def normalize_doi(doi: str) -> str:
    """Strip trailing punctuation and publisher URL segments from a DOI."""
    doi = doi.rstrip(".,);]>")
    doi = DOI_TRAILING_RE.sub("", doi)
    return doi.rstrip("/")

PERSONA_RE = re.compile(
    r"(?:Persona(?:\s*Lens)?\s*:?\s*|)\b(Rebuilder|Active\s*Ager|Optimizer|Preventer|"
    r"Warrior|Survivor|Athlete|Caregiver)\b",
    re.IGNORECASE,
)


def strip_html(text: str) -> str:
    """Remove HTML tags and collapse whitespace for text-based parsing."""
    # Drop script/style blocks entirely
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    # Decode a few common entities
    for ent, char in [("&amp;", "&"), ("&nbsp;", " "), ("&lt;", "<"),
                      ("&gt;", ">"), ("&quot;", '"'), ("&#39;", "'")]:
        text = text.replace(ent, char)
    return re.sub(r"\s+", " ", text).strip()


def detect_file_type(filename: str) -> str:
    """Infer file_type from extension."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    mapping = {
        "md": "md", "markdown": "md",
        "html": "html", "htm": "html",
        "pdf": "pdf",
        "mp4": "video", "mov": "video", "webm": "video", "m4v": "video",
        "mp3": "audio", "wav": "audio", "m4a": "audio", "aac": "audio",
        "txt": "text",
    }
    return mapping.get(ext, ext or "other")


def detect_asset_type(filename: str, content: str = "") -> str:
    """Infer the MM™ asset_type from filename first, then content cues."""
    name = filename.lower()
    head = content[:2000].lower()

    # Filename is the strongest signal — check it before content
    if "spotlight" in name:
        return "research_spotlight"
    if "handout" in name or "guide" in name:
        return "clinical_handout"
    if "newsletter" in name:
        return "newsletter"
    if "brief" in name:
        return "research_brief"

    # Then content cues (order matters: specific before generic)
    if "research spotlight" in head:
        return "research_spotlight"
    if "clinical handout" in head or "food guide" in head:
        return "clinical_handout"
    if "research brief" in head:
        return "research_brief"
    if "newsletter" in head:
        return "newsletter"

    ftype = detect_file_type(filename)
    if ftype == "video":
        return "video"
    if ftype == "audio":
        return "audio"
    return "other"


def extract_pillar(text: str) -> Dict[str, Optional[str]]:
    """Extract pillar key + name from content."""
    # Try "Pillar 0X" first
    m = PILLAR_NUM_RE.search(text)
    if m:
        key, name = PILLAR_CODE_MAP.get(m.group(1), (None, None))
        if key:
            return {"pillar": key, "pillar_name": name}

    # Try "P2-C6" code
    m = PCODE_RE.search(text)
    if m:
        key, name = PILLAR_CODE_MAP.get(m.group(1), (None, None))
        if key:
            return {"pillar": key, "pillar_name": name}

    # Fall back to spelled-out pillar name
    lower = text.lower()
    for pattern, key in PILLAR_NAME_PATTERNS:
        if re.search(pattern, lower):
            return {"pillar": key, "pillar_name": dict(
                (v[0], v[1]) for v in PILLAR_CODE_MAP.values()
            ).get(key, key)}

    return {"pillar": None, "pillar_name": None}


def extract_category_code(text: str) -> Optional[str]:
    """Extract the P#-C# category code (e.g., 'P2-C6')."""
    m = PCODE_RE.search(text)
    if m:
        return f"P{m.group(1)}-C{m.group(2)}"
    return None


def extract_persona(text: str) -> Optional[str]:
    m = PERSONA_RE.search(text)
    if m:
        # Normalize spacing/casing
        return re.sub(r"\s+", " ", m.group(1)).title()
    return None


def extract_gmmbb(text: str) -> List[Dict[str, Any]]:
    """
    Extract GMMBB axis weighting, e.g.:
      'GMMBB Axis: Metabolic (20%) + Muscle (25%)'
      'Primary GMMBB Axis: Muscle | Secondary Axis: Gut'
    """
    axes: List[Dict[str, Any]] = []
    # Look within a GMMBB context window
    ctx_match = re.search(r"GMMBB[^\n]{0,160}", text, re.IGNORECASE)
    window = ctx_match.group(0) if ctx_match else ""
    if not window:
        return axes

    for axis in GMMBB_AXES:
        pat = re.compile(rf"\b{axis}\b\s*\(?\s*(\d{{1,3}})?\s*%?\)?", re.IGNORECASE)
        m = pat.search(window)
        if m:
            weight = int(m.group(1)) if m.group(1) else None
            axes.append({"axis": axis, "weight": weight})
    return axes


def extract_citations(text: str, max_citations: int = 60, is_html: bool = False) -> List[Dict[str, Any]]:
    """
    Extract citations by collecting all PMIDs and DOIs and attaching the best
    available title/context (from markdown link text or surrounding line).
    """
    citations: Dict[str, Dict[str, Any]] = {}

    def _title(s: str) -> str:
        return _clean_label(strip_html(s) if is_html else s)

    # 1. Markdown links that point at pubmed/doi or mention PMID/DOI
    for label, url in MD_LINK_RE.findall(text):
        pmid = None
        doi = None
        pm = PMID_RE.search(label + " " + url)
        if pm:
            pmid = pm.group(1)
        dm = DOI_RE.search(url) or DOI_RE.search(label)
        if dm:
            doi = normalize_doi(dm.group(1))
        pubmed_in_url = "pubmed" in url.lower() or "ncbi.nlm" in url.lower()
        if not pmid and pubmed_in_url:
            um = re.search(r"/(\d{6,9})/?", url)
            if um:
                pmid = um.group(1)
        if pmid or doi:
            key = pmid or doi
            citations.setdefault(key, {
                "pmid": pmid, "doi": doi, "url": url,
                "title": _title(label), "key_findings": [], "statistics": [],
            })

    # 2. Bare PMIDs anywhere (attach line context as title if not already captured)
    for m in PMID_RE.finditer(text):
        pmid = m.group(1)
        if pmid not in citations:
            citations[pmid] = {
                "pmid": pmid, "doi": None, "url": None,
                "title": _line_context(text, m.start(), is_html), "key_findings": [], "statistics": [],
            }

    # 3. Bare DOIs anywhere
    for m in DOI_RE.finditer(text):
        doi = normalize_doi(m.group(1))
        if doi not in citations and not any(c.get("doi") == doi for c in citations.values()):
            citations[doi] = {
                "pmid": None, "doi": doi, "url": None,
                "title": _line_context(text, m.start(), is_html), "key_findings": [], "statistics": [],
            }

    return list(citations.values())[:max_citations]


def extract_executive_summary(text: str) -> List[str]:
    """Pull bullet points from an Executive Summary section as key findings."""
    m = re.search(
        r"(?:#+\s*)?EXECUTIVE\s+SUMMARY\s*(.*?)(?:\n#{1,3}\s|\n\*\*\*|\Z)",
        text, re.IGNORECASE | re.DOTALL,
    )
    if not m:
        return []
    body = m.group(1)
    findings = []
    for line in body.splitlines():
        line = line.strip()
        # Markdown bullets or numbered list items
        bullet = re.match(r"^(?:[-*]|\d+\.)\s+(.*)", line)
        if bullet:
            clean = _clean_label(bullet.group(1))
            clean = re.sub(r"\[\^?\d+\]", "", clean).strip()  # drop footnote markers
            if len(clean) > 20:
                findings.append(clean)
    return findings[:8]


def extract_title(text: str, filename: str) -> str:
    """Use the first markdown H1 or the filename as the title."""
    m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    if m:
        return _clean_label(m.group(1))
    # HTML <title>
    m = re.search(r"<title>(.*?)</title>", text, re.IGNORECASE | re.DOTALL)
    if m:
        return _clean_label(m.group(1))
    # Fall back to filename without extension
    base = filename.rsplit(".", 1)[0]
    return re.sub(r"[_\-]+", " ", base).strip()


def parse_asset(content: str, filename: str, is_html: bool = False) -> Dict[str, Any]:
    """
    Main entry point. Returns a metadata dict to populate an Asset record.

    For HTML, parse against both the raw (for <title>, links) and stripped text.
    """
    raw = content or ""
    text = strip_html(raw) if is_html else raw

    # Citations: scan raw (markdown links / hrefs preserved in raw HTML)
    pillar_info = extract_pillar(text)

    return {
        "title": extract_title(raw, filename),
        "file_type": detect_file_type(filename),
        "asset_type": detect_asset_type(filename, text),
        "pillar": pillar_info["pillar"],
        "pillar_name": pillar_info["pillar_name"],
        "category_code": extract_category_code(text),
        "persona": extract_persona(text),
        "gmmbb_axes": extract_gmmbb(text),
        "citations": extract_citations(raw, is_html=is_html),
        "key_findings": extract_executive_summary(text),
        "word_count": len(text.split()),
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clean_label(label: str) -> str:
    """Strip markdown emphasis and excess whitespace from a label."""
    label = re.sub(r"[*_`#]+", "", label)
    label = re.sub(r"\s+", " ", label)
    return label.strip()[:300]


def _line_context(text: str, pos: int, is_html: bool = False) -> str:
    """Return the line containing the given character position, cleaned."""
    start = text.rfind("\n", 0, pos) + 1
    end = text.find("\n", pos)
    if end == -1:
        end = len(text)
    line = text[start:end]
    if is_html:
        line = strip_html(line)
    line = re.sub(r"\[\^?\d+\]", "", line)
    return _clean_label(line)
