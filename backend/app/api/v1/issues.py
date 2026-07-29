from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.models.project import Project, Issue
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, AuthError
from app.schemas.issue import IssueCreate, IssueUpdate
from app.core.pagination import Pagination, get_pagination
from app.services.issue_service import (
    create_issue,
    get_issues_for_project,
    get_issue_by_key,
    update_issue,
    delete_issue,
    transition_issue,
)
from app.services.activity_service import log_activity

router = APIRouter()


async def get_project_for_key(key: str, db: AsyncSession) -> Project:
    result = await db.execute(select(Project).where(Project.key == key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError(f"Project '{key}' not found")
    return project


async def require_project_member(project: Project, user_id: UUID, db: AsyncSession):
    member = await db.get(WorkspaceMember, (project.workspace_id, user_id))
    if member is None:
        raise AuthError("Not a workspace member", status.HTTP_403_FORBIDDEN)
    return member


async def require_project_admin(project: Project, user_id: UUID, db: AsyncSession):
    member = await require_project_member(project, user_id, db)
    if member.role not in ("owner", "admin"):
        raise AuthError("Admin access required", status.HTTP_403_FORBIDDEN)
    return member


def issue_to_dict(i: Issue) -> dict:
    return {
        "id": str(i.id),
        "project_id": str(i.project_id),
        "key": i.key,
        "issue_type_id": str(i.issue_type_id) if i.issue_type_id else None,
        "status_id": str(i.status_id) if i.status_id else None,
        "priority_id": str(i.priority_id) if i.priority_id else None,
        "summary": i.summary,
        "description": i.description,
        "reporter_id": str(i.reporter_id) if i.reporter_id else None,
        "assignee_id": str(i.assignee_id) if i.assignee_id else None,
        "due_date": i.due_date.isoformat() if i.due_date else None,
        "story_points": i.story_points,
        "sprint_id": str(i.sprint_id) if i.sprint_id else None,
        "parent_issue_id": str(i.parent_issue_id) if i.parent_issue_id else None,
        "resolution": i.resolution,
        "created_at": i.created_at.isoformat() if i.created_at else None,
        "updated_at": i.updated_at.isoformat() if i.updated_at else None,
    }


@router.get("/{project_key}/issues")
async def list_issues(
    project_key: str,
    pagination: Pagination = Depends(get_pagination),
    status_id: UUID | None = Query(None),
    assignee_id: UUID | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_for_key(project_key, db)
    await require_project_member(project, current_user.id, db)
    filters = {}
    if status_id: filters["status_id"] = status_id
    if assignee_id: filters["assignee_id"] = assignee_id
    issues = await get_issues_for_project(db, project.id, filters if filters else None, pagination)
    return [issue_to_dict(i) for i in issues]


@router.post("/{project_key}/issues", status_code=status.HTTP_201_CREATED)
async def create_issue_route(
    project_key: str,
    body: IssueCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_for_key(project_key, db)
    await require_project_member(project, current_user.id, db)
    issue = await create_issue(db, project_key, project.id, body.model_dump(exclude_none=True), current_user.id)
    await log_activity(db, project.workspace_id, current_user.id, "created", "issue", str(issue.id), issue.summary)
    return issue_to_dict(issue)


@router.get("/{project_key}/issues/{issue_key}")
async def get_issue(
    project_key: str,
    issue_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_for_key(project_key, db)
    await require_project_member(project, current_user.id, db)
    issue = await get_issue_by_key(db, project.id, issue_key)
    if issue is None:
        raise NotFoundError("Issue not found")
    return issue_to_dict(issue)


@router.patch("/{project_key}/issues/{issue_key}")
async def update_issue_route(
    project_key: str,
    issue_key: str,
    body: IssueUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_for_key(project_key, db)
    await require_project_member(project, current_user.id, db)
    issue = await get_issue_by_key(db, project.id, issue_key)
    if issue is None:
        raise NotFoundError("Issue not found")
    issue = await update_issue(db, issue, body.model_dump(exclude_none=True))
    return issue_to_dict(issue)


@router.delete("/{project_key}/issues/{issue_key}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_issue_route(
    project_key: str,
    issue_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_for_key(project_key, db)
    await require_project_admin(project, current_user.id, db)
    issue = await get_issue_by_key(db, project.id, issue_key)
    if issue is None:
        raise NotFoundError("Issue not found")
    await delete_issue(db, issue)


class _TransitionBody(BaseModel):
    status_id: UUID

@router.post("/{project_key}/issues/{issue_key}/transition")
async def transition_issue_route(
    project_key: str,
    issue_key: str,
    body: _TransitionBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project_for_key(project_key, db)
    await require_project_member(project, current_user.id, db)
    issue = await get_issue_by_key(db, project.id, issue_key)
    if issue is None:
        raise NotFoundError("Issue not found")
    issue = await transition_issue(db, issue, body.status_id)
    return issue_to_dict(issue)


@router.post("/{project_key}/issues/{issue_key}/watch")
async def watch_issue_route(project_key: str, issue_key: str):
    return {"message": "Watch/unwatch coming in Phase 5"}