"""
Biomarker repository for database operations.

Provides CRUD operations for biomarkers and lab values.
"""

import json
from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

import asyncpg

from ..db import get_db_pool


class BiomarkerRepository:
    """Repository for biomarker-related database operations."""

    def __init__(self, pool: Optional[asyncpg.Pool] = None):
        self._pool = pool

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await get_db_pool()
        return self._pool

    async def save_biomarkers(
        self,
        user_id: UUID,
        lab_date: date,
        values: dict[str, dict[str, Any]],
        *,
        assessment_id: Optional[UUID] = None,
        lab_source: str = "manual_entry",
        notes: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Save biomarker values from a lab report.

        Args:
            user_id: User's UUID
            lab_date: Date of lab work
            values: Dict of biomarker values, each containing:
                    {
                        "value": float,
                        "unit": str,
                        "ref_low": Optional[float],
                        "ref_high": Optional[float],
                        "flag": Optional[str]  # "normal", "low", "high", "critical"
                    }
            assessment_id: Optional linked assessment
            lab_source: Source of lab data
            notes: Optional notes

        Returns:
            Created biomarker record as dict

        Example:
            await repo.save_biomarkers(
                user_id=user_id,
                lab_date=date(2026, 6, 1),
                values={
                    "crp": {"value": 2.5, "unit": "mg/L", "ref_low": 0, "ref_high": 3.0, "flag": "normal"},
                    "glucose_fasting": {"value": 105, "unit": "mg/dL", "ref_low": 70, "ref_high": 99, "flag": "high"},
                    "vitamin_d": {"value": 28, "unit": "ng/mL", "ref_low": 30, "ref_high": 100, "flag": "low"}
                }
            )
        """
        pool = await self._get_pool()

        # Count abnormal and critical values
        abnormal_count = 0
        critical_count = 0

        for biomarker, data in values.items():
            flag = data.get("flag", "").lower()
            if flag in ("low", "high"):
                abnormal_count += 1
            elif flag == "critical":
                critical_count += 1
                abnormal_count += 1

        query = """
            INSERT INTO biomarkers (
                user_id, assessment_id, lab_date, lab_source,
                values, abnormal_count, critical_count, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, user_id, lab_date, lab_source,
                      abnormal_count, critical_count, created_at
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                user_id,
                assessment_id,
                lab_date,
                lab_source,
                json.dumps(values),
                abnormal_count,
                critical_count,
                notes,
            )

            result = dict(row)
            result["values"] = values  # Include the full values dict
            return result

    async def get_biomarkers_by_id(
        self, biomarker_id: UUID
    ) -> Optional[dict[str, Any]]:
        """
        Get a biomarker record by ID.

        Args:
            biomarker_id: Biomarker record UUID

        Returns:
            Biomarker record as dict, or None if not found
        """
        pool = await self._get_pool()

        query = """
            SELECT id, user_id, assessment_id, lab_date, lab_source,
                   values, abnormal_count, critical_count, notes,
                   verified_by, verified_at, created_at, updated_at
            FROM biomarkers
            WHERE id = $1
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, biomarker_id)

            if not row:
                return None

            result = dict(row)
            if result.get("values"):
                result["values"] = json.loads(result["values"])
            return result

    async def get_latest_biomarkers(
        self, user_id: UUID
    ) -> Optional[dict[str, Any]]:
        """
        Get the most recent biomarker record for a user.

        Args:
            user_id: User's UUID

        Returns:
            Latest biomarker record, or None if not found
        """
        pool = await self._get_pool()

        query = """
            SELECT id, user_id, assessment_id, lab_date, lab_source,
                   values, abnormal_count, critical_count, notes,
                   verified_by, verified_at, created_at
            FROM biomarkers
            WHERE user_id = $1
            ORDER BY lab_date DESC
            LIMIT 1
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id)

            if not row:
                return None

            result = dict(row)
            if result.get("values"):
                result["values"] = json.loads(result["values"])
            return result

    async def get_user_biomarkers(
        self,
        user_id: UUID,
        *,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """
        Get biomarker history for a user.

        Args:
            user_id: User's UUID
            limit: Maximum number of results
            offset: Offset for pagination

        Returns:
            List of biomarker records
        """
        pool = await self._get_pool()

        query = """
            SELECT id, lab_date, lab_source, values,
                   abnormal_count, critical_count, created_at
            FROM biomarkers
            WHERE user_id = $1
            ORDER BY lab_date DESC
            LIMIT $2 OFFSET $3
        """

        async with pool.acquire() as conn:
            rows = await conn.fetch(query, user_id, limit, offset)

            results = []
            for r in rows:
                result = dict(r)
                if result.get("values"):
                    result["values"] = json.loads(result["values"])
                results.append(result)
            return results

    async def get_biomarker_trend(
        self,
        user_id: UUID,
        biomarker_name: str,
        *,
        limit: int = 12,
    ) -> list[dict[str, Any]]:
        """
        Get trend data for a specific biomarker over time.

        Args:
            user_id: User's UUID
            biomarker_name: Name of the biomarker (e.g., "crp", "glucose_fasting")
            limit: Maximum number of data points

        Returns:
            List of {date, value, unit, flag} dicts ordered by date ascending
        """
        pool = await self._get_pool()

        query = """
            SELECT lab_date, values
            FROM biomarkers
            WHERE user_id = $1
              AND values ? $2
            ORDER BY lab_date DESC
            LIMIT $3
        """

        async with pool.acquire() as conn:
            rows = await conn.fetch(query, user_id, biomarker_name, limit)

            results = []
            for r in rows:
                values = json.loads(r["values"])
                biomarker_data = values.get(biomarker_name, {})
                results.append({
                    "date": r["lab_date"],
                    "value": biomarker_data.get("value"),
                    "unit": biomarker_data.get("unit"),
                    "flag": biomarker_data.get("flag"),
                    "ref_low": biomarker_data.get("ref_low"),
                    "ref_high": biomarker_data.get("ref_high"),
                })

            # Return in chronological order
            return list(reversed(results))

    async def get_abnormal_biomarkers(
        self, user_id: UUID
    ) -> list[dict[str, Any]]:
        """
        Get all abnormal biomarkers from the latest lab report.

        Args:
            user_id: User's UUID

        Returns:
            List of abnormal biomarker details
        """
        latest = await self.get_latest_biomarkers(user_id)

        if not latest or not latest.get("values"):
            return []

        abnormal = []
        for name, data in latest["values"].items():
            flag = data.get("flag", "").lower()
            if flag in ("low", "high", "critical"):
                abnormal.append({
                    "biomarker": name,
                    "value": data.get("value"),
                    "unit": data.get("unit"),
                    "flag": flag,
                    "ref_low": data.get("ref_low"),
                    "ref_high": data.get("ref_high"),
                    "lab_date": latest["lab_date"],
                })

        return abnormal

    async def verify_biomarkers(
        self, biomarker_id: UUID, verified_by: UUID
    ) -> bool:
        """
        Mark a biomarker record as verified by a provider.

        Args:
            biomarker_id: Biomarker record UUID
            verified_by: Provider's user UUID

        Returns:
            True if verified, False if record not found
        """
        pool = await self._get_pool()

        query = """
            UPDATE biomarkers
            SET verified_by = $2, verified_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id
        """

        async with pool.acquire() as conn:
            result = await conn.fetchrow(query, biomarker_id, verified_by)
            return result is not None

    async def delete_biomarkers(self, biomarker_id: UUID) -> bool:
        """
        Delete a biomarker record.

        Args:
            biomarker_id: Biomarker record UUID

        Returns:
            True if deleted, False if not found
        """
        pool = await self._get_pool()

        query = "DELETE FROM biomarkers WHERE id = $1 RETURNING id"

        async with pool.acquire() as conn:
            result = await conn.fetchrow(query, biomarker_id)
            return result is not None


# Common biomarker reference ranges for validation
BIOMARKER_REFERENCES = {
    # Inflammation markers
    "crp": {"unit": "mg/L", "ref_low": 0, "ref_high": 3.0, "name": "C-Reactive Protein"},
    "crp_hs": {"unit": "mg/L", "ref_low": 0, "ref_high": 1.0, "name": "High-Sensitivity CRP"},
    "esr": {"unit": "mm/hr", "ref_low": 0, "ref_high": 20, "name": "Erythrocyte Sedimentation Rate"},

    # Metabolic markers
    "glucose_fasting": {"unit": "mg/dL", "ref_low": 70, "ref_high": 99, "name": "Fasting Glucose"},
    "hba1c": {"unit": "%", "ref_low": 4.0, "ref_high": 5.6, "name": "Hemoglobin A1c"},
    "insulin_fasting": {"unit": "uIU/mL", "ref_low": 2.6, "ref_high": 24.9, "name": "Fasting Insulin"},

    # Lipids
    "cholesterol_total": {"unit": "mg/dL", "ref_low": 0, "ref_high": 200, "name": "Total Cholesterol"},
    "ldl": {"unit": "mg/dL", "ref_low": 0, "ref_high": 100, "name": "LDL Cholesterol"},
    "hdl": {"unit": "mg/dL", "ref_low": 40, "ref_high": 999, "name": "HDL Cholesterol"},
    "triglycerides": {"unit": "mg/dL", "ref_low": 0, "ref_high": 150, "name": "Triglycerides"},

    # Vitamins & minerals
    "vitamin_d": {"unit": "ng/mL", "ref_low": 30, "ref_high": 100, "name": "Vitamin D (25-OH)"},
    "vitamin_b12": {"unit": "pg/mL", "ref_low": 200, "ref_high": 900, "name": "Vitamin B12"},
    "ferritin": {"unit": "ng/mL", "ref_low": 12, "ref_high": 300, "name": "Ferritin"},
    "iron": {"unit": "ug/dL", "ref_low": 60, "ref_high": 170, "name": "Iron"},
    "magnesium": {"unit": "mg/dL", "ref_low": 1.7, "ref_high": 2.2, "name": "Magnesium"},

    # Kidney function
    "creatinine": {"unit": "mg/dL", "ref_low": 0.7, "ref_high": 1.3, "name": "Creatinine"},
    "egfr": {"unit": "mL/min/1.73m2", "ref_low": 90, "ref_high": 999, "name": "eGFR"},
    "bun": {"unit": "mg/dL", "ref_low": 7, "ref_high": 20, "name": "Blood Urea Nitrogen"},

    # Liver function
    "alt": {"unit": "U/L", "ref_low": 7, "ref_high": 56, "name": "ALT"},
    "ast": {"unit": "U/L", "ref_low": 10, "ref_high": 40, "name": "AST"},
    "alp": {"unit": "U/L", "ref_low": 44, "ref_high": 147, "name": "Alkaline Phosphatase"},

    # Thyroid
    "tsh": {"unit": "mIU/L", "ref_low": 0.4, "ref_high": 4.0, "name": "TSH"},
    "t3_free": {"unit": "pg/mL", "ref_low": 2.0, "ref_high": 4.4, "name": "Free T3"},
    "t4_free": {"unit": "ng/dL", "ref_low": 0.8, "ref_high": 1.8, "name": "Free T4"},

    # Hormones
    "testosterone_total": {"unit": "ng/dL", "ref_low": 300, "ref_high": 1000, "name": "Total Testosterone"},
    "cortisol_am": {"unit": "ug/dL", "ref_low": 6.2, "ref_high": 19.4, "name": "AM Cortisol"},

    # Blood count
    "hemoglobin": {"unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5, "name": "Hemoglobin"},
    "hematocrit": {"unit": "%", "ref_low": 36, "ref_high": 50, "name": "Hematocrit"},
    "wbc": {"unit": "K/uL", "ref_low": 4.5, "ref_high": 11.0, "name": "White Blood Cells"},
    "platelets": {"unit": "K/uL", "ref_low": 150, "ref_high": 400, "name": "Platelets"},
}


def flag_biomarker_value(
    biomarker_name: str, value: float, ref_low: Optional[float] = None, ref_high: Optional[float] = None
) -> str:
    """
    Determine the flag for a biomarker value based on reference ranges.

    Args:
        biomarker_name: Name of the biomarker
        value: Measured value
        ref_low: Lower reference limit (uses default if not provided)
        ref_high: Upper reference limit (uses default if not provided)

    Returns:
        Flag string: "normal", "low", "high", or "critical"
    """
    # Use defaults if not provided
    if ref_low is None or ref_high is None:
        defaults = BIOMARKER_REFERENCES.get(biomarker_name, {})
        ref_low = ref_low or defaults.get("ref_low")
        ref_high = ref_high or defaults.get("ref_high")

    if ref_low is None or ref_high is None:
        return "unknown"

    if value < ref_low:
        # Critical if more than 20% below
        if value < ref_low * 0.8:
            return "critical"
        return "low"
    elif value > ref_high:
        # Critical if more than 20% above
        if value > ref_high * 1.2:
            return "critical"
        return "high"
    else:
        return "normal"
