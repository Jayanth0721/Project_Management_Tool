from uuid import UUID

from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.board import Sprint


def utcnow():
    return datetime.now(timezone.utc)


async def create_sprint(
    db: AsyncSession,
    project_id: UUID,
    name: str,
    goal: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> Sprint:
    sd = datetime.fromisoformat(start_date) if start_date else None
    ed = datetime.fromisoformat(end_date) if end_date else None
    sprint = Sprint(
        project_id=project_id,
        name=name,
        goal=goal,
        start_date=sd,
        end_date=ed,
        state="future",
    )
    db.add(sprint)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def get_sprints_for_project(db: AsyncSession, project_id: UUID) -> list[Sprint]:
    result = await db.execute(
        select(Sprint).where(Sprint.project_id == project_id).order_by(Sprint.created_at)
    )
    return list(result.scalars().all())


async def get_sprint(db: AsyncSession, sprint_id: UUID) -> Sprint | None:
    return await db.get(Sprint, sprint_id)


async def update_sprint(db: AsyncSession, sprint: Sprint, data: dict) -> Sprint:
    for key in ("name", "goal", "state"):
        if key in data and data[key] is not None:
            setattr(sprint, key, data[key])
    if "start_date" in data and data["start_date"]:
        sprint.start_date = datetime.fromisoformat(data["start_date"])
    if "end_date" in data and data["end_date"]:
        sprint.end_date = datetime.fromisoformat(data["end_date"])
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def delete_sprint(db: AsyncSession, sprint: Sprint) -> None:
    await db.delete(sprint)
    await db.commit()


async def start_sprint(db: AsyncSession, sprint: Sprint) -> Sprint:
    sprint.state = "active"
    if not sprint.start_date:
        sprint.start_date = utcnow()
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def complete_sprint(db: AsyncSession, sprint: Sprint) -> Sprint:
    sprint.state = "completed"
    if not sprint.end_date:
        sprint.end_date = utcnow()
    await db.commit()
    await db.refresh(sprint)
    return sprint