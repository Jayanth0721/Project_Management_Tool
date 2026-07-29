from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.comment import Comment


async def create_comment(
    db: AsyncSession,
    target_type: str,
    target_id: str,
    author_id: UUID,
    body: str,
) -> Comment:
    comment = Comment(
        target_type=target_type,
        target_id=target_id,
        author_id=author_id,
        body=body,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


async def get_comments_for_target(
    db: AsyncSession,
    target_type: str,
    target_id: str,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    result = await db.execute(
        select(Comment)
        .where(Comment.target_type == target_type, Comment.target_id == target_id)
        .order_by(Comment.created_at.asc())
        .offset(offset)
        .limit(limit)
    )
    comments = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "target_type": c.target_type,
            "target_id": c.target_id,
            "author_id": str(c.author_id),
            "body": c.body,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        }
        for c in comments
    ]
