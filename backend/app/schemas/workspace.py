from uuid import UUID

from pydantic import BaseModel, field_validator


class WorkspaceCreate(BaseModel):
    name: str
    slug: str
    plan: str = "free"

    @field_validator("slug")
    @classmethod
    def slug_format(cls, v: str) -> str:
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Slug must be alphanumeric with dashes/underscores only")
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Slug must be 2-100 characters")
        return v.lower()


class WorkspaceUpdate(BaseModel):
    name: str | None = None
    plan: str | None = None


class WorkspaceOut(BaseModel):
    id: UUID
    name: str
    slug: str
    plan: str
    created_at: str | None = None


class MemberOut(BaseModel):
    user_id: UUID
    email: str
    full_name: str
    role: str
    joined_at: str | None = None


class MemberUpdate(BaseModel):
    role: str


class InvitationCreate(BaseModel):
    email: str
    role: str = "member"


class InvitationOut(BaseModel):
    id: UUID
    workspace_id: UUID
    email: str
    role: str
    token: str
    accepted: bool
    expires_at: str
    created_at: str | None = None