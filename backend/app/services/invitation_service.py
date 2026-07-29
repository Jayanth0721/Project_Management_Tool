import secrets
from uuid import UUID

from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.workspace import Invitation, WorkspaceMember


async def create_invitation(
    db: AsyncSession, workspace_id: UUID, email: str, role: str
) -> Invitation:
    token = secrets.token_urlsafe(32)
    invitation = Invitation(
        workspace_id=workspace_id,
        email=email,
        role=role,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)
    return invitation


async def get_invitation_by_token(db: AsyncSession, token: str) -> Invitation | None:
    result = await db.execute(select(Invitation).where(Invitation.token == token))
    return result.scalar_one_or_none()


async def accept_invitation(
    db: AsyncSession, token: str, user: User
) -> WorkspaceMember | None:
    invitation = await get_invitation_by_token(db, token)
    if invitation is None:
        return None
    if invitation.accepted:
        return None
    if invitation.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return None

    invitation.accepted = True

    existing = await db.get(WorkspaceMember, (invitation.workspace_id, user.id))
    if existing is not None:
        await db.commit()
        return existing

    member = WorkspaceMember(
        workspace_id=invitation.workspace_id,
        user_id=user.id,
        role=invitation.role,
    )
    db.add(member)
    await db.commit()
    return member