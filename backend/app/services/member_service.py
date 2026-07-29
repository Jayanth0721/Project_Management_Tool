from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.workspace import WorkspaceMember


async def get_members(db: AsyncSession, workspace_id: UUID) -> list[dict]:
    result = await db.execute(
        select(WorkspaceMember, User.email, User.full_name)
        .join(User, WorkspaceMember.user_id == User.id)
        .where(WorkspaceMember.workspace_id == workspace_id)
        .order_by(WorkspaceMember.joined_at)
    )
    rows = result.all()
    return [
        {
            "user_id": row.WorkspaceMember.user_id,
            "email": row.email,
            "full_name": row.full_name,
            "role": row.WorkspaceMember.role,
            "joined_at": row.WorkspaceMember.joined_at.isoformat() if row.WorkspaceMember.joined_at else None,
        }
        for row in rows
    ]


async def add_member(
    db: AsyncSession, workspace_id: UUID, user_id: UUID, role: str
) -> WorkspaceMember:
    member = WorkspaceMember(workspace_id=workspace_id, user_id=user_id, role=role)
    db.add(member)
    await db.commit()
    return member


async def update_member_role(
    db: AsyncSession, workspace_id: UUID, user_id: UUID, role: str
) -> WorkspaceMember | None:
    member = await db.get(WorkspaceMember, (workspace_id, user_id))
    if member is None:
        return None
    member.role = role
    await db.commit()
    return member


async def remove_member(db: AsyncSession, workspace_id: UUID, user_id: UUID) -> bool:
    member = await db.get(WorkspaceMember, (workspace_id, user_id))
    if member is None:
        return False
    await db.delete(member)
    await db.commit()
    return True