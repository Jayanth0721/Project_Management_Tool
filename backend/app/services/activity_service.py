from uuid import UUID

from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity


def utcnow():
    return datetime.now(timezone.utc)


async def log_activity(
    db: AsyncSession,
    workspace_id: UUID,
    actor_id: UUID | None,
    verb: str,
    target_type: str,
    target_id: str,
    payload: str | None = None,
) -> Activity:
    activity = Activity(
        workspace_id=workspace_id,
        actor_id=actor_id,
        verb=verb,
        target_type=target_type,
        target_id=target_id,
        payload_json=payload,
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


async def get_activity_feed(db: AsyncSession, workspace_id: UUID, limit: int = 50, offset: int = 0) -> list[dict]:
    result = await db.execute(
        select(Activity)
        .where(Activity.workspace_id == workspace_id)
        .order_by(Activity.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    activities = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "actor_id": str(a.actor_id) if a.actor_id else None,
            "verb": a.verb,
            "target_type": a.target_type,
            "target_id": a.target_id,
            "payload": a.payload_json,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in activities
    ]