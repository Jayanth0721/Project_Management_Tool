from uuid import UUID

from pydantic import BaseModel


class SpaceCreate(BaseModel):
    key: str
    name: str
    description: str | None = None
    icon: str | None = None


class SpaceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    is_archived: bool | None = None


class SpaceOut(BaseModel):
    id: UUID
    workspace_id: UUID
    key: str
    name: str
    description: str | None = None
    icon: str | None = None
    is_archived: bool
    created_at: str | None = None