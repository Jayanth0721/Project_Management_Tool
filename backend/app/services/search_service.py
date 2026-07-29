from uuid import UUID

from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Issue
from app.models.space import Page
from app.models.workspace import WorkspaceMember
from app.core.config import settings


def _is_postgres() -> bool:
    url = settings.resolved_database_url
    return url.startswith("postgresql")


async def search_issues(
    db: AsyncSession,
    workspace_id: UUID,
    query: str,
    limit: int = 20,
    offset: int = 0,
) -> list[dict]:
    stmt = select(Issue).join(WorkspaceMember, Issue.project_id == WorkspaceMember.workspace_id, isouter=True).where(
        WorkspaceMember.workspace_id == workspace_id
    )

    if _is_postgres():
        tsq = func.plainto_tsquery("english", query)
        stmt = stmt.where(
            func.to_tsvector("english", Issue.summary + " " + func.coalesce(Issue.description, "")).op("@@")(tsq)
        ).order_by(func.ts_rank(func.to_tsvector("english", Issue.summary + " " + func.coalesce(Issue.description, "")), tsq).desc())
    else:
        pattern = f"%{query}%"
        stmt = stmt.where(
            or_(Issue.summary.ilike(pattern), Issue.description.ilike(pattern))
        ).order_by(Issue.created_at.desc())

    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    issues = result.scalars().all()
    return [
        {
            "type": "issue",
            "id": str(i.id),
            "key": i.key,
            "summary": i.summary,
            "description": i.description,
            "project_id": str(i.project_id),
            "status_id": str(i.status_id) if i.status_id else None,
            "assignee_id": str(i.assignee_id) if i.assignee_id else None,
            "created_at": i.created_at.isoformat() if i.created_at else None,
        }
        for i in issues
    ]


async def search_pages(
    db: AsyncSession,
    workspace_id: UUID,
    query: str,
    limit: int = 20,
    offset: int = 0,
) -> list[dict]:
    stmt = select(Page).join(WorkspaceMember, Page.space_id == WorkspaceMember.workspace_id, isouter=True).where(
        WorkspaceMember.workspace_id == workspace_id
    )

    if _is_postgres():
        tsq = func.plainto_tsquery("english", query)
        stmt = stmt.where(
            func.to_tsvector("english", Page.title + " " + func.coalesce(Page.body, "")).op("@@")(tsq)
        ).order_by(func.ts_rank(func.to_tsvector("english", Page.title + " " + func.coalesce(Page.body, "")), tsq).desc())
    else:
        pattern = f"%{query}%"
        stmt = stmt.where(
            or_(Page.title.ilike(pattern), Page.body.ilike(pattern))
        ).order_by(Page.created_at.desc())

    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    pages = result.scalars().all()
    return [
        {
            "type": "page",
            "id": str(p.id),
            "title": p.title,
            "slug": p.slug,
            "space_id": str(p.space_id),
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in pages
    ]


async def search_all(
    db: AsyncSession,
    workspace_id: UUID,
    query: str,
    limit: int = 20,
    offset: int = 0,
) -> list[dict]:
    issues = await search_issues(db, workspace_id, query, limit, offset)
    pages = await search_pages(db, workspace_id, query, limit, offset)
    combined = sorted(issues + pages, key=lambda x: x.get("created_at") or "", reverse=True)
    return combined[:limit]
