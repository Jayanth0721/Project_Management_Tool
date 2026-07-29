from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.workspace import InvitationCreate, InvitationOut
from app.core.security import get_current_user
from app.core.config import settings
from app.core.email import send_invitation_email
from app.core.exceptions import NotFoundError, ConflictError, AuthError, ValidationError
from app.services.invitation_service import create_invitation, get_invitation_by_token, accept_invitation

router = APIRouter()


@router.post("/{workspace_id}/invitations", status_code=status.HTTP_201_CREATED, response_model=InvitationOut)
async def invite_to_workspace(
    workspace_id: UUID,
    data: InvitationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await db.get(Workspace, workspace_id)
    if workspace is None:
        raise NotFoundError("Workspace not found")

    member = await db.get(WorkspaceMember, (workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Insufficient permissions", status.HTTP_403_FORBIDDEN)

    invitation = await create_invitation(db, workspace_id, data.email, data.role)
    base_url = settings.cors_origins_list[0]
    invite_url = f"{base_url}/accept-invitation/{invitation.token}"
    send_invitation_email(data.email, workspace.name, invite_url)
    return {
        "id": invitation.id,
        "workspace_id": invitation.workspace_id,
        "email": invitation.email,
        "role": invitation.role,
        "token": invitation.token,
        "accepted": invitation.accepted,
        "expires_at": invitation.expires_at.isoformat(),
        "created_at": invitation.created_at.isoformat() if invitation.created_at else None,
    }


@router.get("/{token}")
async def view_invitation(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    invitation = await get_invitation_by_token(db, token)
    if invitation is None:
        raise NotFoundError("Invitation not found")

    return {
        "id": str(invitation.id),
        "workspace_name": invitation.workspace.name,
        "workspace_slug": invitation.workspace.slug,
        "email": invitation.email,
        "role": invitation.role,
        "accepted": invitation.accepted,
        "expires_at": invitation.expires_at.isoformat(),
    }


@router.post("/{token}/accept")
async def accept_invite(
    token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await accept_invitation(db, token, current_user)
    if member is None:
        raise ValidationError("Invalid or expired invitation")

    return {"message": "Invitation accepted", "workspace_id": str(member.workspace_id)}