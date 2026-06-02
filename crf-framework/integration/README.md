# Database Integration Module

Database integration layer for the Muscle-Meta Assessment Ecosystem using async PostgreSQL (asyncpg).

## Requirements

- PostgreSQL 14+
- Python 3.10+
- asyncpg

## Setup

### 1. Install Dependencies

```bash
pip install asyncpg
```

Or with the project requirements:

```bash
cd crf-framework
pip install -r requirements.txt
```

### 2. Environment Variables

Configure database connection via environment variables:

**Option A: DATABASE_URL (recommended)**

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/muscle_meta"
```

**Option B: Individual variables**

```bash
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="muscle_meta"
export DB_USER="postgres"
export DB_PASSWORD="your_password"
export DB_SSL="false"
export DB_MIN_CONNECTIONS="2"
export DB_MAX_CONNECTIONS="10"
```

### 3. Create Database

```bash
createdb muscle_meta
```

### 4. Run Migrations

Apply the schema:

```bash
psql -d muscle_meta -f integration/database-schema.sql
```

Or via psql:

```sql
\c muscle_meta
\i integration/database-schema.sql
```

## Usage

### Basic Connection

```python
from integration import get_db_pool

async def main():
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        users = await conn.fetch("SELECT * FROM users LIMIT 10")
        for user in users:
            print(user["email"])
```

### Using Repositories

```python
from uuid import UUID
from datetime import date
from integration.repositories import UserRepository, AssessmentRepository, BiomarkerRepository

async def example():
    # User operations
    user_repo = UserRepository()
    
    user = await user_repo.create_user(
        email="patient@example.com",
        full_name="Jane Doe",
        date_of_birth=date(1970, 5, 15)
    )
    
    # Assessment operations
    assessment_repo = AssessmentRepository()
    
    assessment = await assessment_repo.save_assessment(
        user_id=user["id"],
        assessment_type="CRA",
        total_score=42,
        max_score=120,
        score_percent=35.0,
        risk_tier=2,
        risk_tier_label="LOW",
        section_scores={
            "nutrition": {"score": 8, "max": 20, "percent": 40},
            "exercise": {"score": 12, "max": 28, "percent": 43},
        },
        responses=[
            {"question_id": "q1", "response_value": 2, "score": 2},
            {"question_id": "q2", "response_value": 1, "score": 1},
        ]
    )
    
    # Get user's assessments
    assessments = await assessment_repo.get_user_assessments(user["id"])
    
    # Biomarker operations
    biomarker_repo = BiomarkerRepository()
    
    biomarkers = await biomarker_repo.save_biomarkers(
        user_id=user["id"],
        lab_date=date(2026, 6, 1),
        values={
            "crp": {"value": 2.5, "unit": "mg/L", "ref_low": 0, "ref_high": 3.0, "flag": "normal"},
            "vitamin_d": {"value": 28, "unit": "ng/mL", "ref_low": 30, "ref_high": 100, "flag": "low"},
        }
    )
    
    # Get trend data
    vit_d_trend = await biomarker_repo.get_biomarker_trend(user["id"], "vitamin_d")
```

### Transactions

```python
from integration.db import DatabaseTransaction

async def create_assessment_with_recommendations():
    async with DatabaseTransaction() as conn:
        # All operations in this block are in a single transaction
        assessment_id = await conn.fetchval(
            "INSERT INTO assessments (...) VALUES (...) RETURNING id",
            ...
        )
        
        await conn.execute(
            "INSERT INTO recommendations (...) VALUES (...)",
            assessment_id, ...
        )
        
        # Automatically commits on success, rolls back on exception
```

## Schema Overview

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts |
| `user_profiles` | Extended user demographics |
| `assessments` | Assessment sessions with scores |
| `assessment_responses` | Individual question responses |
| `validated_instrument_results` | SARC-F, MUST, EWGSOP2 results |
| `biomarkers` | Lab values with timestamps |
| `recommendations` | Personalized content recommendations |
| `progress_metrics` | Longitudinal physical measurements |
| `intervention_plans` | Clinical intervention protocols |
| `reassessments` | Before/after comparisons |

### Views

| View | Description |
|------|-------------|
| `latest_assessments` | Most recent completed assessment per user/type |
| `user_risk_summary` | Aggregated risk tiers across assessment types |
| `latest_biomarkers` | Most recent lab values per user |

## Security Notes

This module implements basic security best practices:

- Parameterized queries (no SQL injection)
- Connection pooling with size limits
- Soft delete for users (audit trail)
- No plaintext passwords (expects pre-hashed)

**Note:** This is for educational risk assessment, not medical diagnosis. For production with PHI, additional measures would be needed (encryption at rest, audit logging, access controls, etc.).

## Development

### Running Tests

```bash
# Set test database URL
export DATABASE_URL="postgresql://postgres:password@localhost:5432/muscle_meta_test"

# Run tests
pytest tests/integration/
```

### Resetting Schema

```bash
# Drop and recreate
dropdb muscle_meta && createdb muscle_meta
psql -d muscle_meta -f integration/database-schema.sql
```
