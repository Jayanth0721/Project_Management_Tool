from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.project import Project, Issue
from app.models.board import Sprint
from app.models.workspace import WorkspaceMember
from app.core.security import get_current_user
from app.core.exceptions import AuthError

router = APIRouter()


@router.get("/{workspace_id}/velocity")
async def get_velocity(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await db.get(WorkspaceMember, (workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member of this workspace")

    # Get completed sprints scoped to the workspace
    result = await db.execute(
        select(Sprint)
        .join(Project, Sprint.project_id == Project.id)
        .where(Project.workspace_id == workspace_id, Sprint.state == "completed")
        .order_by(Sprint.end_date.desc())
        .limit(10)
    )
    sprints = result.scalars().all()

    velocity_data = []
    for sprint in sprints:
        points_result = await db.execute(
            select(func.coalesce(func.sum(Issue.story_points), 0))
            .where(Issue.sprint_id == sprint.id)
        )
        total_points = points_result.scalar_one()
        velocity_data.append({
            "sprint_id": str(sprint.id),
            "name": sprint.name,
            "end_date": sprint.end_date.isoformat() if sprint.end_date else None,
            "total_points": total_points or 0,
        })

    return velocity_data
