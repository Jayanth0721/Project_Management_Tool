from uuid import UUID

from pydantic import BaseModel


class PageCreate(BaseModel):
    space_id: UUID
    parent_page_id: UUID | None = None
    title: str
    slug: str
    body: str | None = None
    status: str = "draft"


class PageUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    body: str | None = None
    parent_page_id: UUID | None = None
    position: int | None = None
    status: str | None = None


class PageOut(BaseModel):
    id: UUID
    space_id: UUID
    parent_page_id: UUID | None = None
    title: str
    slug: str
    version: int
    author_id: UUID | None = None
    position: int
    status: str
    created_at: str | None = None
    updated_at: str | None = None