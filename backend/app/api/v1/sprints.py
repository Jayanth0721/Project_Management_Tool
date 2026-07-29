from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.models.project import Project
from app.models.board import Sprint
from app.schemas.board import SprintCreate, SprintUpdate
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, AuthError
from app.services.sprint_service import (
    create_sprint,
    get_sprints_for_project,
    get_sprint,
    update_sprint,
    delete_sprint,
    start_sprint,
    complete_sprint,
)

router = APIRouter()


def sprint_to_dict(s: Sprint) -> dict:
    return {
        "id": str(s.id),
        "project_id": str(s.project_id),
        "name": s.name,
        "goal": s.goal,
        "start_date": s.start_date.isoformat() if s.start_date else None,
        "end_date": s.end_date.isoformat() if s.end_date else None,
        "state": s.state,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


@router.get("/{project_key}/sprints")
async def list_sprints(
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
    sprints = await get_sprints_for_project(db, project.id)
    return [sprint_to_dict(s) for s in sprints]


@router.post("/{project_key}/sprints", status_code=status.HTTP_201_CREATED)
async def create_sprint_route(
    project_key: str,
    body: SprintCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Admin access required", status.HTTP_403_FORBIDDEN)
    sprint = await create_sprint(db, project.id, body.name, body.goal, body.start_date, body.end_date)
    return sprint_to_dict(sprint)


@router.get("/{project_key}/sprints/{sprint_id}")
async def get_sprint_route(
    project_key: str,
    sprint_id: UUID,
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
    sprint = await get_sprint(db, sprint_id)
    if sprint is None or sprint.project_id != project.id:
        raise NotFoundError("Sprint not found")
    return sprint_to_dict(sprint)


@router.patch("/{project_key}/sprints/{sprint_id}")
async def update_sprint_route(
    project_key: str,
    sprint_id: UUID,
    body: SprintUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Admin access required", status.HTTP_403_FORBIDDEN)
    sprint = await get_sprint(db, sprint_id)
    if sprint is None or sprint.project_id != project.id:
        raise NotFoundError("Sprint not found")
    sprint = await update_sprint(db, sprint, body.model_dump(exclude_none=True))
    return sprint_to_dict(sprint)


@router.delete("/{project_key}/sprints/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sprint_route(
    project_key: str,
    sprint_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Admin access required", status.HTTP_403_FORBIDDEN)
    sprint = await get_sprint(db, sprint_id)
    if sprint is None or sprint.project_id != project.id:
        raise NotFoundError("Sprint not found")
    await delete_sprint(db, sprint)


@router.post("/{project_key}/sprints/{sprint_id}/start")
async def start_sprint_route(
    project_key: str,
    sprint_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Admin access required", status.HTTP_403_FORBIDDEN)
    sprint = await get_sprint(db, sprint_id)
    if sprint is None or sprint.project_id != project.id:
        raise NotFoundError("Sprint not found")
    sprint = await start_sprint(db, sprint)
    return sprint_to_dict(sprint)


@router.post("/{project_key}/sprints/{sprint_id}/complete")
async def complete_sprint_route(
    project_key: str,
    sprint_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Admin access required", status.HTTP_403_FORBIDDEN)
    sprint = await get_sprint(db, sprint_id)
    if sprint is None or sprint.project_id != project.id:
        raise NotFoundError("Sprint not found")
    sprint = await complete_sprint(db, sprint)
    return sprint_to_dict(sprint)