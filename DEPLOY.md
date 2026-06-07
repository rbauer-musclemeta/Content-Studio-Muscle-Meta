# Muscle-Meta Matrix — Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│              React 19 + Tailwind + shadcn/ui                │
│                    (Vercel/Netlify)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ REACT_APP_BACKEND_URL
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Product Backend                           │
│                 FastAPI (single origin)                      │
│                                                             │
│  /api/           → Courses, newsletters, payments (MongoDB) │
│  /api/crf/*      → Assessments, risk scoring (PostgreSQL)   │
└────────────┬─────────────────────────┬──────────────────────┘
             │                         │
             ▼                         ▼
      ┌──────────────┐         ┌──────────────┐
      │   MongoDB    │         │  PostgreSQL  │
      │   (product)  │         │  (clinical)  │
      └──────────────┘         └──────────────┘
```

## Prerequisites

- Python 3.10+
- Node.js 18+ / Yarn 1.22+
- MongoDB 6.0+
- PostgreSQL 14+
- Stripe account (for payments)

## 1. Database Setup

### MongoDB (Product Data)

```bash
# Start MongoDB (local dev)
mongod --dbpath /var/lib/mongodb

# Or use MongoDB Atlas connection string
```

### PostgreSQL (Clinical Data)

```bash
# Create database
createdb crf_clinical

# Apply schema
psql crf_clinical < crf-framework/integration/database-schema.sql

# Verify tables created
psql crf_clinical -c "\dt"
```

Expected tables:
- `users`, `user_profiles`
- `assessments`, `assessment_responses`
- `biomarkers`, `validated_instrument_results`
- `recommendations`, `intervention_plans`
- `progress_metrics`

## 2. Environment Configuration

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

Required variables:
```env
# MongoDB (product)
MONGO_URL=mongodb://localhost:27017
DB_NAME=muscle_meta_matrix

# PostgreSQL (clinical) — used by CRF integration
CRF_DATABASE_URL=postgresql://user:password@localhost:5432/crf_clinical

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
DEBUG=false
LOG_LEVEL=INFO
```

### Frontend (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

Required variables:
```env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 3. Install Dependencies

### Backend

```bash
cd backend
pip install -r requirements.txt
```

### CRF Framework (if running separately)

```bash
cd crf-framework
pip install -e .
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
yarn install
```

## 4. Run Locally

### Start Backend

```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Backend serves:
- `/api/*` — product endpoints (courses, payments, admin)
- `/api/crf/*` — clinical endpoints (assessments, recommendations)

### Start Frontend

```bash
cd frontend
yarn start
```

Frontend runs on `http://localhost:3000`

## 5. Verify Installation

### Health Check

```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "mongodb": "connected",
    "payments": "active",
    "admin": "active",
    "crf": "active"
  },
  "databases": {
    "mongodb": "product data",
    "postgresql": "clinical data"
  }
}
```

### CRF API Check

```bash
curl http://localhost:8000/api/crf/
```

### Test Assessment

```bash
curl -X POST http://localhost:8000/api/crf/quick-screen \
  -H "Content-Type: application/json" \
  -d '{
    "patient": {
      "profile": {
        "patient_id": "test_001",
        "date_of_birth": "1960-01-01",
        "sex": "male",
        "height_cm": 175,
        "weight_kg": 80
      },
      "activity_level": "sedentary"
    }
  }'
```

## 6. Production Deployment

### Option A: Single Server (Recommended for MVP)

Deploy both frontend and backend to one server:

```bash
# Build frontend
cd frontend && yarn build

# Serve from backend
# Add static file serving to FastAPI (or use nginx)
```

### Option B: Separate Services

- **Frontend**: Vercel, Netlify, or S3 + CloudFront
- **Backend**: Railway, Render, or EC2/GCP VM
- **Databases**: MongoDB Atlas + Supabase (Postgres)

### Emergent.sh (Original Scaffold)

This repo was scaffolded with Emergent.sh. To redeploy:

```bash
# If using emergent CLI
emergent deploy
```

## 7. Key Endpoints

### Product API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/` | GET | Health check |
| `/api/health` | GET | Detailed status |
| `/api/payments/checkout/session` | POST | Create Stripe session |
| `/api/payments/webhook/stripe` | POST | Stripe webhook |

### CRF Clinical API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/crf/` | GET | CRF API info |
| `/api/crf/assess` | POST | Full assessment with biomarkers |
| `/api/crf/quick-screen` | POST | Quick screening (panel-first output) |
| `/api/crf/validated-instruments` | POST | Run SARC-F, MUST, EWGSOP2 only |
| `/api/crf/recommendations` | POST | Generate intervention plan |

### Frontend Routes

| Route | Component |
|-------|-----------|
| `/` | NewsletterHub |
| `/courses` | CoursesPage |
| `/assessment/catabolic-risk` | CatabolicRiskAssessment |
| `/admin` | AdminDashboard |

## 8. Monitoring

### Logs

Backend logs to stdout. In production, pipe to a log aggregator:

```bash
uvicorn server:app 2>&1 | tee -a /var/log/muscle-meta.log
```

### Error Tracking

Consider adding Sentry:
```bash
pip install sentry-sdk[fastapi]
```

## 9. Security Notes

- **No HIPAA required** — educational screening tool, not medical device
- **No auth on assessments** — anonymous session IDs for MVP
- **Stripe handles PCI compliance** — no card data touches our servers
- **CORS configured** — update `allow_origins` in `server.py` for production domains

## 10. Troubleshooting

### "CRF import failed"

Ensure `crf-framework/src` is in Python path:
```bash
export PYTHONPATH="${PYTHONPATH}:/path/to/crf-framework/src"
```

### "MongoDB connection refused"

Check `MONGO_URL` in `.env` and that MongoDB is running:
```bash
systemctl status mongod
```

### "PostgreSQL: relation does not exist"

Run the schema migration:
```bash
psql crf_clinical < crf-framework/integration/database-schema.sql
```

### Frontend can't reach backend

1. Check `REACT_APP_BACKEND_URL` is set correctly
2. Verify CORS origins in `backend/server.py`
3. Check firewall/network rules

---

## Quick Start (Local Dev)

```bash
# Terminal 1: Backend
cd backend
cp .env.example .env  # Edit with your values
uvicorn server:app --reload

# Terminal 2: Frontend
cd frontend
cp .env.example .env
yarn install
yarn start

# Visit http://localhost:3000/assessment/catabolic-risk
```
