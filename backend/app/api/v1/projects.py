from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.project import Project, WorkflowStatus
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, ConflictError, AuthError, ValidationError
from app.services.project_service import (
    create_project,
    get_projects_for_workspace,
    get_project_by_key,
    update_project,
    delete_project,
)

router = APIRouter()


def validate_project_key(key: str) -> str:
    import re
    if not re.match(r"^[A-Z][A-Z0-9]*$", key):
        raise ValidationError("Project key must start with uppercase letter, then uppercase letters and digits only")
    if len(key) > 10:
        raise ValidationError("Project key max 10 characters")
    return key


async def require_member(workspace_id: UUID, user_id: UUID, db: AsyncSession) -> WorkspaceMember:
    member = await db.get(WorkspaceMember, (workspace_id, user_id))
    if member is None:
        raise AuthError("Not a workspace member", status.HTTP_403_FORBIDDEN)
    return member


async def require_admin(workspace_id: UUID, user_id: UUID, db: AsyncSession) -> WorkspaceMember:
    member = await require_member(workspace_id, user_id, db)
    if member.role not in ("owner", "admin"):
        raise AuthError("Admin access required", status.HTTP_403_FORBIDDEN)
    return member


def project_to_dict(p: Project) -> dict:
    return {
        "id": str(p.id),
        "workspace_id": str(p.workspace_id),
        "key": p.key,
        "name": p.name,
        "type": p.type,
        "lead_user_id": str(p.lead_user_id) if p.lead_user_id else None,
        "is_archived": p.is_archived,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@router.get("/{workspace_id}/projects")
async def list_projects(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_member(workspace_id, current_user.id, db)
    projects = await get_projects_for_workspace(db, workspace_id)
    return [project_to_dict(p) for p in projects]


@router.post("/{workspace_id}/projects", status_code=status.HTTP_201_CREATED)
async def create_project_route(
    workspace_id: UUID,
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_admin(workspace_id, current_user.id, db)
    validate_project_key(body.key)

    existing = await db.execute(
        select(Project).where(Project.workspace_id == workspace_id, Project.key == body.key)
    )
    if existing.scalar_one_or_none() is not None:
        raise ConflictError(f"Project key '{body.key}' already exists in this workspace")

    project = await create_project(db, workspace_id, body.key, body.name, body.type)
    return project_to_dict(project)


@router.get("/{workspace_id}/projects/{project_key}")
async def get_project(
    workspace_id: UUID,
    project_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_member(workspace_id, current_user.id, db)
    project = await get_project_by_key(db, workspace_id, project_key)
    if project is None:
        raise NotFoundError("Project not found")
    return project_to_dict(project)


@router.patch("/{workspace_id}/projects/{project_key}")
async def update_project_route(
    workspace_id: UUID,
    project_key: str,
    body: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_admin(workspace_id, current_user.id, db)
    project = await get_project_by_key(db, workspace_id, project_key)
    if project is None:
        raise NotFoundError("Project not found")
    project = await update_project(db, project, body.model_dump(exclude_none=True))
    return project_to_dict(project)


@router.get("/{workspace_id}/projects/{project_key}/statuses")
async def list_project_statuses(
    workspace_id: UUID,
    project_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_member(workspace_id, current_user.id, db)
    project = await get_project_by_key(db, workspace_id, project_key)
    if project is None:
        raise NotFoundError("Project not found")
    result = await db.execute(
        select(WorkflowStatus).where(WorkflowStatus.project_id == project.id)
    )
    statuses = result.scalars().all()
    return [
        {"id": str(s.id), "name": s.name, "category": s.category}
        for s in statuses
    ]


@router.delete("/{workspace_id}/projects/{project_key}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_route(
    workspace_id: UUID,
    project_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_admin(workspace_id, current_user.id, db)
    project = await get_project_by_key(db, workspace_id, project_key)
    if project is None:
        raise NotFoundError("Project not found")
    await delete_project(db, project)