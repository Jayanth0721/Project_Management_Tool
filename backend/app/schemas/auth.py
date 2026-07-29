from uuid import UUID

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: UUID
    email: str
    full_name: str


class RefreshRequest(BaseModel):
    refresh_token: str


class MeResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str