from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project, WorkflowStatus
from app.models.board import Board, Sprint


async def create_project(
    db: AsyncSession, workspace_id: UUID, key: str, name: str, type: str
) -> Project:
    project = Project(workspace_id=workspace_id, key=key, name=name, type=type)
    db.add(project)
    await db.flush()

    # Default workflow statuses
    status_config = [
        ("To Do", "todo"),
        ("In Progress", "in_progress"),
        ("Resolved", "done"),
        ("Closed", "done"),
    ]
    for s_name, s_cat in status_config:
        db.add(WorkflowStatus(id=uuid4(), project_id=project.id, name=s_name, category=s_cat))

    # Default board
    db.add(Board(id=uuid4(), project_id=project.id, name="Kanban Board", type="kanban"))

    # Default sprint
    db.add(Sprint(id=uuid4(), project_id=project.id, name="Sprint 1", state="future"))

    await db.commit()
    await db.refresh(project)
    return project


async def get_projects_for_workspace(
    db: AsyncSession, workspace_id: UUID
) -> list[Project]:
    result = await db.execute(
        select(Project)
        .where(Project.workspace_id == workspace_id)
        .order_by(Project.created_at.desc())
    )
    return list(result.scalars().all())


async def get_project_by_key(
    db: AsyncSession, workspace_id: UUID, key: str
) -> Project | None:
    result = await db.execute(
        select(Project).where(
            Project.workspace_id == workspace_id, Project.key == key
        )
    )
    return result.scalar_one_or_none()


async def update_project(db: AsyncSession, project: Project, data: dict) -> Project:
    if "name" in data:
        project.name = data["name"]
    if "lead_user_id" in data:
        project.lead_user_id = data["lead_user_id"]
    if "is_archived" in data:
        project.is_archived = data["is_archived"]
    await db.commit()
    await db.refresh(project)
    return project


async def delete_project(db: AsyncSession, project: Project) -> None:
    await db.delete(project)
    await db.commit()