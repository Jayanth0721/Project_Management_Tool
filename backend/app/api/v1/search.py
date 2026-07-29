from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, AuthError
from app.services.search_service import search_all, search_issues, search_pages

router = APIRouter()


@router.get("")
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    workspace_id: UUID = Query(...),
    type: str | None = Query(None, regex="^(issues|pages)$"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await db.get(WorkspaceMember, (workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member of this workspace")

    if type == "issues":
        return await search_issues(db, workspace_id, q, limit, offset)
    elif type == "pages":
        return await search_pages(db, workspace_id, q, limit, offset)
    else:
        return await search_all(db, workspace_id, q, limit, offset)
