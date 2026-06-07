"""
Database integration module for the Muscle-Meta Assessment Ecosystem.

This module provides async database access using asyncpg for PostgreSQL.
"""

from .db import get_db_pool, DatabaseSettings

__all__ = ["get_db_pool", "DatabaseSettings"]
