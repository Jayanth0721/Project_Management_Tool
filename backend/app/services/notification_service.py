from uuid import UUID

from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ws import ws_manager
from app.models.activity import Notification


def utcnow():
    return datetime.now(timezone.utc)


async def create_notification(db: AsyncSession, user_id: UUID, kind: str, payload: str | None = None) -> Notification:
    notification = Notification(user_id=user_id, kind=kind, payload_json=payload)
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    await ws_manager.broadcast_to_user(
        user_id, "notification",
        {"id": str(notification.id), "kind": kind, "payload": payload, "created_at": notification.created_at.isoformat() if notification.created_at else None},
    )
    return notification


async def get_notifications_for_user(db: AsyncSession, user_id: UUID, limit: int = 50, offset: int = 0) -> dict:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    notifications = result.scalars().all()

    unread_count = 0
    items = []
    for n in notifications:
        if n.read_at is None:
            unread_count += 1
        items.append({
            "id": str(n.id),
            "kind": n.kind,
            "payload": n.payload_json,
            "read_at": n.read_at.isoformat() if n.read_at else None,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        })

    return {"items": items, "unread_count": unread_count}


async def mark_read(db: AsyncSession, notification_id: UUID, user_id: UUID) -> Notification | None:
    notification = await db.get(Notification, notification_id)
    if notification is None or notification.user_id != user_id:
        return None
    notification.read_at = utcnow()
    await db.commit()
    await db.refresh(notification)
    return notification


async def mark_all_read(db: AsyncSession, user_id: UUID) -> int:
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.read_at.is_(None))
        .values(read_at=utcnow())
    )
    await db.commit()
    return result.rowcount