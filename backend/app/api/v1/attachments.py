import os
from uuid import UUID

from fastapi import APIRouter, Depends, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.models.project import Project
from app.models.space import Space, Page
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, AuthError
from app.services.attachment_service import (
    save_uploaded_file as svc_save_upload,
    get_attachments_for_target,
    delete_attachment,
    get_attachment_by_id,
    create_attachment,
)
from app.services.attachment_service import STORAGE_DIR

router = APIRouter()


def _extract_project_key(issue_key: str) -> str:
    return issue_key.split("-")[0]


async def _save_and_create_attachment(
    db: AsyncSession,
    target_type: str,
    target_id: str,
    file: UploadFile,
    user_id: UUID,
) -> dict:
    content = await file.read()
    storage_key = str(UUID)  # placeholder, use proper uuid
    import uuid as _uuid
    storage_key = str(_uuid.uuid4())
    os.makedirs(STORAGE_DIR, exist_ok=True)
    with open(os.path.join(STORAGE_DIR, storage_key), "wb") as f:
        f.write(content)

    attachment = await create_attachment(
        db, target_type, target_id,
        file.filename or "untitled",
        storage_key,
        file.content_type,
        len(content),
        user_id,
    )
    return {
        "id": str(attachment.id),
        "target_type": attachment.target_type,
        "target_id": attachment.target_id,
        "filename": attachment.filename,
        "storage_key": attachment.storage_key,
        "mime_type": attachment.mime_type,
        "size_bytes": attachment.size_bytes,
        "uploaded_by": str(attachment.uploaded_by) if attachment.uploaded_by else None,
        "created_at": attachment.created_at.isoformat() if attachment.created_at else None,
    }


@router.post("/issues/{issue_key}/attachments", status_code=status.HTTP_201_CREATED)
async def add_issue_attachment(
    issue_key: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_key = _extract_project_key(issue_key)
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)
    return await _save_and_create_attachment(db, "issues", issue_key, file, current_user.id)


@router.get("/issues/{issue_key}/attachments")
async def list_issue_attachments(
    issue_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_key = _extract_project_key(issue_key)
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)
    return await get_attachments_for_target(db, "issues", issue_key)


@router.post("/pages/{page_id}/attachments", status_code=status.HTTP_201_CREATED)
async def add_page_attachment(
    page_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page = await db.get(Page, UUID(page_id))
    if page is None:
        raise NotFoundError("Page not found")
    space = await db.get(Space, page.space_id)
    if space is None:
        raise NotFoundError("Space not found")
    member = await db.get(WorkspaceMember, (space.workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)
    return await _save_and_create_attachment(db, "pages", page_id, file, current_user.id)


@router.get("/pages/{page_id}/attachments")
async def list_page_attachments(
    page_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page = await db.get(Page, UUID(page_id))
    if page is None:
        raise NotFoundError("Page not found")
    space = await db.get(Space, page.space_id)
    if space is None:
        raise NotFoundError("Space not found")
    member = await db.get(WorkspaceMember, (space.workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)
    return await get_attachments_for_target(db, "pages", page_id)


@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment_route(
    attachment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    attachment = await get_attachment_by_id(db, attachment_id)
    if attachment is None:
        raise NotFoundError("Attachment not found")

    # Resolve workspace to verify membership
    workspace_id = None
    if attachment.target_type == "issues":
        project_key = attachment.target_id.split("-")[0]
        result = await db.execute(select(Project).where(Project.key == project_key))
        project = result.scalar_one_or_none()
        if project:
            workspace_id = project.workspace_id
    elif attachment.target_type == "pages":
        page = await db.get(Page, UUID(attachment.target_id))
        if page:
            space = await db.get(Space, page.space_id)
            if space:
                workspace_id = space.workspace_id

    if workspace_id is None:
        raise NotFoundError("Attachment target not found")

    member = await db.get(WorkspaceMember, (workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member of this workspace", status.HTTP_403_FORBIDDEN)

    await delete_attachment(db, attachment)
