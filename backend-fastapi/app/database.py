"""
app/database.py — Async SQLAlchemy engine para PostgreSQL (asyncpg)
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# Engine assíncrono
engine = create_async_engine(
    settings.database_url,
    echo=(settings.env == "development"),
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base declarativa para todos os models"""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency para injeção de sessão async"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Cria tabelas se não existirem (útil para dev; produção usa Alembic)"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    await engine.dispose()
