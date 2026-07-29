from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool


class UserUpdate(BaseModel):
    full_name: str | None = None