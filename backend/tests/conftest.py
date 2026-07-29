import os
import uuid

os.environ["POSTGRES_HOST"] = "localhost"
os.environ["POSTGRES_PORT"] = "5432"

os.environ["POSTGRES_USER"] = "tolab"
os.environ["POSTGRES_PASSWORD"] = "tolab"
os.environ["POSTGRES_DB"] = "tolab"
os.environ["SECRET_KEY"] = "test-secret-key-at-least-32-characters-long-for-jwt-hs256"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.core.config import settings


TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(TEST_DATABASE_URL, echo=False, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(loop_scope="function")
async def async_client():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with TestSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client

    app.dependency_overrides.clear()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)