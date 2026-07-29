import asyncio
import uuid
from sqlalchemy import select
from datetime import datetime, timezone

from app.db.session import async_session_factory, engine
from app.db.base import Base
from app.models import User, Workspace
from app.models.project import Project
from app.models.space import Space, Page
from app.core.security import hash_password
from app.services.project_service import create_project
from app.services.issue_service import create_issue
from app.services.space_service import create_space as create_space_svc
from app.services.page_service import create_page as create_page_svc
from app.services.workspace_service import create_workspace

SEED_USER_EMAIL = "admin@tolab.dev"
SEED_USER_NAME = "Tolab Admin"
SEED_USER_PASSWORD = "tolab-admin"
SEED_WORKSPACE_NAME = "Tolab HQ"
SEED_WORKSPACE_SLUG = "tolab-hq"

PROJECTS = [
    {"key": "TOL", "name": "Tolab Platform", "type": "software"},
    {"key": "MOB", "name": "Mobile App", "type": "software"},
    {"key": "DOCS", "name": "Documentation", "type": "business"},
]

ISSUES = {
    "TOL": [
        {"summary": "User login with refresh tokens", "description": "<p>Implement token rotation with refresh tokens stored in secure cookies.</p>"},
        {"summary": "Kanban board drag and drop", "description": "<p>Add drag-to-move between columns using dnd-kit</p>"},
        {"summary": "Full-text search for issues and pages", "description": "<p>Integrate PostgreSQL FTS or SQLite LIKE for cross-workspace search</p>"},
        {"summary": "Notification email delivery", "description": "<p>Send email notifications for mentions and issue assignments</p>"},
    ],
    "MOB": [
        {"summary": "Design onboarding screens", "description": "<p>Create wireframes for new user onboarding flow</p>"},
        {"summary": "API rate limiting", "description": "<p>Add per-user rate limits for public API endpoints</p>"},
    ],
    "DOCS": [
        {"summary": "Write API documentation", "description": "<p>Document all v1 endpoints with examples</p>"},
    ],
}

SPACES = [
    {"key": "eng", "name": "Engineering", "description": "Engineering team docs and RFCs"},
    {"key": "design", "name": "Design", "description": "Design system, mockups, and guidelines"},
]

PAGES = {
    "eng": [
        {"title": "Architecture Overview", "body": "<h2>System Architecture</h2><p>Tolab is built as a monorepo with FastAPI backend and React frontend.</p><ul><li>Backend: Python 3.12 + FastAPI + SQLAlchemy</li><li>Frontend: React 19 + TypeScript + Tailwind v4</li><li>Database: SQLite (dev) / PostgreSQL (prod)</li></ul>"},
        {"title": "Coding Standards", "body": "<h2>Coding Standards</h2><p>All code must follow these conventions:</p><ol><li>TypeScript strict mode for frontend</li><li>Pydantic v2 schemas for all API models</li><li>Async SQLAlchemy for all DB operations</li><li>No hardcoded secrets — use .env</li></ol>"},
    ],
    "design": [
        {"title": "Color Palette", "body": "<h2>Design Tokens</h2><p>Primary: HSL(221, 83%, 53%)</p><p>Background: HSL(0, 0%, 100%)</p><p>We use Tailwind v4 with shadcn/ui components.</p>"},
    ],
}


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        existing = await db.execute(select(User).where(User.email == SEED_USER_EMAIL))
        admin = existing.scalar_one_or_none()
        if admin is None:
            admin = User(
                email=SEED_USER_EMAIL,
                full_name=SEED_USER_NAME,
                hashed_password=hash_password(SEED_USER_PASSWORD),
            )
            db.add(admin)
            await db.flush()
        else:
            admin.hashed_password = hash_password(SEED_USER_PASSWORD)
            await db.commit()

        ws_res = await db.execute(select(Workspace).where(Workspace.slug == SEED_WORKSPACE_SLUG))
        workspace = ws_res.scalar_one_or_none()
        if workspace is not None:
            print("Seed workspace already exists — skipped re-creation.")
            return

        workspace = await create_workspace(db, SEED_WORKSPACE_NAME, SEED_WORKSPACE_SLUG, "free", admin.id)
        ws_id = workspace.id

        for proj_data in PROJECTS:
            project = await create_project(db, ws_id, proj_data["key"], proj_data["name"], proj_data["type"])
            for issue_data in ISSUES.get(proj_data["key"], []):
                await create_issue(db, proj_data["key"], project.id, issue_data, admin.id)

        for space_data in SPACES:
            space = await create_space_svc(db, ws_id, space_data["key"], space_data["name"], space_data.get("description"), None)
            for page_data in PAGES.get(space_data["key"], []):
                slug = page_data["title"].lower().replace(" ", "-").replace("/", "-")
                await create_page_svc(db, space.id, None, page_data["title"], slug, page_data["body"], admin.id)

        print()
        print("==================== SEED DATA CREATED ====================")
        print(f"  Workshop: {SEED_WORKSPACE_NAME} ({SEED_WORKSPACE_SLUG})")
        print(f"  User:     {SEED_USER_EMAIL} / {SEED_USER_PASSWORD}")
        print(f"  Projects: {len(PROJECTS)} ({', '.join(p['key'] for p in PROJECTS)})")
        print(f"  Issues:   {sum(len(v) for v in ISSUES.values())} total")
        print(f"  Spaces:   {len(SPACES)} ({', '.join(s['key'] for s in SPACES)})")
        print(f"  Pages:    {sum(len(v) for v in PAGES.values())} total")
        print("==========================================================")


if __name__ == "__main__":
    asyncio.run(seed())