from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace, WorkspaceMember


async def create_workspace(
    db: AsyncSession, name: str, slug: str, plan: str, owner_user_id: UUID
) -> Workspace:
    workspace = Workspace(name=name, slug=slug, plan=plan)
    db.add(workspace)
    await db.flush()

    member = WorkspaceMember(workspace_id=workspace.id, user_id=owner_user_id, role="owner")
    db.add(member)
    await db.commit()
    await db.refresh(workspace)
    return workspace


async def get_workspaces_for_user(db: AsyncSession, user_id: UUID) -> list[Workspace]:
    result = await db.execute(
        select(Workspace)
        .join(WorkspaceMember)
        .where(WorkspaceMember.user_id == user_id)
        .order_by(Workspace.created_at.desc())
    )
    return list(result.scalars().all())


async def delete_workspace(db: AsyncSession, workspace_id: UUID) -> bool:
    workspace = await db.get(Workspace, workspace_id)
    if workspace is None:
        return False
    await db.delete(workspace)
    await db.commit()
    return True