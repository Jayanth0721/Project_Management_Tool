from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.workspace import MemberOut, MemberUpdate
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, ConflictError, AuthError
from app.services.member_service import (
    get_members,
    add_member,
    update_member_role,
    remove_member,
)

router = APIRouter()


async def _require_admin(
    workspace_id: UUID, user_id: UUID, db: AsyncSession
) -> WorkspaceMember:
    member = await db.get(WorkspaceMember, (workspace_id, user_id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Insufficient permissions", status.HTTP_403_FORBIDDEN)
    return member


@router.get("/{workspace_id}/members", response_model=list[MemberOut])
async def list_members(
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

    return await get_members(db, workspace_id)


@router.post("/{workspace_id}/members", status_code=status.HTTP_201_CREATED, response_model=MemberOut)
async def add_member_route(
    workspace_id: UUID,
    data: MemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_admin(workspace_id, current_user.id, db)

    target = await db.execute(select(User).where(User.email == data.role))
    user = target.scalar_one_or_none()

    if user is None:
        raise NotFoundError("User not found by that identifier")

    existing = await db.get(WorkspaceMember, (workspace_id, user.id))
    if existing is not None:
        raise ConflictError("User is already a member")

    await add_member(db, workspace_id, user.id, data.role)
    return {
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": data.role,
        "joined_at": None,
    }


@router.patch("/{workspace_id}/members/{user_id}", response_model=MemberOut)
async def update_member_route(
    workspace_id: UUID,
    user_id: UUID,
    data: MemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_admin(workspace_id, current_user.id, db)

    target_user = await db.get(User, user_id)
    if target_user is None:
        raise NotFoundError("User not found")

    updated = await update_member_role(db, workspace_id, user_id, data.role)
    if updated is None:
        raise NotFoundError("Member not found")

    return {
        "user_id": user_id,
        "email": target_user.email,
        "full_name": target_user.full_name,
        "role": updated.role,
        "joined_at": updated.joined_at.isoformat() if updated.joined_at else None,
    }


@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member_route(
    workspace_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _require_admin(workspace_id, current_user.id, db)

    if user_id == current_user.id:
        raise ConflictError("Cannot remove yourself — use the leave workspace option")

    removed = await remove_member(db, workspace_id, user_id)
    if not removed:
        raise NotFoundError("Member not found")