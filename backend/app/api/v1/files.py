import os
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.attachment import Attachment
from app.models.workspace import WorkspaceMember
from app.models.project import Project
from app.models.space import Space, Page
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, AuthError
from app.services.attachment_service import STORAGE_DIR

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    storage_key = str(uuid.uuid4())
    os.makedirs(STORAGE_DIR, exist_ok=True)
    content = await file.read()
    with open(os.path.join(STORAGE_DIR, storage_key), "wb") as f:
        f.write(content)
    return {
        "storage_key": storage_key,
        "filename": file.filename,
        "mime_type": file.content_type,
    }


@router.get("/{storage_key}")
async def download_file(
    storage_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Resolve workspace ownership through the attachment record
    result = await db.execute(select(Attachment).where(Attachment.storage_key == storage_key))
    attachment = result.scalar_one_or_none()
    if attachment is None:
        return JSONResponse(status_code=404, content={"detail": "File not found"})

    # Determine workspace_id based on target_type
    workspace_id = None
    if attachment.target_type == "issues":
        project_key = attachment.target_id.split("-")[0]
        proj_result = await db.execute(select(Project).where(Project.key == project_key))
        project = proj_result.scalar_one_or_none()
        if project:
            workspace_id = project.workspace_id
    elif attachment.target_type == "pages":
        page = await db.get(Page, UUID(attachment.target_id))
        if page:
            space = await db.get(Space, page.space_id)
            if space:
                workspace_id = space.workspace_id

    if workspace_id is None:
        return JSONResponse(status_code=404, content={"detail": "File not found"})

    member = await db.get(WorkspaceMember, (workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member of this workspace")

    file_path = os.path.join(STORAGE_DIR, storage_key)
    if not os.path.exists(file_path):
        return JSONResponse(status_code=404, content={"detail": "File not found"})
    return FileResponse(file_path)
