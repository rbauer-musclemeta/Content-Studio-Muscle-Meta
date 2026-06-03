# Muscle-Meta Matrix Assessment Ecosystem

**Clinical Intelligence for Active Aging**  
Created by Randy Bauer, PT — Muscle-Meta Matrix  
Version: 1.0 | Last Updated: June 2026

---

## Overview

The Muscle-Meta Matrix is a comprehensive assessment and education platform for adults 45+ focused on preventing and reversing age-related muscle loss, metabolic decline, and functional decline. The platform delivers personalized risk stratification and educational content through a unified assessment ecosystem.

**Core Philosophy**: Bone loss precedes muscle wasting by 7-14 days. Early detection through the GMMBB Axis (Gut-Muscle-Metabolic-Bone-Brain) enables intervention before catabolic cascade activation.

---

## Architecture: 4 Pillars × 12 Categories

### Pillar 1: Exercise & Mobility
| Category | Focus | Key Assessments |
|----------|-------|-----------------|
| **Strength & Sarcopenia** | Muscle mass, grip strength, SARC-F | GMMBB (Muscle Axis), CRA |
| **Balance & Fall Risk** | Proprioception, vestibular, gait | Fall Risk Assessment, GMMBB (Brain Axis) |
| **Functional Capacity** | ADLs, chair-stand, gait speed | Functional Assessment, EWGSOP2 |

### Pillar 2: Nutrition & Metabolism
| Category | Focus | Key Assessments |
|----------|-------|-----------------|
| **Metabolic Flexibility** | Fuel switching, insulin sensitivity | Metabolic Flexibility Assessment |
| **Protein & Anabolic Signaling** | Leucine threshold, mTOR activation | CRA, CCRAF |
| **Gut Health** | Microbiome, NF-κB, inflammation | GMMBB (Gut Axis) |

### Pillar 3: Recovery & Resilience
| Category | Focus | Key Assessments |
|----------|-------|-----------------|
| **Sleep & Circadian** | HRV, sleep architecture, melatonin | GMMBB (Brain Axis) |
| **Stress & HPA Axis** | Cortisol, chronic stress, burnout | Brain-Muscle Assessment |
| **Mitochondrial Health** | ATP production, fat oxidation | MFAT (Mitochondrial Function) |

### Pillar 4: Medical & Clinical
| Category | Focus | Key Assessments |
|----------|-------|-----------------|
| **Bone Health** | DEXA T-scores, osteosarcopenia | GMMBB (Bone Axis), Bone-Health |
| **Catabolic Risk** | NF-κB activation, muscle wasting | CRA, CCRAF, Catabolic-Crisis |
| **Comorbidity Management** | Diabetes, GLP-1, post-surgical | GLP-1 Assessment, Post-Hospital |

---

## 5-Tier Risk Stratification

All assessments use a unified 5-tier system:

| Tier | Score Range | Label | Track | Color |
|------|-------------|-------|-------|-------|
| **1** | 0-20% | Optimal / Minimal Risk | Optimization & Performance | `#009090` (teal) |
| **2** | 21-40% | Functional / Low Risk | Prevention & Priming | `#3b82f6` (blue) |
| **3** | 41-60% | Declining / Moderate Risk | Structured Intervention | `#f59e0b` (amber) |
| **4** | 61-80% | At Risk / High Risk | Intensive Support | `#f97316` (orange) |
| **5** | 81-100% | Critical / Severe Risk | Medical Co-Management | `#dc2626` (red) |

### Age Modifiers
```
under50:  -1 tier
50-59:     0 (baseline)
60-69:    +1 tier
70-79:    +2 tiers
80+:      +2 tiers
```

### Clinical Override Rules
Certain conditions force minimum tier regardless of score:

| Condition | Minimum Tier |
|-----------|--------------|
| Type 2 Diabetes / Prediabetes | Tier 4 |
| Insulin-dependent | Tier 4 |
| Oral corticosteroid use | Tier 4 |
| Severe hypoglycemic symptoms | Tier 4 |
| Metabolic Syndrome / Insulin Resistance | Tier 3 |
| Osteoporosis (T-score ≤ -2.5) | Tier 4 |
| Confirmed Sarcopenia (EWGSOP2) | Tier 4 |
| MUST High Risk | Tier 4 |

---

## Assessment Inventory

### Tier 1: Consumer Self-Assessments
| Assessment | Questions | Duration | Pillar | Lead Magnet |
|------------|-----------|----------|--------|-------------|
| **CRA** (Catabolic Risk) | 30 | 8-10 min | Medical | Yes |
| **4P-MMA** (4-Pillar) | 60 | 20-25 min | All | Paid upgrade |

### Tier 2: Population-Specific
| Assessment | Questions | Target Population | Pillar |
|------------|-----------|-------------------|--------|
| **GLP-1 Muscle Protection** | ~25 | Ozempic/Wegovy/Mounjaro users | Medical |
| **Pickleball Readiness** | ~20 | Active agers 50+ | Exercise |
| **Post-Hospital Recovery** | ~30 | Post-surgical/illness | Medical |
| **VILPA** | ~15 | Sedentary adults | Exercise |

### Tier 3: Professional/Clinical
| Assessment | Questions | Duration | Use Case |
|------------|-----------|----------|----------|
| **CCRAF** (Comprehensive) | 95 | 60-90 min | Clinical intake |
| **Functional Assessment** | Variable | Clinical | PT/provider administered |

### Tier 4: Specialized Clinical
| Assessment | Focus | Category |
|------------|-------|----------|
| **MFAT** | Mitochondrial function | Mitochondrial Health |
| **Bone-Health** | Osteosarcopenia screening | Bone Health |
| **Brain-Muscle** | Neuromuscular axis | Stress & HPA |
| **Catabolic-Crisis** | Post-surgery/illness | Catabolic Risk |

### Tier 5: Axis Assessments
| Assessment | Axes | Questions | Duration |
|------------|------|-----------|----------|
| **GMMBB Axis** | Gut, Muscle, Metabolic, Bone, Brain | ~40 | 15-20 min |

### Category-Specific Assessments
| Assessment | Category | Pillar |
|------------|----------|--------|
| **Metabolic Flexibility** | Metabolic Flexibility | Nutrition & Metabolism |
| **Fall Risk** (planned) | Balance & Fall Risk | Exercise & Mobility |
| **Mitochondrial Health** (planned) | Mitochondrial Health | Recovery & Resilience |

---

## Scoring Engine Specification

### Question Types

#### Radio (Single Select)
```javascript
{
  id: 'question-id',
  domain: 'Domain label',
  text: 'Question text?',
  type: 'radio',
  options: [
    { value: 0, label: 'Best outcome' },
    { value: 1, label: 'Good outcome' },
    { value: 2, label: 'Fair outcome' },
    { value: 3, label: 'Poor outcome' },
    { value: 4, label: 'Worst outcome' },
  ]
}
```

#### Checkbox (Multi-Select with Cap)
```javascript
{
  id: 'screener-id',
  domain: 'Screener label',
  text: 'Select all that apply',
  type: 'checkbox',
  cap: 4,  // Maximum contribution to total score
  options: [
    { value: 'condition-a', label: 'Condition A', points: 4 },
    { value: 'condition-b', label: 'Condition B', points: 3 },
    { value: 'none', label: 'None of the above', points: 0, isNone: true },
  ]
}
```

### Score Calculation
```
Raw Score = Σ(screener scores, capped) + Σ(core question scores)
Max Score = Σ(screener caps) + (core_questions × 4)
Risk Percentage = (Raw Score / Max Score) × 100
Base Tier = floor(Risk Percentage / 20) + 1, clamped to [1, 5]
Adjusted Tier = Base Tier + Age Modifier, then apply Clinical Overrides
```

### Domain Breakdown
Each assessment tracks domain-level scores for visualization:
- **Optimal** (0): Green `#009090`
- **Good** (1): Green `#009090`
- **Fair** (2): Amber `#f59e0b`
- **Poor** (3): Orange `#f97316`
- **Critical** (4): Red `#dc2626`

---

## Clinical Flags System

### Flag Types
| Type | Color | Use Case |
|------|-------|----------|
| `urgent` | Red `#dc2626` | Requires physician consultation before proceeding |
| `warning` | Orange `#f97316` | Caution, supervision recommended |
| `info` | Teal `#009090` | Educational consideration, actionable insight |

### Flag Triggers
```javascript
// Urgent flags
if (hasDiabetes || hasPrediabetes) → urgent: "Physician consultation required..."
if (usesInsulin) → urgent: "Insulin-dependent: fasting requires supervision..."
if (severeHungerSymptoms) → urgent: "Hypoglycemic response pattern detected..."

// Warning flags
if (usesCorticosteroids) → warning: "Corticosteroid use elevates insulin resistance..."
if (hasOsteoporosis) → warning: "T-score ≤ -2.5 requires bone-protective protocol..."

// Info flags
if (usesStatins) → info: "Statins deplete CoQ10 — discuss supplementation..."
if (age >= 80) → info: "Medical co-management recommended at 80+..."
```

---

## Cross-Referral System

When certain conditions are detected, prompt for complementary assessments:

| Trigger | Referral Assessment | Reason |
|---------|---------------------|--------|
| GLP-1 medication use | GLP-1 Muscle Protection | Appetite suppression masks metabolic signals |
| Bone Axis ≥40% + Muscle Axis ≥40% | Osteosarcopenia Protocol | Compound risk requires integrated intervention |
| SARC-F positive | EWGSOP2 confirmatory | Validated pathway for sarcopenia diagnosis |
| MUST medium/high | Nutritional intervention | Malnutrition care pathway |
| Fall in past 12 months | Fall Risk Assessment | Balance and strength evaluation |
| Post-surgical | Catabolic-Crisis Assessment | Acute catabolic risk evaluation |

---

## CRF Python Backend Integration

The `crf-framework/` directory contains the Python backend that powers validated clinical instruments and risk calculation.

### Validated Instruments (Panel-First Output)
| Instrument | Type | Citation |
|------------|------|----------|
| **SARC-F** | Sarcopenia screening | Malmstrom & Morley 2013; EWGSOP2 2019 |
| **MUST** | Malnutrition screening | BAPEN 2003 |
| **EWGSOP2** | Sarcopenia diagnosis | Cruz-Jentoft et al. 2019 |

### Key Modules
```
crf-framework/src/crf/
├── models/
│   ├── patient.py         # Patient profile, demographics
│   ├── biomarkers.py      # Lab values with reference ranges
│   ├── measurements.py    # Physical measurements, SARC-F responses
│   └── risk_factors.py    # 22 risk factors across 6 categories
├── instruments/
│   ├── base.py            # BaseInstrument, InstrumentResult, ScreeningPanel
│   ├── sarcf.py           # SARC-F implementation
│   ├── must.py            # MUST implementation
│   └── ewgsop2.py         # EWGSOP2 staged algorithm
├── assessment/
│   ├── calculator.py      # CatabolicRiskCalculator, quick_screen()
│   ├── scoring.py         # ScoringEngine, RiskScore, RiskLevel
│   └── recommendations.py # RecommendationEngine with instrument-driven recs
└── utils/
    └── helpers.py         # format_risk_report() with panel-first output
```

### Output Structure (Panel-First)
```python
quick_screen(patient) → {
    "validated_instruments": [
        {"instrument": "SARC-F", "category": "Screen positive", ...},
        {"instrument": "EWGSOP2", "category": "Confirmed sarcopenia", ...},
        {"instrument": "MUST", "category": "High risk", ...},
    ],
    "validated_summary": {
        "sarcopenia_screen": "Screen positive",
        "sarcopenia_confirmed": "Confirmed sarcopenia",
        "malnutrition_risk": "High risk",
        "any_positive": True,
    },
    "exploratory_composite": {
        "risk_level": "severe",
        "risk_percentage": 67.1,
        "validation_status": "unvalidated_v1",
        ...
    },
    "recommendation": "EWGSOP2 confirms sarcopenia — refer for...",
    "disclaimer": "EDUCATIONAL SCREENING AID — NOT A MEDICAL DEVICE...",
}
```

---

## Adding New Assessments

### Step 1: Define Pillar & Category Mapping
```javascript
const NEW_ASSESSMENT = {
  id: 'fall-risk-v1',
  name: 'Fall Risk Assessment',
  pillar: 'exercise_mobility',        // exercise_mobility | nutrition_metabolism | recovery_resilience | medical_clinical
  category: 'balance_fall_risk',       // One of the 12 categories
  version: '1.0',
  questions: 20,
  duration_minutes: 10,
  tier: 'consumer',                    // consumer | population | professional | specialized
};
```

### Step 2: Define Questions
Follow the question schema:
```javascript
const QUESTIONS = [
  {
    id: 'unique-question-id',
    domain: 'Domain for breakdown chart',
    text: 'Question text with clear, plain language',
    instruction: 'Optional clarifying instruction',
    type: 'radio',  // or 'checkbox'
    tip: 'Optional clinical context shown to user',
    options: [
      { value: 0, label: 'Best/safest response' },
      { value: 1, label: 'Good response' },
      { value: 2, label: 'Fair response' },
      { value: 3, label: 'Poor response' },
      { value: 4, label: 'Worst/highest risk response', riskHigh: true },
    ],
  },
  // Screener questions (checkbox type)
  {
    id: 'medical-screener',
    domain: 'Medical history',
    text: 'Have you been diagnosed with any of the following?',
    type: 'checkbox',
    cap: 4,  // Max contribution
    options: [
      { value: 'condition', label: 'Condition name', points: 3 },
      { value: 'none', label: 'None of the above', points: 0, isNone: true },
    ],
  },
];
```

### Step 3: Define Clinical Overrides
```javascript
const CLINICAL_OVERRIDES = [
  { condition: 'has_fallen_past_year', minimumTier: 3 },
  { condition: 'uses_mobility_aid', minimumTier: 3 },
  { condition: 'has_neuropathy', minimumTier: 4 },
];
```

### Step 4: Define Flags & Cross-Referrals
```javascript
const FLAG_RULES = [
  {
    trigger: (answers) => answers['fall-history'] === 'multiple',
    type: 'urgent',
    text: 'Multiple falls in past year — physician evaluation recommended before beginning exercise program.',
  },
];

const CROSS_REFERRALS = [
  {
    trigger: (answers, tier) => tier >= 3 && answers['balance-confidence'] >= 3,
    assessment: 'gmmbb-axis',
    reason: 'Balance concerns may indicate broader neuromuscular decline.',
  },
];
```

### Step 5: Define Tier Content
```javascript
const TIER_CONTENT = {
  1: {
    label: 'Low Fall Risk',
    track: 'Maintenance & Optimization',
    desc: 'Your balance and strength are well-maintained...',
    cta: 'Begin advanced balance challenges',
  },
  // ... tiers 2-5
};
```

### Step 6: Register in Assessment Inventory
Add to `assessments/` directory and update the inventory index.

---

## Database Schema Reference

See `crf-framework/integration/database-schema.sql` for full PostgreSQL schema including:
- `users` — User accounts
- `assessments` — Assessment sessions with scores
- `assessment_responses` — Individual question responses
- `recommendations` — Personalized content recommendations
- `intervention_plans` — Clinical intervention protocols
- `progress_metrics` — Longitudinal tracking
- `reassessments` — Before/after comparison

---

## Brand Tokens

```css
--teal:          #009090;   /* Primary brand color */
--teal-dark:     #006b6b;
--gold:          #D4AF37;   /* Accent/premium */
--ink:           #1a2332;   /* Text primary */
--surface:       #f7f6f3;   /* Background */

/* Tier colors */
--tier-1: #009090;  /* Optimal */
--tier-2: #3b82f6;  /* Low */
--tier-3: #f59e0b;  /* Moderate */
--tier-4: #f97316;  /* High */
--tier-5: #dc2626;  /* Critical */

/* Typography */
--font-display: 'Cormorant Garamond', Georgia, serif;
--font-body:    'Outfit', 'Helvetica Neue', Arial, sans-serif;
```

---

## Application Architecture (Full-Stack)

This repo is a full-stack application originally scaffolded via **Emergent.sh**
(`.emergent/emergent.yml`, base image `fastapi_react_mongo_shadcn`). There are
**two distinct backends** that are not yet unified — this is the most important
thing to understand before doing integration work.

### A. Product App (live: courses, newsletters, payments)
| Layer | Stack | Location |
|-------|-------|----------|
| Frontend | React 19, CRACO, Tailwind, shadcn/ui, react-router 7 | `frontend/` |
| Backend | FastAPI + **MongoDB** (motor), Stripe, Gemini/OpenAI (litellm) | `backend/` |
| Routing | All API under `/api` prefix; frontend reads `REACT_APP_BACKEND_URL` | `backend/server.py`, `frontend/src/App.js` |

Frontend routes today: `/` (NewsletterHub), `/muscle-metabolic-health`,
`/hiit-longevity`, `/courses`, course detail/success pages, and `/admin*`.
**No assessment routes are wired into the live app yet.**

### B. CRF Clinical Engine (assessment + risk)
| Layer | Stack | Location |
|-------|-------|----------|
| Library | Pure-Python clinical engine (validated instruments + composite) | `crf-framework/src/crf/` |
| API | Separate FastAPI app | `crf-framework/api/` |
| Persistence | **PostgreSQL** (asyncpg) — schema + repos | `crf-framework/integration/` |
| Parsers | PDF lab / DEXA biomarker extraction | `crf-framework/src/crf/parsers/` |
| Standalone assessments | Self-contained HTML/JS | `assessments/*/` |

### ✅ Architecture Decisions (Phase A complete)
1. **Dual databases** (decided): MongoDB for product (courses, users, payments),
   PostgreSQL for clinical (assessments, biomarkers). Cleaner separation of concerns.
2. **Unified API** (decided): CRF mounted under product backend at `/api/crf/*`
   via `backend/crf_integration.py`. Frontend uses single `REACT_APP_BACKEND_URL`.
3. **Assessments are standalone HTML** — Phase B will port to React components
   consuming the CRF API. The component library (`frontend/src/components/`) is the target.

## Development Workflow

### Running Tests
```bash
cd crf-framework
python -m pytest tests/ -v          # 92 tests (engine, instruments, parsers)
```

### Running the App
```bash
# Backend (product app) — needs MONGO_URL, DB_NAME, Stripe keys in backend/.env
cd backend && uvicorn server:app --reload

# CRF API (clinical engine) — needs DATABASE_URL in env for persistence
cd crf-framework && uvicorn api.main:app --reload --port 8001

# Frontend — needs REACT_APP_BACKEND_URL in frontend/.env
cd frontend && yarn install && yarn start
```

### Current Branch
Development happens on: `claude/crf-muscle-meta-setup-Us7jA`

### Key Files
- `/CLAUDE.md` — This file (ecosystem documentation)
- `/backend/` — Product FastAPI + MongoDB (courses, newsletters, Stripe)
- `/frontend/` — React 19 + Tailwind + shadcn/ui
- `/contracts.md` — Product API contracts and data models
- `/crf-framework/` — Clinical risk engine, CRF API, Postgres integration, parsers
- `/assessments/` — Standalone HTML assessments (GMMBB, Metabolic Flexibility,
  Mitochondrial Health, Fall Risk)

---

## Roadmap

### Completed
- [x] CRF Python backend with validated instruments
- [x] SARC-F, MUST, EWGSOP2 implementation
- [x] Panel-first output (validated instruments as headline)
- [x] 5-tier risk stratification
- [x] GMMBB Axis Assessment (JSX)
- [x] Metabolic Flexibility Assessment (HTML)

- [x] FastAPI wrapper for CRF backend (`crf-framework/api/`)
- [x] Database schema + repositories (PostgreSQL, `crf-framework/integration/`)
- [x] Lab upload parser — PDF blood labs + DEXA (`crf-framework/src/crf/parsers/`)
- [x] Fall Risk Assessment (Balance & Fall Risk category, standalone HTML)
- [x] Mitochondrial Health Assessment (standalone HTML)

- [x] **Phase A complete**: Dual-DB architecture (MongoDB + PostgreSQL)
- [x] **Phase A complete**: CRF mounted under product backend at `/api/crf/*`
- [x] `.env.example` files for backend and frontend

### In Progress (Phase B: Frontend)
- [ ] Assessment React component library (port standalone HTML → React + CRF API)
- [ ] Wire assessment routes into `frontend/src/App.js`
- [ ] Results visualization (tier card, domain breakdown chart)

### Planned (Phase C: Content Loop)
- [ ] Sleep Quality Assessment (Sleep & Circadian category)
- [ ] Content recommendation engine (map risk tier → courses/newsletters)
- [ ] Reassessment tracking and progress visualization
- [ ] Auth for clinical data (currently only product-side users exist)

---

## Contact

**Randy Bauer, PT**  
Founder, Muscle-Meta Matrix  
Email: rbauer@bauerpt.com
