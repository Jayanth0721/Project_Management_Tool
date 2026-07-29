from uuid import UUID

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    key: str
    name: str
    type: str = "software"


class ProjectUpdate(BaseModel):
    name: str | None = None
    lead_user_id: UUID | None = None
    is_archived: bool | None = None


class ProjectOut(BaseModel):
    id: UUID
    workspace_id: UUID
    key: str
    name: str
    type: str
    lead_user_id: UUID | None = None
    is_archived: bool
    created_at: str | None = None