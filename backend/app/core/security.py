from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthError
from app.db.session import get_db
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": datetime.now(timezone.utc) + expires_delta})
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")


def create_access_token(subject: str) -> str:
    return create_token(
        {"sub": subject, "type": "access"},
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(subject: str) -> str:
    return create_token(
        {"sub": subject, "type": "refresh"},
        timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return payload
    except JWTError:
        raise AuthError("Invalid or expired token", status.HTTP_401_UNAUTHORIZED)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if token is None:
        raise AuthError("Not authenticated", status.HTTP_401_UNAUTHORIZED)
    payload = decode_token(token)
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise AuthError("Invalid token payload", status.HTTP_401_UNAUTHORIZED)
    user_id = UUID(user_id_str)
    user = await db.get(User, user_id)
    if user is None:
        raise AuthError("User not found", status.HTTP_401_UNAUTHORIZED)
    if not user.is_active:
        raise AuthError("Inactive user", status.HTTP_403_FORBIDDEN)
    return user


class TokenPair:
    def __init__(self, user_id: str):
        self.user_id = user_id

    @property
    def access(self) -> str:
        return create_access_token(self.user_id)

    @property
    def refresh(self) -> str:
        return create_refresh_token(self.user_id)


def verify_refresh_token(token: str) -> str:
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise AuthError("Not a refresh token", status.HTTP_401_UNAUTHORIZED)
    user_id = payload.get("sub")
    if user_id is None:
        raise AuthError("Invalid token payload", status.HTTP_401_UNAUTHORIZED)
    return user_id