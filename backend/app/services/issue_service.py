from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Issue, WorkflowStatus
from app.models.user import utcnow
from app.core.pagination import Pagination


async def get_next_issue_number(db: AsyncSession, project_id: UUID) -> int:
    result = await db.execute(
        select(func.count()).select_from(Issue).where(Issue.project_id == project_id)
    )
    count = result.scalar_one()
    return count + 1


async def create_issue(
    db: AsyncSession,
    project_key: str,
    project_id: UUID,
    data: dict,
    reporter_id: UUID,
) -> Issue:
    seq = await get_next_issue_number(db, project_id)
    issue_key = f"{project_key}-{seq}"

    issue = Issue(
        key=issue_key,
        project_id=project_id,
        reporter_id=reporter_id,
        summary=data.get("summary"),
        description=data.get("description"),
        issue_type_id=data.get("issue_type_id"),
        status_id=data.get("status_id"),
        priority_id=data.get("priority_id"),
        assignee_id=data.get("assignee_id"),
        due_date=data.get("due_date"),
        story_points=data.get("story_points"),
        sprint_id=data.get("sprint_id"),
        parent_issue_id=data.get("parent_issue_id"),
    )
    db.add(issue)
    await db.commit()
    await db.refresh(issue)
    return issue


async def get_issues_for_project(
    db: AsyncSession, project_id: UUID, filters: dict | None = None, pagination: Pagination | None = None
) -> list[Issue]:
    stmt = select(Issue).where(Issue.project_id == project_id)
    if filters:
        if "status_id" in filters and filters["status_id"] is not None:
            stmt = stmt.where(Issue.status_id == filters["status_id"])
        if "priority_id" in filters and filters["priority_id"] is not None:
            stmt = stmt.where(Issue.priority_id == filters["priority_id"])
        if "assignee_id" in filters and filters["assignee_id"] is not None:
            stmt = stmt.where(Issue.assignee_id == filters["assignee_id"])
        if "sprint_id" in filters:
            if filters["sprint_id"] is None:
                stmt = stmt.where(Issue.sprint_id.is_(None))
            else:
                stmt = stmt.where(Issue.sprint_id == filters["sprint_id"])
    stmt = stmt.order_by(Issue.created_at.desc())
    if pagination:
        stmt = stmt.offset(pagination.offset).limit(pagination.limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_issue_by_key(
    db: AsyncSession, project_id: UUID, issue_key: str
) -> Issue | None:
    result = await db.execute(
        select(Issue).where(Issue.project_id == project_id, Issue.key == issue_key)
    )
    return result.scalar_one_or_none()


async def update_issue(db: AsyncSession, issue: Issue, data: dict) -> Issue:
    for field in (
        "summary",
        "description",
        "issue_type_id",
        "status_id",
        "priority_id",
        "assignee_id",
        "due_date",
        "story_points",
        "sprint_id",
        "resolution",
    ):
        if field in data:
            setattr(issue, field, data[field])
    await db.commit()
    await db.refresh(issue)
    return issue


async def delete_issue(db: AsyncSession, issue: Issue) -> None:
    await db.delete(issue)
    await db.commit()


async def transition_issue(
    db: AsyncSession, issue: Issue, status_id: UUID
) -> Issue:
    status = await db.get(WorkflowStatus, status_id)
    if status is None or status.project_id != issue.project_id:
        raise ValueError("Status does not belong to this project")

    issue.status_id = status_id
    issue.updated_at = utcnow()
    await db.commit()
    await db.refresh(issue)
    return issue