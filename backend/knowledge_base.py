from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from models import KnowledgeArticle, KnowledgeArticleCreate, KBQuery
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from datetime import datetime
from typing import List, Optional
import uuid
import io

import litellm

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    from docx import Document as DocxDocument
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

logger = logging.getLogger(__name__)

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

kb = APIRouter(prefix="/api/kb")

SYSTEM_PROMPT = """You are Randy Bauer's personal AI knowledge assistant. Randy is a licensed Physical Therapist specializing in exercise science, metabolic health, muscle building, sleep optimization, and sport performance (including pickleball).

Answer questions based ONLY on the knowledge base articles provided. If the answer is not in the context, say so and suggest what type of content would help.

Be evidence-based, precise, and practical. Reference specific articles when relevant. Use proper PT and exercise science terminology."""


async def _ensure_text_index():
    try:
        await db.knowledge_articles.create_index([
            ("title", "text"),
            ("content", "text"),
            ("tags", "text")
        ], background=True)
    except Exception:
        pass


@kb.get("/articles", response_model=List[KnowledgeArticle])
async def list_articles(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50
):
    try:
        query = {}

        if search:
            query["$text"] = {"$search": search}

        if category and category != "all":
            query["category"] = category

        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            if tag_list:
                query["tags"] = {"$in": tag_list}

        cursor = db.knowledge_articles.find(query, {"_id": 0})

        if search:
            cursor = cursor.sort([("score", {"$meta": "textScore"})])
        else:
            cursor = cursor.sort("created_at", -1)

        articles = await cursor.skip(skip).limit(limit).to_list(limit)
        return [KnowledgeArticle(**a) for a in articles]

    except Exception as e:
        logger.error(f"Error listing KB articles: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch articles")


@kb.get("/stats")
async def get_kb_stats():
    try:
        total = await db.knowledge_articles.count_documents({})

        pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
        cat_counts = await db.knowledge_articles.aggregate(pipeline).to_list(100)
        by_category = {item["_id"]: item["count"] for item in cat_counts}

        pipeline2 = [{"$group": {"_id": None, "total_words": {"$sum": "$word_count"}}}]
        word_result = await db.knowledge_articles.aggregate(pipeline2).to_list(1)
        total_words = word_result[0]["total_words"] if word_result else 0

        return {
            "total_articles": total,
            "total_words": total_words,
            "by_category": by_category
        }
    except Exception as e:
        logger.error(f"Error getting KB stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get KB stats")


@kb.get("/articles/{article_id}", response_model=KnowledgeArticle)
async def get_article(article_id: str):
    try:
        article = await db.knowledge_articles.find_one({"id": article_id}, {"_id": 0})
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        return KnowledgeArticle(**article)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching KB article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch article")


@kb.post("/articles", response_model=KnowledgeArticle)
async def create_article(article_data: KnowledgeArticleCreate):
    try:
        article_dict = article_data.dict()
        article_dict["id"] = str(uuid.uuid4())
        article_dict["word_count"] = len(article_data.content.split())
        article_dict["created_at"] = datetime.utcnow()
        article_dict["updated_at"] = datetime.utcnow()

        if not article_dict.get("summary") and article_data.content:
            trimmed = article_data.content[:250]
            article_dict["summary"] = trimmed.rsplit(' ', 1)[0] + "..." if len(article_data.content) > 250 else trimmed

        article = KnowledgeArticle(**article_dict)
        await db.knowledge_articles.insert_one(article.dict())
        await _ensure_text_index()

        logger.info(f"Created KB article: {article.id}")
        return article

    except Exception as e:
        logger.error(f"Error creating KB article: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create article")


@kb.put("/articles/{article_id}", response_model=KnowledgeArticle)
async def update_article(article_id: str, article_data: KnowledgeArticleCreate):
    try:
        existing = await db.knowledge_articles.find_one({"id": article_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Article not found")

        update_data = article_data.dict()
        update_data["id"] = article_id
        update_data["word_count"] = len(article_data.content.split())
        update_data["updated_at"] = datetime.utcnow()
        update_data["created_at"] = existing.get("created_at", datetime.utcnow())

        article = KnowledgeArticle(**update_data)
        await db.knowledge_articles.update_one(
            {"id": article_id},
            {"$set": article.dict()}
        )

        logger.info(f"Updated KB article: {article_id}")
        return article

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating KB article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update article")


@kb.delete("/articles/{article_id}")
async def delete_article(article_id: str):
    try:
        result = await db.knowledge_articles.delete_one({"id": article_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        return {"message": "Article deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting KB article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete article")


@kb.post("/articles/upload", response_model=KnowledgeArticle)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form(default="general"),
    tags: str = Form(default=""),
    title: Optional[str] = Form(None)
):
    try:
        content = await file.read()
        filename = file.filename or "uploaded_document"
        file_ext = os.path.splitext(filename)[1].lower()

        extracted_text = ""

        if file_ext == ".pdf":
            if not PDF_AVAILABLE:
                raise HTTPException(status_code=400, detail="PDF support not installed (PyPDF2 required)")
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"

        elif file_ext == ".txt":
            extracted_text = content.decode("utf-8", errors="ignore")

        elif file_ext in [".docx", ".doc"]:
            if not DOCX_AVAILABLE:
                raise HTTPException(status_code=400, detail="DOCX support not installed (python-docx required)")
            doc = DocxDocument(io.BytesIO(content))
            extracted_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}. Use PDF, TXT, or DOCX.")

        extracted_text = extracted_text.strip()
        if not extracted_text:
            raise HTTPException(status_code=400, detail="No text could be extracted from the document")

        article_title = title or os.path.splitext(filename)[0].replace("-", " ").replace("_", " ").title()
        tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

        summary = extracted_text[:250].rsplit(' ', 1)[0] + "..." if len(extracted_text) > 250 else extracted_text

        article_dict = {
            "id": str(uuid.uuid4()),
            "title": article_title,
            "content": extracted_text,
            "summary": summary,
            "category": category,
            "tags": tag_list,
            "source_type": "upload",
            "source_reference": filename,
            "word_count": len(extracted_text.split()),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        article = KnowledgeArticle(**article_dict)
        await db.knowledge_articles.insert_one(article.dict())
        await _ensure_text_index()

        logger.info(f"Uploaded KB article from {filename}: {article.id}")
        return article

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@kb.post("/ask")
async def ask_knowledge_base(query: KBQuery):
    try:
        search_query: dict = {}
        if query.question.strip():
            search_query["$text"] = {"$search": query.question}
        if query.category and query.category != "all":
            search_query["category"] = query.category

        articles = []
        if "$text" in search_query:
            articles = await db.knowledge_articles.find(
                search_query,
                {"_id": 0, "score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]).limit(query.max_context_articles).to_list(query.max_context_articles)

        # Fallback to recent articles if text search returns nothing
        if not articles:
            fallback_query = {}
            if query.category and query.category != "all":
                fallback_query["category"] = query.category
            articles = await db.knowledge_articles.find(
                fallback_query, {"_id": 0}
            ).sort("created_at", -1).limit(query.max_context_articles).to_list(query.max_context_articles)

        if not articles:
            return {
                "answer": "Your knowledge base is empty. Add articles or upload documents to start getting AI-powered answers from your own content.",
                "sources": [],
                "articles_found": 0
            }

        context_parts = []
        sources = []
        for i, article in enumerate(articles):
            context_parts.append(f"[Article {i+1}: {article['title']} | Category: {article['category']}]\n{article['content'][:3000]}")
            sources.append({
                "id": article["id"],
                "title": article["title"],
                "category": article["category"],
                "summary": article.get("summary", "")
            })

        context = "\n\n---\n\n".join(context_parts)

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Knowledge Base Articles:\n\n{context}\n\n---\n\nQuestion: {query.question}"
            }
        ]

        model = os.environ.get("KB_AI_MODEL", "claude-3-5-sonnet-20241022")

        response = await litellm.acompletion(
            model=model,
            messages=messages,
            max_tokens=1500,
            temperature=0.3
        )

        answer = response.choices[0].message.content

        return {
            "answer": answer,
            "sources": sources,
            "articles_found": len(articles),
            "model": model
        }

    except Exception as e:
        logger.error(f"Error in KB ask: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI query failed: {str(e)}")
