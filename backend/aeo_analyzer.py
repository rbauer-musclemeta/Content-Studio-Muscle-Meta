"""
AEO (Answer Engine Optimization) Analyzer

Scores content against 2026 AEO best practices for AI citation readiness.
Based on the AEO Strategic Briefing — key factors:

1. Heading structure: Deep hierarchy (H3/H4), optimal H2 count (7-15)
2. Title patterns: "Best [X]", "X vs Y", "How to", "What is [X]"
3. Keyword placement: Target keyword in H1/title + current year
4. Content structuring: Schema readiness, FAQ format, clear sections
5. Authority signals: Citations, statistics, expert quotes
"""

import re
from typing import Dict, List, Any, Optional
from datetime import datetime

CURRENT_YEAR = str(datetime.now().year)


def analyze_aeo(
    content: str,
    title: str = "",
    target_keywords: Optional[List[str]] = None,
    is_html: bool = False,
) -> Dict[str, Any]:
    """
    Analyze content for AEO readiness. Returns scores and recommendations.
    """
    text = _strip_html(content) if is_html else content
    raw = content

    heading_analysis = _analyze_headings(raw, is_html)
    title_analysis = _analyze_title(title, target_keywords)
    structure_analysis = _analyze_structure(text, raw, is_html)
    authority_analysis = _analyze_authority(text)

    overall = (
        heading_analysis["score"] * 0.30 +
        title_analysis["score"] * 0.25 +
        structure_analysis["score"] * 0.25 +
        authority_analysis["score"] * 0.20
    )

    recommendations = _generate_recommendations(
        heading_analysis, title_analysis, structure_analysis, authority_analysis
    )

    platform_fit = _assess_platform_fit(title, text, heading_analysis)

    return {
        "overall_score": round(overall),
        "heading_score": heading_analysis,
        "title_score": title_analysis,
        "structure_score": structure_analysis,
        "authority_score": authority_analysis,
        "recommendations": recommendations,
        "platform_fit": platform_fit,
        "target_keywords": target_keywords or [],
    }


def _analyze_headings(content: str, is_html: bool) -> Dict[str, Any]:
    """Analyze heading structure for AI readability."""
    if is_html:
        h1s = len(re.findall(r"<h1[^>]*>", content, re.IGNORECASE))
        h2s = len(re.findall(r"<h2[^>]*>", content, re.IGNORECASE))
        h3s = len(re.findall(r"<h3[^>]*>", content, re.IGNORECASE))
        h4s = len(re.findall(r"<h4[^>]*>", content, re.IGNORECASE))
    else:
        lines = content.split("\n")
        h1s = sum(1 for l in lines if re.match(r"^#\s+[^#]", l))
        h2s = sum(1 for l in lines if re.match(r"^##\s+[^#]", l))
        h3s = sum(1 for l in lines if re.match(r"^###\s+[^#]", l))
        h4s = sum(1 for l in lines if re.match(r"^####\s+", l))

    score = 0
    notes = []

    if h1s == 1:
        score += 20
        notes.append("Single H1: Good")
    elif h1s == 0:
        notes.append("Missing H1: Add a main heading")
    else:
        score += 10
        notes.append(f"Multiple H1s ({h1s}): Consider reducing to 1")

    if 7 <= h2s <= 15:
        score += 40
        notes.append(f"H2 count ({h2s}): Optimal range")
    elif 4 <= h2s < 7:
        score += 25
        notes.append(f"H2 count ({h2s}): Add more sections (7-15 optimal)")
    elif h2s > 15:
        score += 30
        notes.append(f"H2 count ({h2s}): Consider consolidating (7-15 optimal)")
    elif h2s > 0:
        score += 15
        notes.append(f"H2 count ({h2s}): Too few sections for AI parsing")
    else:
        notes.append("No H2s: Add section headings")

    depth_count = h3s + h4s
    if depth_count >= 5:
        score += 40
        notes.append(f"Deep structure ({h3s} H3s, {h4s} H4s): Excellent")
    elif depth_count >= 2:
        score += 25
        notes.append(f"Some depth ({h3s} H3s, {h4s} H4s): Add more H3/H4s")
    else:
        notes.append("Flat structure: Add H3/H4 subheadings for AI parsing")

    return {
        "score": score,
        "h1_count": h1s,
        "h2_count": h2s,
        "h3_count": h3s,
        "h4_count": h4s,
        "notes": notes,
    }


def _analyze_title(title: str, keywords: Optional[List[str]]) -> Dict[str, Any]:
    """Analyze title for AEO patterns and keyword inclusion."""
    score = 0
    pattern = None
    notes = []
    lower = title.lower()

    if re.match(r"^(best|top)\s+\d*\s*", lower):
        pattern = "best_list"
        score += 30
        notes.append("'Best/Top X' pattern: Strong for Google AI Overview, Perplexity")
    elif " vs " in lower or " versus " in lower:
        pattern = "comparison"
        score += 30
        notes.append("Comparison pattern: Strong for ChatGPT, SearchGPT, Gemini")
    elif re.match(r"^(how to|guide|tutorial)", lower):
        pattern = "how_to"
        score += 25
        notes.append("How-to pattern: Strong for Google AI Overview")
    elif re.match(r"^what (is|are) ", lower):
        pattern = "definition"
        score += 25
        notes.append("Definition pattern: Cited across all engines")
    else:
        score += 10
        notes.append("No AEO title pattern detected")

    if CURRENT_YEAR in title:
        score += 25
        notes.append(f"Current year ({CURRENT_YEAR}): Boosts freshness signal")
    elif re.search(r"20\d{2}", title):
        score += 10
        notes.append("Year present but not current: Update to " + CURRENT_YEAR)
    else:
        notes.append(f"Add current year ({CURRENT_YEAR}) for freshness signal")

    keyword_found = False
    if keywords:
        for kw in keywords:
            if kw.lower() in lower:
                keyword_found = True
                score += 25
                notes.append(f"Target keyword '{kw}' in title: Good")
                break
        if not keyword_found:
            notes.append("Target keyword not in title: Add primary keyword")
    else:
        score += 10

    tlen = len(title)
    if 50 <= tlen <= 70:
        score += 20
        notes.append(f"Title length ({tlen}): Optimal for SERP")
    elif 30 <= tlen < 50:
        score += 10
        notes.append(f"Title length ({tlen}): Consider expanding to 50-70 chars")
    elif tlen > 70:
        score += 10
        notes.append(f"Title length ({tlen}): May truncate in SERPs")

    return {
        "score": min(score, 100),
        "pattern": pattern,
        "has_year": CURRENT_YEAR in title,
        "has_keyword": keyword_found,
        "length": tlen,
        "notes": notes,
    }


def _analyze_structure(text: str, raw: str, is_html: bool) -> Dict[str, Any]:
    """Analyze content structure for machine readability."""
    score = 0
    notes = []

    faq_patterns = [
        r"<(div|section)[^>]*class=\"[^\"]*faq",
        r"\"@type\":\s*\"FAQPage\"",
        r"<details[^>]*>",
        r"##\s*(FAQ|Frequently Asked)",
        r"\?\s*\n+[A-Z]",
    ]
    has_faq = any(re.search(p, raw, re.IGNORECASE) for p in faq_patterns)
    if has_faq:
        score += 25
        notes.append("FAQ structure detected: Strong for voice/AI search")
    else:
        notes.append("No FAQ section: Consider adding Q&A format")

    schema_patterns = [
        r"<script[^>]*type=\"application/ld\+json\"",
        r"itemtype=\"https?://schema\.org",
        r"\"@context\":\s*\"https?://schema\.org",
    ]
    has_schema = any(re.search(p, raw, re.IGNORECASE) for p in schema_patterns)
    if has_schema:
        score += 25
        notes.append("Schema markup present: AI engines can parse structured data")
    elif is_html:
        notes.append("No schema markup: Add JSON-LD for Article/FAQPage")

    bullet_count = len(re.findall(r"(?:^|\n)\s*[-*•]\s+\w", text))
    numbered_count = len(re.findall(r"(?:^|\n)\s*\d+\.\s+\w", text))
    list_count = bullet_count + numbered_count
    if list_count >= 10:
        score += 25
        notes.append(f"Rich list content ({list_count} items): AI-friendly")
    elif list_count >= 3:
        score += 15
        notes.append(f"Some lists ({list_count} items): Add more for AI parsing")
    else:
        notes.append("Few or no lists: Add bullet/numbered lists")

    table_count = len(re.findall(r"<table|^\|[^|]+\|", raw, re.IGNORECASE | re.MULTILINE))
    if table_count >= 1:
        score += 15
        notes.append(f"Tables present ({table_count}): Good for comparison queries")

    words = len(text.split())
    if 1500 <= words <= 3000:
        score += 10
        notes.append(f"Word count ({words}): Optimal for depth")
    elif words >= 800:
        score += 5
        notes.append(f"Word count ({words}): Consider expanding for depth")
    else:
        notes.append(f"Word count ({words}): May be too brief for AI citation")

    return {
        "score": min(score, 100),
        "has_faq": has_faq,
        "has_schema": has_schema,
        "list_count": list_count,
        "table_count": table_count,
        "word_count": words,
        "notes": notes,
    }


def _analyze_authority(text: str) -> Dict[str, Any]:
    """Analyze authority signals: citations, statistics, expert voices."""
    score = 0
    notes = []

    pmids = len(re.findall(r"PMID:?\s*\d{6,9}", text, re.IGNORECASE))
    dois = len(re.findall(r"10\.\d{4,}/[^\s]+", text))
    citations = pmids + dois
    if citations >= 10:
        score += 35
        notes.append(f"Strong citation base ({citations}): High authority signal")
    elif citations >= 3:
        score += 25
        notes.append(f"Some citations ({citations}): Add more research backing")
    elif citations >= 1:
        score += 15
        notes.append(f"Few citations ({citations}): Needs more research support")
    else:
        notes.append("No citations: Add PMID/DOI references for authority")

    stat_patterns = [
        r"\d+(?:\.\d+)?%",
        r"\d+(?:,\d{3})+",
        r"(?:increased|decreased|reduced|improved)\s+by\s+\d+",
        r"\d+x\s+(?:more|less|higher|lower)",
    ]
    stats = sum(len(re.findall(p, text, re.IGNORECASE)) for p in stat_patterns)
    if stats >= 10:
        score += 25
        notes.append(f"Rich statistics ({stats}): Strong factual grounding")
    elif stats >= 3:
        score += 15
        notes.append(f"Some statistics ({stats}): Add more data points")
    else:
        notes.append("Few statistics: Add data/percentages for credibility")

    quote_patterns = [
        r"(?:according to|says|explains|notes)\s+(?:Dr\.|Professor|[A-Z][a-z]+\s+[A-Z])",
        r"\"[^\"]{20,}\"",
        r"'[^']{20,}'",
    ]
    has_quotes = any(re.search(p, text) for p in quote_patterns)
    if has_quotes:
        score += 20
        notes.append("Expert voices/quotes: Practitioner authority signal")
    else:
        notes.append("No expert quotes: Consider adding practitioner perspectives")

    high_evidence = [
        r"meta-analysis", r"systematic review", r"randomized controlled",
        r"cohort study", r"clinical trial",
    ]
    evidence_count = sum(1 for p in high_evidence if re.search(p, text, re.IGNORECASE))
    if evidence_count >= 2:
        score += 20
        notes.append("High-evidence study types mentioned: Strong for medical content")
    elif evidence_count >= 1:
        score += 10
        notes.append("Some evidence hierarchy: Add study type context")

    return {
        "score": min(score, 100),
        "citation_count": citations,
        "stat_count": stats,
        "has_quotes": has_quotes,
        "evidence_types": evidence_count,
        "notes": notes,
    }


def _generate_recommendations(
    heading: Dict, title: Dict, structure: Dict, authority: Dict
) -> List[Dict[str, str]]:
    """Generate prioritized recommendations based on analysis."""
    recs = []

    if heading["score"] < 40:
        recs.append({
            "priority": "high",
            "category": "headings",
            "action": "Restructure with 7-15 H2 sections and add H3/H4 subheadings",
        })

    if title["score"] < 40:
        recs.append({
            "priority": "high",
            "category": "title",
            "action": f"Rewrite title using AEO pattern (Best X, How to, X vs Y) with {CURRENT_YEAR}",
        })

    if authority["score"] < 40:
        recs.append({
            "priority": "high",
            "category": "authority",
            "action": "Add research citations (PMID/DOI) and statistics with sources",
        })

    if not structure.get("has_faq"):
        recs.append({
            "priority": "medium",
            "category": "structure",
            "action": "Add FAQ section for voice search and AI snippet extraction",
        })

    if structure.get("list_count", 0) < 5:
        recs.append({
            "priority": "medium",
            "category": "structure",
            "action": "Add more bullet/numbered lists for AI scanning",
        })

    if not authority.get("has_quotes"):
        recs.append({
            "priority": "low",
            "category": "authority",
            "action": "Include expert quotes for practitioner authority signal",
        })

    return recs


def _assess_platform_fit(title: str, text: str, heading: Dict) -> Dict[str, Dict[str, Any]]:
    """Assess how well content fits each AI platform's citation preferences."""
    lower_title = title.lower()

    platforms = {
        "google_ai_overview": {
            "prefers": ["Best X lists", "How-to guides", "Comprehensive blog posts"],
            "score": 50,
        },
        "chatgpt": {
            "prefers": ["Comparisons (X vs Y)", "Product listings", "PR/News"],
            "score": 50,
        },
        "perplexity": {
            "prefers": ["Product listings", "Listicles", "Blog posts"],
            "score": 50,
        },
        "gemini": {
            "prefers": ["Blog posts", "Product listings", "Listicles"],
            "score": 50,
        },
    }

    if re.match(r"^(best|top)\s+\d*", lower_title):
        platforms["google_ai_overview"]["score"] += 25
        platforms["perplexity"]["score"] += 20

    if " vs " in lower_title or "comparison" in lower_title:
        platforms["chatgpt"]["score"] += 30
        platforms["gemini"]["score"] += 15

    if re.match(r"^(how to|guide)", lower_title):
        platforms["google_ai_overview"]["score"] += 20

    depth = heading.get("h3_count", 0) + heading.get("h4_count", 0)
    if depth >= 5:
        for p in platforms.values():
            p["score"] += 10

    h2s = heading.get("h2_count", 0)
    if 7 <= h2s <= 15:
        for p in platforms.values():
            p["score"] += 10

    for p in platforms.values():
        p["score"] = min(p["score"], 100)

    return platforms


def _strip_html(text: str) -> str:
    """Remove HTML tags for text analysis."""
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    return re.sub(r"\s+", " ", text).strip()
