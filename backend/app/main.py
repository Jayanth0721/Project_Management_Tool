from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.redis import get_redis, close_redis
from app.core.logging import configure_logging
from app.core.middleware import RateLimitMiddleware, add_request_id_middleware, add_csrf_middleware, add_workspace_context_middleware
from app.db.base import Base
from app.db.session import engine
from app.api.v1 import api_router

configure_logging(settings.log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    _redis = await get_redis()
    yield
    await close_redis()


app = FastAPI(
    title="Tolab API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)
add_request_id_middleware(app)
add_workspace_context_middleware(app)
add_csrf_middleware(app)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"message": "Tolab API is running", "docs": "/docs"}