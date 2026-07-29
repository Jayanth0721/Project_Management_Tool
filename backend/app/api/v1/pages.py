from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.space import Space, Page
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, AuthError
from app.services.page_service import (
    create_page as create_page_svc,
    get_page_tree,
    get_page_with_versions,
    update_page as update_page_svc,
    delete_page as delete_page_svc,
)

router = APIRouter()


def _page_to_dict(page: Page) -> dict:
    return {
        "id": str(page.id),
        "space_id": str(page.space_id),
        "parent_page_id": str(page.parent_page_id) if page.parent_page_id else None,
        "title": page.title,
        "slug": page.slug,
        "body": page.body,
        "version": page.version,
        "status": page.status,
        "position": page.position,
        "created_at": page.created_at.isoformat() if page.created_at else None,
        "updated_at": page.updated_at.isoformat() if page.updated_at else None,
    }


@router.get("/{space_id}/pages")
async def list_pages(
    space_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    space = await db.get(Space, space_id)
    if space is None:
        raise NotFoundError("Space not found")

    member = await db.get(WorkspaceMember, (space.workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)

    return await get_page_tree(db, space_id)


@router.post("/{space_id}/pages", status_code=status.HTTP_201_CREATED)
async def create_page(
    space_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    space = await db.get(Space, space_id)
    if space is None:
        raise NotFoundError("Space not found")

    member = await db.get(WorkspaceMember, (space.workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Insufficient permissions", status.HTTP_403_FORBIDDEN)

    page = await create_page_svc(
        db,
        space_id,
        data.get("parent_page_id"),
        data["title"],
        data["slug"],
        data.get("body"),
        current_user.id,
        data.get("status", "draft"),
    )
    return _page_to_dict(page)


@router.get("/{space_id}/pages/{page_id}")
async def get_page(
    space_id: UUID,
    page_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    space = await db.get(Space, space_id)
    if space is None:
        raise NotFoundError("Space not found")

    member = await db.get(WorkspaceMember, (space.workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)

    page, versions = await get_page_with_versions(db, page_id)
    if page is None:
        raise NotFoundError("Page not found")

    if str(page.space_id) != str(space_id):
        raise NotFoundError("Page not found in this space")

    return {
        **_page_to_dict(page),
        "versions": [
            {
                "id": str(v.id),
                "page_id": str(v.page_id),
                "version": v.version,
                "body": v.body,
                "author_id": str(v.author_id) if v.author_id else None,
                "message": v.message,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in versions
        ],
    }


@router.patch("/{space_id}/pages/{page_id}")
async def update_page(
    space_id: UUID,
    page_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    space = await db.get(Space, space_id)
    if space is None:
        raise NotFoundError("Space not found")

    member = await db.get(WorkspaceMember, (space.workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Insufficient permissions", status.HTTP_403_FORBIDDEN)

    page = await db.get(Page, page_id)
    if page is None:
        raise NotFoundError("Page not found")

    if str(page.space_id) != str(space_id):
        raise NotFoundError("Page not found in this space")

    page = await update_page_svc(db, page, data, current_user.id)
    return _page_to_dict(page)


@router.delete("/{space_id}/pages/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(
    space_id: UUID,
    page_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    space = await db.get(Space, space_id)
    if space is None:
        raise NotFoundError("Space not found")

    member = await db.get(WorkspaceMember, (space.workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Insufficient permissions", status.HTTP_403_FORBIDDEN)

    page = await db.get(Page, page_id)
    if page is None:
        raise NotFoundError("Page not found")

    if str(page.space_id) != str(space_id):
        raise NotFoundError("Page not found in this space")

    await delete_page_svc(db, page)


@router.get("/{space_id}/pages/{page_id}/versions")
async def page_versions(
    space_id: UUID,
    page_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    space = await db.get(Space, space_id)
    if space is None:
        raise NotFoundError("Space not found")

    member = await db.get(WorkspaceMember, (space.workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)

    page, versions = await get_page_with_versions(db, page_id)
    if page is None:
        raise NotFoundError("Page not found")

    if str(page.space_id) != str(space_id):
        raise NotFoundError("Page not found in this space")

    return [
        {
            "id": str(v.id),
            "page_id": str(v.page_id),
            "version": v.version,
            "body": v.body,
            "author_id": str(v.author_id) if v.author_id else None,
            "message": v.message,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in versions
    ]