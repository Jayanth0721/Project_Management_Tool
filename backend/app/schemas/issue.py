from uuid import UUID

from datetime import datetime
from pydantic import BaseModel


class IssueCreate(BaseModel):
    issue_type_id: UUID | None = None
    status_id: UUID | None = None
    priority_id: UUID | None = None
    summary: str
    description: str | None = None
    assignee_id: UUID | None = None
    due_date: str | None = None
    story_points: int | None = None
    parent_issue_id: UUID | None = None


class IssueUpdate(BaseModel):
    summary: str | None = None
    description: str | None = None
    issue_type_id: UUID | None = None
    status_id: UUID | None = None
    priority_id: UUID | None = None
    assignee_id: UUID | None = None
    due_date: str | None = None
    story_points: int | None = None
    sprint_id: UUID | None = None
    resolution: str | None = None


class IssueOut(BaseModel):
    id: UUID
    project_id: UUID
    key: str
    issue_type_id: UUID | None = None
    status_id: UUID | None = None
    priority_id: UUID | None = None
    summary: str
    description: str | None = None
    reporter_id: UUID | None = None
    assignee_id: UUID | None = None
    due_date: datetime | None = None
    story_points: int | None = None
    sprint_id: UUID | None = None
    parent_issue_id: UUID | None = None
    resolution: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None