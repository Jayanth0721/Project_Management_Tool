from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.board import Board


async def create_board(
    db: AsyncSession,
    project_id: UUID,
    name: str,
    type: str,
    filter_json: str | None,
) -> Board:
    board = Board(
        project_id=project_id, name=name, type=type, filter_json=filter_json
    )
    db.add(board)
    await db.commit()
    await db.refresh(board)
    return board


async def get_boards_for_project(
    db: AsyncSession, project_id: UUID
) -> list[Board]:
    result = await db.execute(
        select(Board)
        .where(Board.project_id == project_id)
        .order_by(Board.created_at)
    )
    return list(result.scalars().all())


async def update_board(db: AsyncSession, board: Board, data: dict) -> Board:
    if "name" in data:
        board.name = data["name"]
    if "type" in data:
        board.type = data["type"]
    if "filter_json" in data:
        board.filter_json = data["filter_json"]
    await db.commit()
    await db.refresh(board)
    return board


async def delete_board(db: AsyncSession, board: Board) -> None:
    await db.delete(board)
    await db.commit()