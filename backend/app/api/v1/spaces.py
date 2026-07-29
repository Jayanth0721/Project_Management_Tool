from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.space import Space
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, ConflictError, AuthError
from app.services.space_service import (
    create_space as create_space_svc,
    get_spaces_for_workspace,
    get_space_by_key,
    update_space as update_space_svc,
    delete_space as delete_space_svc,
)

router = APIRouter()


@router.get("/{workspace_id}/spaces")
async def list_spaces(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await db.get(Workspace, workspace_id)
    if workspace is None:
        raise NotFoundError("Workspace not found")

    member = await db.get(WorkspaceMember, (workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)

    spaces = await get_spaces_for_workspace(db, workspace_id)
    return [
        {
            "id": str(s.id),
            "workspace_id": str(s.workspace_id),
            "key": s.key,
            "name": s.name,
            "description": s.description,
            "icon": s.icon,
            "is_archived": s.is_archived,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in spaces
    ]


@router.post("/{workspace_id}/spaces", status_code=status.HTTP_201_CREATED)
async def create_space(
    workspace_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await db.get(Workspace, workspace_id)
    if workspace is None:
        raise NotFoundError("Workspace not found")

    member = await db.get(WorkspaceMember, (workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Insufficient permissions", status.HTTP_403_FORBIDDEN)

    existing = await db.execute(
        select(Space).where(
            Space.workspace_id == workspace_id, Space.key == data["key"]
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ConflictError("Space key already exists in this workspace")

    space = await create_space_svc(
        db,
        workspace_id,
        data["key"],
        data["name"],
        data.get("description"),
        data.get("icon"),
    )
    return {
        "id": str(space.id),
        "workspace_id": str(space.workspace_id),
        "key": space.key,
        "name": space.name,
        "description": space.description,
        "icon": space.icon,
        "is_archived": space.is_archived,
        "created_at": space.created_at.isoformat() if space.created_at else None,
    }


@router.get("/{workspace_id}/spaces/{space_key}")
async def get_space(
    workspace_id: UUID,
    space_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await db.get(Workspace, workspace_id)
    if workspace is None:
        raise NotFoundError("Workspace not found")

    member = await db.get(WorkspaceMember, (workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)

    space = await get_space_by_key(db, workspace_id, space_key)
    if space is None:
        raise NotFoundError("Space not found")

    return {
        "id": str(space.id),
        "workspace_id": str(space.workspace_id),
        "key": space.key,
        "name": space.name,
        "description": space.description,
        "icon": space.icon,
        "is_archived": space.is_archived,
        "created_at": space.created_at.isoformat() if space.created_at else None,
    }


@router.patch("/{workspace_id}/spaces/{space_key}")
async def update_space(
    workspace_id: UUID,
    space_key: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await db.get(Workspace, workspace_id)
    if workspace is None:
        raise NotFoundError("Workspace not found")

    member = await db.get(WorkspaceMember, (workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Insufficient permissions", status.HTTP_403_FORBIDDEN)

    space = await get_space_by_key(db, workspace_id, space_key)
    if space is None:
        raise NotFoundError("Space not found")

    space = await update_space_svc(db, space, data)
    return {
        "id": str(space.id),
        "workspace_id": str(space.workspace_id),
        "key": space.key,
        "name": space.name,
        "description": space.description,
        "icon": space.icon,
        "is_archived": space.is_archived,
        "created_at": space.created_at.isoformat() if space.created_at else None,
    }


@router.delete("/{workspace_id}/spaces/{space_key}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_space(
    workspace_id: UUID,
    space_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await db.get(Workspace, workspace_id)
    if workspace is None:
        raise NotFoundError("Workspace not found")

    member = await db.get(WorkspaceMember, (workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Insufficient permissions", status.HTTP_403_FORBIDDEN)

    space = await get_space_by_key(db, workspace_id, space_key)
    if space is None:
        raise NotFoundError("Space not found")

    await delete_space_svc(db, space)