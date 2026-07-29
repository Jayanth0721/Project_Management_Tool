from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.models.project import Project, Issue, WorkflowStatus
from app.models.board import Sprint
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, AuthError

router = APIRouter()


@router.get("/{project_key}/gantt")
async def get_gantt_data(
    project_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)

    # All issues with their dates
    issues_result = await db.execute(
        select(Issue).where(Issue.project_id == project.id).order_by(Issue.created_at.asc())
    )
    issues = issues_result.scalars().all()

    # Statuses for coloring
    statuses_result = await db.execute(
        select(WorkflowStatus).where(WorkflowStatus.project_id == project.id)
    )
    status_map = {str(s.id): s.name for s in statuses_result.scalars().all()}

    # Sprints for grouping
    sprints_result = await db.execute(
        select(Sprint).where(Sprint.project_id == project.id).order_by(Sprint.created_at.asc())
    )
    sprints = sprints_result.scalars().all()

    return {
        "issues": [
            {
                "id": str(i.id),
                "key": i.key,
                "summary": i.summary,
                "status_id": str(i.status_id) if i.status_id else None,
                "status_name": status_map.get(str(i.status_id)) if i.status_id else None,
                "assignee_id": str(i.assignee_id) if i.assignee_id else None,
                "sprint_id": str(i.sprint_id) if i.sprint_id else None,
                "story_points": i.story_points,
                "parent_issue_id": str(i.parent_issue_id) if i.parent_issue_id else None,
                "created_at": i.created_at.isoformat() if i.created_at else None,
                "due_date": i.due_date.isoformat() if i.due_date else None,
            }
            for i in issues
        ],
        "sprints": [
            {
                "id": str(s.id),
                "name": s.name,
                "start_date": s.start_date.isoformat() if s.start_date else None,
                "end_date": s.end_date.isoformat() if s.end_date else None,
                "state": s.state,
            }
            for s in sprints
        ],
    }
