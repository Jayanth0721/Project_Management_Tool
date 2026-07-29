from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.space import Page, PageVersion
from app.models.user import utcnow


async def create_page(
    db: AsyncSession,
    space_id: UUID,
    parent_page_id: UUID | None,
    title: str,
    slug: str,
    body: str | None,
    author_id: UUID,
    status: str = "draft",
) -> Page:
    if parent_page_id is not None:
        parent = await db.get(Page, parent_page_id)
        if parent is None or str(parent.space_id) != str(space_id):
            raise ValueError("Parent page not found in this space")

    page = Page(
        space_id=space_id,
        parent_page_id=parent_page_id,
        title=title,
        slug=slug,
        body=body,
        author_id=author_id,
        status=status,
        version=1,
    )
    db.add(page)
    await db.flush()

    page_version = PageVersion(
        page_id=page.id,
        version=1,
        body=body,
        author_id=author_id,
        message="Initial version",
    )
    db.add(page_version)
    await db.commit()
    await db.refresh(page)
    return page


async def get_page_tree(db: AsyncSession, space_id: UUID) -> list[dict]:
    result = await db.execute(
        select(Page)
        .where(Page.space_id == space_id)
        .order_by(Page.position)
    )
    pages = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "parent_page_id": str(p.parent_page_id) if p.parent_page_id else None,
            "title": p.title,
            "slug": p.slug,
            "version": p.version,
            "status": p.status,
            "position": p.position,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        }
        for p in pages
    ]


async def get_page_with_versions(
    db: AsyncSession, page_id: UUID
) -> tuple[Page | None, list[PageVersion]]:
    page = await db.get(Page, page_id)
    if page is None:
        return None, []

    result = await db.execute(
        select(PageVersion)
        .where(PageVersion.page_id == page_id)
        .order_by(PageVersion.created_at.desc())
    )
    versions = list(result.scalars().all())
    return page, versions


async def update_page(
    db: AsyncSession, page: Page, data: dict, author_id: UUID
) -> Page:
    body_changed = False
    if "title" in data and data["title"] is not None:
        page.title = data["title"]
    if "slug" in data and data["slug"] is not None:
        page.slug = data["slug"]
    if "body" in data:
        new_body = data["body"]
        if new_body != page.body:
            body_changed = True
            page.body = new_body
    if "parent_page_id" in data:
        page.parent_page_id = data["parent_page_id"]
    if "position" in data and data["position"] is not None:
        page.position = data["position"]
    if "status" in data and data["status"] is not None:
        page.status = data["status"]

    if body_changed:
        page.version = page.version + 1
        page_version = PageVersion(
            page_id=page.id,
            version=page.version,
            body=data["body"],
            author_id=author_id,
            message="Updated",
        )
        db.add(page_version)

    await db.commit()
    await db.refresh(page)
    return page


async def delete_page(db: AsyncSession, page: Page) -> None:
    await db.delete(page)
    await db.commit()