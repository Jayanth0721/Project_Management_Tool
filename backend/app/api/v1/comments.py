from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.models.project import Project
from app.models.space import Space, Page
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, AuthError
from app.schemas.board import CommentCreate
from app.core.pagination import Pagination, get_pagination
from app.services.comment_service import create_comment, get_comments_for_target

router = APIRouter()


async def _require_workspace_member(
    workspace_id: UUID, user_id: UUID, db: AsyncSession,
) -> WorkspaceMember:
    member = await db.get(WorkspaceMember, (workspace_id, user_id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)
    return member


def _extract_project_key(issue_key: str) -> str:
    return issue_key.split("-")[0]


@router.get("/{target_type}/{target_id}/comments")
async def list_comments(
    target_type: str,
    target_id: str,
    pagination: Pagination = Depends(get_pagination),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if target_type == "issues":
        project_key = _extract_project_key(target_id)
        result = await db.execute(select(Project).where(Project.key == project_key))
        project = result.scalar_one_or_none()
        if project is None:
            raise NotFoundError("Project not found")
        await _require_workspace_member(project.workspace_id, current_user.id, db)
    elif target_type == "pages":
        page = await db.get(Page, UUID(target_id))
        if page is None:
            raise NotFoundError("Page not found")
        space = await db.get(Space, page.space_id)
        if space is None:
            raise NotFoundError("Space not found")
        await _require_workspace_member(space.workspace_id, current_user.id, db)
    else:
        raise NotFoundError("Unknown target type")
    return await get_comments_for_target(db, target_type, target_id, pagination.limit, pagination.offset)


def _comment_response(comment) -> dict:
    return {
        "id": str(comment.id),
        "target_type": comment.target_type,
        "target_id": comment.target_id,
        "author_id": str(comment.author_id),
        "body": comment.body,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
        "updated_at": comment.updated_at.isoformat() if comment.updated_at else None,
    }


@router.post("/issues/{issue_key}/comments", status_code=status.HTTP_201_CREATED)
async def add_issue_comment(
    issue_key: str,
    body: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_key = _extract_project_key(issue_key)
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    await _require_workspace_member(project.workspace_id, current_user.id, db)
    comment = await create_comment(db, "issues", issue_key, current_user.id, body.body)
    return _comment_response(comment)


@router.post("/pages/{page_id}/comments", status_code=status.HTTP_201_CREATED)
async def add_page_comment(
    page_id: str,
    body: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page = await db.get(Page, UUID(page_id))
    if page is None:
        raise NotFoundError("Page not found")
    space = await db.get(Space, page.space_id)
    if space is None:
        raise NotFoundError("Space not found")
    await _require_workspace_member(space.workspace_id, current_user.id, db)
    comment = await create_comment(db, "pages", page_id, current_user.id, body.body)
    return _comment_response(comment)
