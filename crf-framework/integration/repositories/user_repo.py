"""
User repository for database operations.

Provides CRUD operations for users and user profiles.
"""

import json
from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

import asyncpg

from ..db import get_db_pool


class UserRepository:
    """Repository for user-related database operations."""

    def __init__(self, pool: Optional[asyncpg.Pool] = None):
        self._pool = pool

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await get_db_pool()
        return self._pool

    async def create_user(
        self,
        email: str,
        password_hash: Optional[str] = None,
        full_name: Optional[str] = None,
        gender: Optional[str] = None,
        date_of_birth: Optional[date] = None,
    ) -> dict[str, Any]:
        """
        Create a new user.

        Args:
            email: User's email address (unique)
            password_hash: Hashed password
            full_name: User's full name
            gender: User's gender
            date_of_birth: User's date of birth

        Returns:
            Created user record as dict
        """
        pool = await self._get_pool()

        query = """
            INSERT INTO users (email, password_hash, full_name, gender, date_of_birth)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, full_name, gender, date_of_birth, created_at,
                      subscription_tier, subscription_status, is_active
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                query, email, password_hash, full_name, gender, date_of_birth
            )
            return dict(row)

    async def get_user_by_id(self, user_id: UUID) -> Optional[dict[str, Any]]:
        """
        Get a user by ID.

        Args:
            user_id: User's UUID

        Returns:
            User record as dict, or None if not found
        """
        pool = await self._get_pool()

        query = """
            SELECT id, email, full_name, gender, date_of_birth, created_at,
                   updated_at, last_login, subscription_tier, subscription_status,
                   email_verified, is_active
            FROM users
            WHERE id = $1 AND is_active = true
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id)
            return dict(row) if row else None

    async def get_user_by_email(self, email: str) -> Optional[dict[str, Any]]:
        """
        Get a user by email address.

        Args:
            email: User's email address

        Returns:
            User record as dict, or None if not found
        """
        pool = await self._get_pool()

        query = """
            SELECT id, email, password_hash, full_name, gender, date_of_birth,
                   created_at, updated_at, last_login, subscription_tier,
                   subscription_status, email_verified, is_active
            FROM users
            WHERE email = $1 AND is_active = true
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, email)
            return dict(row) if row else None

    async def update_user(
        self, user_id: UUID, **updates: Any
    ) -> Optional[dict[str, Any]]:
        """
        Update a user's fields.

        Args:
            user_id: User's UUID
            **updates: Fields to update (email, full_name, etc.)

        Returns:
            Updated user record, or None if not found
        """
        if not updates:
            return await self.get_user_by_id(user_id)

        pool = await self._get_pool()

        # Build dynamic update query
        allowed_fields = {
            "email",
            "full_name",
            "gender",
            "date_of_birth",
            "subscription_tier",
            "subscription_status",
            "email_verified",
        }
        fields = {k: v for k, v in updates.items() if k in allowed_fields}

        if not fields:
            return await self.get_user_by_id(user_id)

        set_clauses = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(fields.keys()))
        values = list(fields.values())

        query = f"""
            UPDATE users
            SET {set_clauses}
            WHERE id = $1 AND is_active = true
            RETURNING id, email, full_name, gender, date_of_birth, created_at,
                      subscription_tier, subscription_status, is_active
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id, *values)
            return dict(row) if row else None

    async def update_last_login(self, user_id: UUID) -> None:
        """Update the user's last login timestamp."""
        pool = await self._get_pool()

        query = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1"

        async with pool.acquire() as conn:
            await conn.execute(query, user_id)

    async def soft_delete_user(self, user_id: UUID) -> bool:
        """
        Soft delete a user (set is_active to false).

        Args:
            user_id: User's UUID

        Returns:
            True if user was deleted, False if not found
        """
        pool = await self._get_pool()

        query = """
            UPDATE users SET is_active = false WHERE id = $1 AND is_active = true
            RETURNING id
        """

        async with pool.acquire() as conn:
            result = await conn.fetchrow(query, user_id)
            return result is not None

    # -------------------------------------------------------------------------
    # User Profile Operations
    # -------------------------------------------------------------------------

    async def get_user_profile(self, user_id: UUID) -> Optional[dict[str, Any]]:
        """
        Get a user's profile.

        Args:
            user_id: User's UUID

        Returns:
            Profile record as dict, or None if not found
        """
        pool = await self._get_pool()

        query = """
            SELECT id, user_id, height_cm, current_weight_kg, occupation,
                   activity_level, health_conditions, medications, goals,
                   preferences, updated_at
            FROM user_profiles
            WHERE user_id = $1
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id)
            if row:
                result = dict(row)
                # Parse JSONB fields
                for field in ["health_conditions", "medications", "goals", "preferences"]:
                    if result.get(field):
                        result[field] = json.loads(result[field])
                return result
            return None

    async def upsert_user_profile(
        self, user_id: UUID, **profile_data: Any
    ) -> dict[str, Any]:
        """
        Create or update a user's profile.

        Args:
            user_id: User's UUID
            **profile_data: Profile fields to set

        Returns:
            Profile record as dict
        """
        pool = await self._get_pool()

        # Convert dict/list fields to JSON
        jsonb_fields = {"health_conditions", "medications", "goals", "preferences"}
        for field in jsonb_fields:
            if field in profile_data and isinstance(profile_data[field], (dict, list)):
                profile_data[field] = json.dumps(profile_data[field])

        # Build upsert query
        fields = list(profile_data.keys())
        placeholders = ", ".join(f"${i+2}" for i in range(len(fields)))
        update_clause = ", ".join(f"{f} = EXCLUDED.{f}" for f in fields)

        query = f"""
            INSERT INTO user_profiles (user_id, {', '.join(fields)})
            VALUES ($1, {placeholders})
            ON CONFLICT (user_id)
            DO UPDATE SET {update_clause}
            RETURNING id, user_id, height_cm, current_weight_kg, occupation,
                      activity_level, health_conditions, medications, goals,
                      preferences, updated_at
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id, *profile_data.values())
            result = dict(row)
            # Parse JSONB fields
            for field in jsonb_fields:
                if result.get(field):
                    result[field] = json.loads(result[field])
            return result

    async def get_user_with_profile(self, user_id: UUID) -> Optional[dict[str, Any]]:
        """
        Get a user with their profile in a single query.

        Args:
            user_id: User's UUID

        Returns:
            User record with nested profile, or None if not found
        """
        pool = await self._get_pool()

        query = """
            SELECT
                u.id, u.email, u.full_name, u.gender, u.date_of_birth,
                u.created_at, u.subscription_tier, u.subscription_status,
                p.height_cm, p.current_weight_kg, p.occupation, p.activity_level,
                p.health_conditions, p.medications, p.goals, p.preferences
            FROM users u
            LEFT JOIN user_profiles p ON p.user_id = u.id
            WHERE u.id = $1 AND u.is_active = true
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id)
            if not row:
                return None

            result = dict(row)
            # Parse JSONB fields
            for field in ["health_conditions", "medications", "goals", "preferences"]:
                if result.get(field):
                    result[field] = json.loads(result[field])
            return result
