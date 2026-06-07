"""
Database connection module using asyncpg.

Provides connection pool management for async database operations.
"""

import os
from dataclasses import dataclass
from typing import Optional
import asyncpg


@dataclass
class DatabaseSettings:
    """Database configuration settings."""

    host: str = "localhost"
    port: int = 5432
    database: str = "muscle_meta"
    user: str = "postgres"
    password: str = ""
    min_connections: int = 2
    max_connections: int = 10
    ssl: bool = False

    @classmethod
    def from_env(cls) -> "DatabaseSettings":
        """
        Load settings from environment variables.

        Supports DATABASE_URL or individual DB_* variables.
        """
        database_url = os.environ.get("DATABASE_URL")

        if database_url:
            return cls.from_url(database_url)

        return cls(
            host=os.environ.get("DB_HOST", "localhost"),
            port=int(os.environ.get("DB_PORT", "5432")),
            database=os.environ.get("DB_NAME", "muscle_meta"),
            user=os.environ.get("DB_USER", "postgres"),
            password=os.environ.get("DB_PASSWORD", ""),
            min_connections=int(os.environ.get("DB_MIN_CONNECTIONS", "2")),
            max_connections=int(os.environ.get("DB_MAX_CONNECTIONS", "10")),
            ssl=os.environ.get("DB_SSL", "false").lower() == "true",
        )

    @classmethod
    def from_url(cls, url: str) -> "DatabaseSettings":
        """
        Parse a DATABASE_URL into settings.

        Supports format: postgresql://user:password@host:port/database
        """
        # Handle postgres:// vs postgresql://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)

        # Parse URL components
        from urllib.parse import urlparse, parse_qs

        parsed = urlparse(url)

        # Extract SSL from query params
        query_params = parse_qs(parsed.query)
        ssl = query_params.get("sslmode", ["disable"])[0] != "disable"

        return cls(
            host=parsed.hostname or "localhost",
            port=parsed.port or 5432,
            database=(parsed.path or "/muscle_meta").lstrip("/"),
            user=parsed.username or "postgres",
            password=parsed.password or "",
            ssl=ssl,
        )

    def to_dsn(self) -> str:
        """Convert settings to a DSN connection string."""
        ssl_param = "?sslmode=require" if self.ssl else ""
        return (
            f"postgresql://{self.user}:{self.password}@"
            f"{self.host}:{self.port}/{self.database}{ssl_param}"
        )


# Global connection pool (singleton pattern)
_pool: Optional[asyncpg.Pool] = None


async def get_db_pool(settings: Optional[DatabaseSettings] = None) -> asyncpg.Pool:
    """
    Get or create the database connection pool.

    Uses singleton pattern - creates pool on first call, returns existing pool thereafter.

    Args:
        settings: Optional database settings. If not provided, loads from environment.

    Returns:
        asyncpg connection pool

    Example:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            result = await conn.fetch("SELECT * FROM users WHERE id = $1", user_id)
    """
    global _pool

    if _pool is not None:
        return _pool

    if settings is None:
        settings = DatabaseSettings.from_env()

    _pool = await asyncpg.create_pool(
        host=settings.host,
        port=settings.port,
        database=settings.database,
        user=settings.user,
        password=settings.password,
        min_size=settings.min_connections,
        max_size=settings.max_connections,
        ssl=settings.ssl if settings.ssl else None,
    )

    return _pool


async def close_db_pool() -> None:
    """Close the database connection pool."""
    global _pool

    if _pool is not None:
        await _pool.close()
        _pool = None


async def init_db(settings: Optional[DatabaseSettings] = None) -> asyncpg.Pool:
    """
    Initialize database connection and verify connectivity.

    Args:
        settings: Optional database settings

    Returns:
        asyncpg connection pool

    Raises:
        ConnectionError: If database connection fails
    """
    pool = await get_db_pool(settings)

    # Test connection
    async with pool.acquire() as conn:
        version = await conn.fetchval("SELECT version()")
        if "PostgreSQL" not in version:
            raise ConnectionError("Connected to non-PostgreSQL database")

    return pool


class DatabaseSession:
    """
    Context manager for database sessions with automatic connection handling.

    Example:
        async with DatabaseSession() as session:
            users = await session.fetch("SELECT * FROM users")
    """

    def __init__(self, pool: Optional[asyncpg.Pool] = None):
        self._pool = pool
        self._conn: Optional[asyncpg.Connection] = None

    async def __aenter__(self) -> asyncpg.Connection:
        if self._pool is None:
            self._pool = await get_db_pool()
        self._conn = await self._pool.acquire()
        return self._conn

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._conn is not None and self._pool is not None:
            await self._pool.release(self._conn)
            self._conn = None


class DatabaseTransaction:
    """
    Context manager for database transactions with automatic commit/rollback.

    Example:
        async with DatabaseTransaction() as tx:
            await tx.execute("INSERT INTO users ...")
            await tx.execute("INSERT INTO user_profiles ...")
            # Automatically commits on success, rolls back on exception
    """

    def __init__(self, pool: Optional[asyncpg.Pool] = None):
        self._pool = pool
        self._conn: Optional[asyncpg.Connection] = None
        self._transaction = None

    async def __aenter__(self) -> asyncpg.Connection:
        if self._pool is None:
            self._pool = await get_db_pool()
        self._conn = await self._pool.acquire()
        self._transaction = self._conn.transaction()
        await self._transaction.start()
        return self._conn

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._transaction is not None:
            if exc_type is not None:
                await self._transaction.rollback()
            else:
                await self._transaction.commit()

        if self._conn is not None and self._pool is not None:
            await self._pool.release(self._conn)
            self._conn = None
