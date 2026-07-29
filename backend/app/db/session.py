from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

from app.core.config import settings

connect_args = {}
url = settings.resolved_database_url
if url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_async_engine(url, echo=False, connect_args=connect_args)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()