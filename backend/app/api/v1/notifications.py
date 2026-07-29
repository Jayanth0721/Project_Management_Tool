from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError
from app.core.pagination import Pagination, get_pagination
from app.services.notification_service import (
    get_notifications_for_user,
    mark_read,
    mark_all_read,
)

router = APIRouter()


@router.get("")
async def list_notifications(
    pagination: Pagination = Depends(get_pagination),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_notifications_for_user(db, current_user.id, pagination.limit, pagination.offset)


@router.post("/{notification_id}/read")
async def mark_one_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await mark_read(db, notification_id, current_user.id)
    if result is None:
        raise NotFoundError("Notification not found")
    return {"message": "marked read"}


@router.post("/read-all")
async def mark_all(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = await mark_all_read(db, current_user.id)
    return {"count": count}