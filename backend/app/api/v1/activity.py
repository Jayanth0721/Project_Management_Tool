from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.core.security import get_current_user
from app.core.exceptions import AuthError
from app.core.pagination import Pagination, get_pagination
from app.services.activity_service import get_activity_feed

router = APIRouter()


@router.get("")
async def activity(
    workspace: UUID = Query(...),
    pagination: Pagination = Depends(get_pagination),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await db.get(WorkspaceMember, (workspace, current_user.id))
    if member is None:
        raise AuthError("Not a member", 403)

    feed = await get_activity_feed(db, workspace, pagination.limit, pagination.offset)
    return feed