from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.workspace import WorkspaceCreate, WorkspaceOut, WorkspaceUpdate
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, ConflictError, AuthError
from app.services.workspace_service import create_workspace, get_workspaces_for_user, delete_workspace
from app.services.member_service import get_members

router = APIRouter()


@router.get("", response_model=list[WorkspaceOut])
async def list_my_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspaces = await get_workspaces_for_user(db, current_user.id)
    return [
        {
            "id": w.id,
            "name": w.name,
            "slug": w.slug,
            "plan": w.plan,
            "created_at": w.created_at.isoformat() if w.created_at else None,
        }
        for w in workspaces
    ]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=WorkspaceOut)
async def create_workspace_route(
    data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Workspace).where(Workspace.slug == data.slug))
    if existing.scalar_one_or_none() is not None:
        raise ConflictError("Slug already taken")

    workspace = await create_workspace(db, data.name, data.slug, data.plan, current_user.id)
    return {
        "id": workspace.id,
        "name": workspace.name,
        "slug": workspace.slug,
        "plan": workspace.plan,
        "created_at": workspace.created_at.isoformat() if workspace.created_at else None,
    }


@router.get("/{workspace_id}", response_model=WorkspaceOut)
async def get_workspace(
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

    return {
        "id": workspace.id,
        "name": workspace.name,
        "slug": workspace.slug,
        "plan": workspace.plan,
        "created_at": workspace.created_at.isoformat() if workspace.created_at else None,
    }


@router.patch("/{workspace_id}", response_model=WorkspaceOut)
async def update_workspace(
    workspace_id: UUID,
    data: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await db.get(Workspace, workspace_id)
    if workspace is None:
        raise NotFoundError("Workspace not found")

    member = await db.get(WorkspaceMember, (workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Insufficient permissions", status.HTTP_403_FORBIDDEN)

    if data.name is not None:
        workspace.name = data.name
    if data.plan is not None:
        workspace.plan = data.plan
    await db.commit()
    await db.refresh(workspace)

    return {
        "id": workspace.id,
        "name": workspace.name,
        "slug": workspace.slug,
        "plan": workspace.plan,
        "created_at": workspace.created_at.isoformat() if workspace.created_at else None,
    }


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace_route(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await db.get(Workspace, workspace_id)
    if workspace is None:
        raise NotFoundError("Workspace not found")

    member = await db.get(WorkspaceMember, (workspace_id, current_user.id))
    if member is None or member.role != "owner":
        raise AuthError("Only owners can delete a workspace", status.HTTP_403_FORBIDDEN)

    await delete_workspace(db, workspace_id)