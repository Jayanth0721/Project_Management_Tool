import os
import uuid
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile
from app.models.attachment import Attachment
from app.core.config import settings

STORAGE_DIR = settings.storage_dir or "./storage"


async def save_uploaded_file(file: UploadFile) -> str:
    storage_key = str(uuid.uuid4())
    os.makedirs(STORAGE_DIR, exist_ok=True)
    file_path = os.path.join(STORAGE_DIR, storage_key)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    return storage_key


def get_file_path(storage_key: str) -> str:
    return os.path.join(STORAGE_DIR, storage_key)


async def create_attachment(
    db: AsyncSession,
    target_type: str,
    target_id: str,
    filename: str,
    storage_key: str,
    mime_type: str | None,
    size_bytes: int | None,
    uploaded_by: UUID,
) -> Attachment:
    attachment = Attachment(
        target_type=target_type,
        target_id=target_id,
        filename=filename,
        storage_key=storage_key,
        mime_type=mime_type,
        size_bytes=size_bytes,
        uploaded_by=uploaded_by,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return attachment


async def get_attachments_for_target(
    db: AsyncSession,
    target_type: str,
    target_id: str,
) -> list[dict]:
    result = await db.execute(
        select(Attachment)
        .where(Attachment.target_type == target_type, Attachment.target_id == target_id)
        .order_by(Attachment.created_at.desc())
    )
    attachments = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "target_type": a.target_type,
            "target_id": a.target_id,
            "filename": a.filename,
            "storage_key": a.storage_key,
            "mime_type": a.mime_type,
            "size_bytes": a.size_bytes,
            "uploaded_by": str(a.uploaded_by) if a.uploaded_by else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in attachments
    ]


async def delete_attachment(db: AsyncSession, attachment: Attachment) -> None:
    file_path = get_file_path(attachment.storage_key)
    if os.path.exists(file_path):
        os.remove(file_path)
    await db.delete(attachment)
    await db.commit()


async def get_attachment_by_id(db: AsyncSession, attachment_id: UUID) -> Attachment | None:
    return await db.get(Attachment, attachment_id)
