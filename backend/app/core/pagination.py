from fastapi import Query
from typing import NamedTuple


class Pagination(NamedTuple):
    offset: int = 0
    limit: int = 50


async def get_pagination(
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
) -> Pagination:
    return Pagination(offset=offset, limit=limit)
