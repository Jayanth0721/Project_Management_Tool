from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.models.project import Project, Issue
from app.models.board import Sprint
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, AuthError
from app.services.issue_service import get_issues_for_project

router = APIRouter()


async def _get_project(project_key: str, db: AsyncSession) -> Project:
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    return project


async def _require_member(project: Project, user_id: UUID, db: AsyncSession):
    member = await db.get(WorkspaceMember, (project.workspace_id, user_id))
    if member is None:
        raise AuthError("Not a workspace member", status.HTTP_403_FORBIDDEN)


def _issue_to_dict(i) -> dict:
    return {
        "id": str(i.id),
        "key": i.key,
        "summary": i.summary,
        "status_id": str(i.status_id) if i.status_id else None,
        "assignee_id": str(i.assignee_id) if i.assignee_id else None,
        "priority_id": str(i.priority_id) if i.priority_id else None,
        "sprint_id": str(i.sprint_id) if i.sprint_id else None,
        "story_points": i.story_points,
        "created_at": i.created_at.isoformat() if i.created_at else None,
    }


@router.get("/{project_key}/backlog")
async def get_backlog(
    project_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_project(project_key, db)
    await _require_member(project, current_user.id, db)

    # Unassigned issues (no sprint)
    backlog_issues = await get_issues_for_project(db, project.id, {"sprint_id": None}, None)
    # Remove ordering since no pagination — use created_at asc for backlog
    backlog_issues.sort(key=lambda i: i.created_at or "")

    # All sprints with their issues
    sprints_result = await db.execute(
        select(Sprint).where(Sprint.project_id == project.id).order_by(Sprint.created_at.desc())
    )
    sprints = sprints_result.scalars().all()

    sprint_data = []
    for sprint in sprints:
        sprint_issues = await get_issues_for_project(db, project.id, {"sprint_id": sprint.id}, None)
        sprint_data.append({
            "id": str(sprint.id),
            "name": sprint.name,
            "goal": sprint.goal,
            "state": sprint.state,
            "start_date": sprint.start_date.isoformat() if sprint.start_date else None,
            "end_date": sprint.end_date.isoformat() if sprint.end_date else None,
            "issues": [_issue_to_dict(i) for i in sprint_issues],
        })

    return {
        "backlog": [_issue_to_dict(i) for i in backlog_issues],
        "sprints": sprint_data,
    }


class _BulkAssignBody(BaseModel):
    issue_ids: list[str]
    sprint_id: str | None = None  # null to unassign

@router.post("/{project_key}/backlog/assign")
async def assign_to_sprint(
    project_key: str,
    body: _BulkAssignBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_project(project_key, db)
    await _require_member(project, current_user.id, db)

    for issue_id in body.issue_ids:
        result = await db.execute(
            select(Issue).where(Issue.id == UUID(issue_id), Issue.project_id == project.id)
        )
        issue = result.scalar_one_or_none()
        if issue:
            issue.sprint_id = UUID(body.sprint_id) if body.sprint_id else None
    await db.commit()
    return {"ok": True}
