import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.email import send_password_reset_email
from app.db.session import get_db
from app.models.user import User, PasswordResetToken
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    MeResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.core.security import (
    hash_password,
    verify_password,
    TokenPair,
    decode_token,
    verify_refresh_token,
    create_access_token,
    get_current_user,
)
from app.core.exceptions import ConflictError, AuthError, NotFoundError

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none() is not None:
        raise ConflictError("Email already registered")

    user = User(
        email=req.email,
        full_name=req.full_name,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    tokens = TokenPair(str(user.id))
    return {
        "access_token": tokens.access,
        "refresh_token": tokens.refresh,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
    }


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(req.password, user.hashed_password):
        raise AuthError("Invalid email or password")

    if not user.is_active:
        raise AuthError("Account is deactivated", status.HTTP_403_FORBIDDEN)

    tokens = TokenPair(str(user.id))
    return {
        "access_token": tokens.access,
        "refresh_token": tokens.refresh,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
    }


@router.post("/refresh")
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    user_id_str = verify_refresh_token(req.refresh_token)
    user = await db.get(User, UUID(user_id_str))
    if user is None or not user.is_active:
        raise AuthError("Invalid user")

    tokens = TokenPair(str(user.id))
    return {
        "access_token": tokens.access,
        "refresh_token": tokens.refresh,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
    }


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out"}


@router.get("/me", response_model=MeResponse)
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    # Always return success to avoid email enumeration
    if user is None:
        return {"message": "If that email is registered, a reset link has been sent"}

    token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    reset = PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at)
    db.add(reset)
    await db.commit()

    reset_link = f"{settings.cors_origins_list[0]}/reset-password?token={token}"
    print(f"[password-reset] Link for {user.email}: {reset_link}")
    send_password_reset_email(user.email, reset_link)

    return {"message": "If that email is registered, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token == req.token,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        )
    )
    reset = result.scalar_one_or_none()
    if reset is None:
        raise NotFoundError("Invalid or expired reset token")

    user = await db.get(User, reset.user_id)
    if user is None:
        raise NotFoundError("User not found")

    user.hashed_password = hash_password(req.new_password)
    reset.used_at = datetime.now(timezone.utc)
    await db.commit()

    return {"message": "Password reset successfully"}