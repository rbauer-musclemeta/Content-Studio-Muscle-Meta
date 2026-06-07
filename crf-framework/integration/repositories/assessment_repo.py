"""
Assessment repository for database operations.

Provides CRUD operations for assessments and related data.
"""

import json
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

import asyncpg

from ..db import get_db_pool, DatabaseTransaction


class AssessmentRepository:
    """Repository for assessment-related database operations."""

    def __init__(self, pool: Optional[asyncpg.Pool] = None):
        self._pool = pool

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await get_db_pool()
        return self._pool

    async def save_assessment(
        self,
        user_id: UUID,
        assessment_type: str,
        *,
        provider_id: Optional[UUID] = None,
        version: str = "1.0",
        status: str = "completed",
        total_score: Optional[int] = None,
        max_score: Optional[int] = None,
        score_percent: Optional[float] = None,
        risk_tier: Optional[int] = None,
        risk_tier_label: Optional[str] = None,
        age_adjusted_tier: Optional[int] = None,
        section_scores: Optional[dict] = None,
        domain_breakdown: Optional[list] = None,
        clinical_flags: Optional[list] = None,
        critical_flags: Optional[list] = None,
        warning_flags: Optional[list] = None,
        info_flags: Optional[list] = None,
        protective_factors: Optional[list] = None,
        recommended_assessments: Optional[list] = None,
        responses: Optional[list[dict]] = None,
    ) -> dict[str, Any]:
        """
        Save a completed assessment with all responses.

        Args:
            user_id: User's UUID
            assessment_type: Type of assessment (CRA, CCRAF, GLP1, etc.)
            provider_id: Optional provider UUID for clinical assessments
            version: Assessment version
            status: Assessment status
            total_score: Raw score
            max_score: Maximum possible score
            score_percent: Percentage score
            risk_tier: Numeric risk tier (1-5)
            risk_tier_label: Risk tier label (MINIMAL, LOW, etc.)
            age_adjusted_tier: Age-adjusted tier
            section_scores: Domain/section scores
            domain_breakdown: Breakdown for charts
            clinical_flags: All flags
            critical_flags: Urgent flags
            warning_flags: Warning flags
            info_flags: Info flags
            protective_factors: Protective factors
            recommended_assessments: Cross-referral recommendations
            responses: List of question responses

        Returns:
            Created assessment record as dict
        """
        pool = await self._get_pool()

        # Serialize JSONB fields
        def to_json(val):
            return json.dumps(val) if val else None

        assessment_query = """
            INSERT INTO assessments (
                user_id, provider_id, assessment_type, version, status,
                completed_at, total_score, max_score, score_percent,
                risk_tier, risk_tier_label, age_adjusted_tier,
                section_scores, domain_breakdown,
                clinical_flags, critical_flags, warning_flags, info_flags,
                protective_factors, recommended_assessments
            ) VALUES (
                $1, $2, $3, $4, $5,
                CASE WHEN $5 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
                $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
            )
            RETURNING id, user_id, assessment_type, version, status,
                      started_at, completed_at, total_score, max_score,
                      score_percent, risk_tier, risk_tier_label, age_adjusted_tier
        """

        async with DatabaseTransaction(pool) as conn:
            # Insert assessment
            row = await conn.fetchrow(
                assessment_query,
                user_id,
                provider_id,
                assessment_type,
                version,
                status,
                total_score,
                max_score,
                score_percent,
                risk_tier,
                risk_tier_label,
                age_adjusted_tier,
                to_json(section_scores),
                to_json(domain_breakdown),
                to_json(clinical_flags),
                to_json(critical_flags),
                to_json(warning_flags),
                to_json(info_flags),
                to_json(protective_factors),
                to_json(recommended_assessments),
            )

            assessment_id = row["id"]

            # Insert responses if provided
            if responses:
                response_query = """
                    INSERT INTO assessment_responses (
                        assessment_id, question_id, section_id, domain,
                        question_type, response_value, score, max_score
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """

                for resp in responses:
                    await conn.execute(
                        response_query,
                        assessment_id,
                        resp.get("question_id"),
                        resp.get("section_id"),
                        resp.get("domain"),
                        resp.get("question_type"),
                        json.dumps(resp.get("response_value")),
                        resp.get("score"),
                        resp.get("max_score"),
                    )

            return dict(row)

    async def get_assessment_by_id(
        self, assessment_id: UUID, include_responses: bool = False
    ) -> Optional[dict[str, Any]]:
        """
        Get an assessment by ID.

        Args:
            assessment_id: Assessment UUID
            include_responses: Whether to include question responses

        Returns:
            Assessment record as dict, or None if not found
        """
        pool = await self._get_pool()

        query = """
            SELECT id, user_id, provider_id, assessment_type, version, status,
                   started_at, completed_at, total_score, max_score, score_percent,
                   risk_tier, risk_tier_label, age_adjusted_tier,
                   section_scores, domain_breakdown,
                   clinical_flags, critical_flags, warning_flags, info_flags,
                   protective_factors, recommended_assessments,
                   created_at, updated_at
            FROM assessments
            WHERE id = $1
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, assessment_id)

            if not row:
                return None

            result = dict(row)

            # Parse JSONB fields
            jsonb_fields = [
                "section_scores",
                "domain_breakdown",
                "clinical_flags",
                "critical_flags",
                "warning_flags",
                "info_flags",
                "protective_factors",
                "recommended_assessments",
            ]
            for field in jsonb_fields:
                if result.get(field):
                    result[field] = json.loads(result[field])

            # Optionally include responses
            if include_responses:
                resp_query = """
                    SELECT question_id, section_id, domain, question_type,
                           response_value, score, max_score, answered_at
                    FROM assessment_responses
                    WHERE assessment_id = $1
                    ORDER BY answered_at
                """
                resp_rows = await conn.fetch(resp_query, assessment_id)
                result["responses"] = [
                    {
                        **dict(r),
                        "response_value": json.loads(r["response_value"]),
                    }
                    for r in resp_rows
                ]

            return result

    async def get_user_assessments(
        self,
        user_id: UUID,
        *,
        assessment_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """
        Get assessments for a user.

        Args:
            user_id: User's UUID
            assessment_type: Filter by assessment type
            status: Filter by status
            limit: Maximum number of results
            offset: Offset for pagination

        Returns:
            List of assessment records
        """
        pool = await self._get_pool()

        conditions = ["user_id = $1"]
        params: list = [user_id]
        param_idx = 2

        if assessment_type:
            conditions.append(f"assessment_type = ${param_idx}")
            params.append(assessment_type)
            param_idx += 1

        if status:
            conditions.append(f"status = ${param_idx}")
            params.append(status)
            param_idx += 1

        params.extend([limit, offset])

        query = f"""
            SELECT id, assessment_type, version, status,
                   started_at, completed_at, score_percent,
                   risk_tier, risk_tier_label, age_adjusted_tier
            FROM assessments
            WHERE {' AND '.join(conditions)}
            ORDER BY created_at DESC
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """

        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            return [dict(r) for r in rows]

    async def get_latest_assessment(
        self, user_id: UUID, assessment_type: str
    ) -> Optional[dict[str, Any]]:
        """
        Get the most recent completed assessment of a specific type.

        Args:
            user_id: User's UUID
            assessment_type: Type of assessment

        Returns:
            Latest assessment record, or None if not found
        """
        pool = await self._get_pool()

        query = """
            SELECT id, assessment_type, version, status,
                   started_at, completed_at, total_score, max_score,
                   score_percent, risk_tier, risk_tier_label, age_adjusted_tier,
                   section_scores, domain_breakdown, clinical_flags
            FROM assessments
            WHERE user_id = $1 AND assessment_type = $2 AND status = 'completed'
            ORDER BY completed_at DESC
            LIMIT 1
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id, assessment_type)

            if not row:
                return None

            result = dict(row)
            for field in ["section_scores", "domain_breakdown", "clinical_flags"]:
                if result.get(field):
                    result[field] = json.loads(result[field])
            return result

    async def get_user_risk_summary(self, user_id: UUID) -> dict[str, Any]:
        """
        Get a summary of the user's risk tiers across all assessment types.

        Args:
            user_id: User's UUID

        Returns:
            Dict with risk tier summary
        """
        pool = await self._get_pool()

        query = """
            SELECT
                assessment_type,
                risk_tier,
                risk_tier_label,
                completed_at
            FROM latest_assessments
            WHERE user_id = $1
        """

        async with pool.acquire() as conn:
            rows = await conn.fetch(query, user_id)

            if not rows:
                return {
                    "user_id": str(user_id),
                    "assessments": [],
                    "highest_risk_tier": None,
                }

            assessments = [dict(r) for r in rows]
            highest_tier = max(a["risk_tier"] for a in assessments)

            return {
                "user_id": str(user_id),
                "assessments": assessments,
                "highest_risk_tier": highest_tier,
                "assessment_count": len(assessments),
            }

    async def save_validated_instrument_result(
        self,
        assessment_id: UUID,
        user_id: UUID,
        instrument_name: str,
        *,
        instrument_version: Optional[str] = None,
        total_score: Optional[int] = None,
        max_score: Optional[int] = None,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        component_scores: Optional[dict] = None,
        interpretation: Optional[str] = None,
        clinical_action: Optional[str] = None,
        citation: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Save a validated instrument result (SARC-F, MUST, EWGSOP2).

        Args:
            assessment_id: Parent assessment UUID
            user_id: User's UUID
            instrument_name: Name of instrument (SARC-F, MUST, EWGSOP2)
            instrument_version: Version of instrument
            total_score: Total score
            max_score: Maximum possible score
            category: Result category
            severity: Severity level
            component_scores: Individual component scores
            interpretation: Clinical interpretation
            clinical_action: Recommended action
            citation: Citation for instrument

        Returns:
            Created record as dict
        """
        pool = await self._get_pool()

        query = """
            INSERT INTO validated_instrument_results (
                assessment_id, user_id, instrument_name, instrument_version,
                total_score, max_score, category, severity,
                component_scores, interpretation, clinical_action, citation
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, instrument_name, total_score, category, severity, recorded_at
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                assessment_id,
                user_id,
                instrument_name,
                instrument_version,
                total_score,
                max_score,
                category,
                severity,
                json.dumps(component_scores) if component_scores else None,
                interpretation,
                clinical_action,
                citation,
            )
            return dict(row)

    async def get_user_instrument_history(
        self, user_id: UUID, instrument_name: Optional[str] = None, limit: int = 20
    ) -> list[dict[str, Any]]:
        """
        Get validated instrument result history for a user.

        Args:
            user_id: User's UUID
            instrument_name: Optional filter by instrument
            limit: Maximum results

        Returns:
            List of instrument results
        """
        pool = await self._get_pool()

        if instrument_name:
            query = """
                SELECT id, instrument_name, total_score, max_score,
                       category, severity, component_scores, recorded_at
                FROM validated_instrument_results
                WHERE user_id = $1 AND instrument_name = $2
                ORDER BY recorded_at DESC
                LIMIT $3
            """
            params = [user_id, instrument_name, limit]
        else:
            query = """
                SELECT id, instrument_name, total_score, max_score,
                       category, severity, component_scores, recorded_at
                FROM validated_instrument_results
                WHERE user_id = $1
                ORDER BY recorded_at DESC
                LIMIT $2
            """
            params = [user_id, limit]

        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            results = []
            for r in rows:
                result = dict(r)
                if result.get("component_scores"):
                    result["component_scores"] = json.loads(result["component_scores"])
                results.append(result)
            return results

    async def create_reassessment(
        self,
        user_id: UUID,
        baseline_assessment_id: UUID,
        followup_assessment_id: UUID,
    ) -> dict[str, Any]:
        """
        Create a reassessment record comparing baseline and followup assessments.

        Args:
            user_id: User's UUID
            baseline_assessment_id: Baseline assessment UUID
            followup_assessment_id: Followup assessment UUID

        Returns:
            Reassessment record with calculated changes
        """
        pool = await self._get_pool()

        # Fetch both assessments
        async with pool.acquire() as conn:
            baseline = await conn.fetchrow(
                """
                SELECT total_score, score_percent, risk_tier, completed_at
                FROM assessments WHERE id = $1
                """,
                baseline_assessment_id,
            )

            followup = await conn.fetchrow(
                """
                SELECT total_score, score_percent, risk_tier, completed_at
                FROM assessments WHERE id = $1
                """,
                followup_assessment_id,
            )

            if not baseline or not followup:
                raise ValueError("Baseline or followup assessment not found")

            score_change = followup["total_score"] - baseline["total_score"]
            baseline_pct = baseline["score_percent"] or 0
            followup_pct = followup["score_percent"] or 0
            percent_improvement = baseline_pct - followup_pct  # Lower score = improvement

            tier_diff = baseline["risk_tier"] - followup["risk_tier"]  # Positive = improved
            tier_improved = tier_diff > 0

            # Calculate days between assessments
            days = (followup["completed_at"] - baseline["completed_at"]).days

            query = """
                INSERT INTO reassessments (
                    user_id, baseline_assessment_id, followup_assessment_id,
                    baseline_score, followup_score, score_change, percent_improvement,
                    baseline_tier, followup_tier, tier_improved, tiers_improved,
                    intervention_period_days
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            """

            row = await conn.fetchrow(
                query,
                user_id,
                baseline_assessment_id,
                followup_assessment_id,
                baseline["total_score"],
                followup["total_score"],
                score_change,
                percent_improvement,
                baseline["risk_tier"],
                followup["risk_tier"],
                tier_improved,
                tier_diff,
                days,
            )

            return dict(row)
