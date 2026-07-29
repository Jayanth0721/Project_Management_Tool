from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.space import Space


async def create_space(
    db: AsyncSession,
    workspace_id: UUID,
    key: str,
    name: str,
    description: str | None,
    icon: str | None,
) -> Space:
    space = Space(
        workspace_id=workspace_id,
        key=key,
        name=name,
        description=description,
        icon=icon,
    )
    db.add(space)
    await db.commit()
    await db.refresh(space)
    return space


async def get_spaces_for_workspace(
    db: AsyncSession, workspace_id: UUID
) -> list[Space]:
    result = await db.execute(
        select(Space)
        .where(Space.workspace_id == workspace_id)
        .order_by(Space.created_at.desc())
    )
    return list(result.scalars().all())


async def get_space_by_key(
    db: AsyncSession, workspace_id: UUID, key: str
) -> Space | None:
    result = await db.execute(
        select(Space).where(
            Space.workspace_id == workspace_id, Space.key == key
        )
    )
    return result.scalar_one_or_none()


async def update_space(db: AsyncSession, space: Space, data: dict) -> Space:
    if "name" in data and data["name"] is not None:
        space.name = data["name"]
    if "description" in data:
        space.description = data["description"]
    if "icon" in data:
        space.icon = data["icon"]
    if "is_archived" in data and data["is_archived"] is not None:
        space.is_archived = data["is_archived"]
    await db.commit()
    await db.refresh(space)
    return space


async def delete_space(db: AsyncSession, space: Space) -> None:
    await db.delete(space)
    await db.commit()