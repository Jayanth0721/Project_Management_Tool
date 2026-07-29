from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.models.project import Project
from app.models.board import Board
from app.schemas.board import BoardCreate, BoardUpdate
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, AuthError
from app.services.board_service import (
    create_board,
    get_boards_for_project,
    update_board as update_board_svc,
    delete_board as delete_board_svc,
)

router = APIRouter()


def board_to_dict(b: Board) -> dict:
    return {
        "id": str(b.id),
        "project_id": str(b.project_id),
        "name": b.name,
        "type": b.type,
        "filter_json": b.filter_json,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }


@router.get("/{project_key}/boards")
async def list_boards(
    project_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)
    boards = await get_boards_for_project(db, project.id)
    return [board_to_dict(b) for b in boards]


@router.post("/{project_key}/boards", status_code=status.HTTP_201_CREATED)
async def create_board_route(
    project_key: str,
    body: BoardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Admin access required", status.HTTP_403_FORBIDDEN)
    board = await create_board(db, project.id, body.name, body.type, body.filter_json)
    return board_to_dict(board)


@router.get("/{project_key}/boards/{board_id}")
async def get_board(
    project_key: str,
    board_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None:
        raise AuthError("Not a member", status.HTTP_403_FORBIDDEN)
    board = await db.get(Board, board_id)
    if board is None or board.project_id != project.id:
        raise NotFoundError("Board not found")
    return board_to_dict(board)


@router.patch("/{project_key}/boards/{board_id}")
async def update_board_route(
    project_key: str,
    board_id: UUID,
    body: BoardUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Admin access required", status.HTTP_403_FORBIDDEN)
    board = await db.get(Board, board_id)
    if board is None or board.project_id != project.id:
        raise NotFoundError("Board not found")
    board = await update_board_svc(db, board, body.model_dump(exclude_none=True))
    return board_to_dict(board)


@router.delete("/{project_key}/boards/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board_route(
    project_key: str,
    board_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.key == project_key))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    member = await db.get(WorkspaceMember, (project.workspace_id, current_user.id))
    if member is None or member.role not in ("owner", "admin"):
        raise AuthError("Admin access required", status.HTTP_403_FORBIDDEN)
    board = await db.get(Board, board_id)
    if board is None or board.project_id != project.id:
        raise NotFoundError("Board not found")
    await delete_board_svc(db, board)