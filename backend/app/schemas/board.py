from uuid import UUID
from pydantic import BaseModel


class BoardCreate(BaseModel):
    name: str = "Board"
    type: str = "kanban"
    filter_json: str | None = None


class BoardUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    filter_json: str | None = None


class SprintCreate(BaseModel):
    name: str = "Sprint"
    goal: str | None = None
    start_date: str | None = None
    end_date: str | None = None


class SprintUpdate(BaseModel):
    name: str | None = None
    goal: str | None = None
    start_date: str | None = None
    end_date: str | None = None


class CommentCreate(BaseModel):
    body: str
