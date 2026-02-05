"""Public author endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from ..database import get_session
from ..models import Author, Play
from ..schemas import AuthorDetail, AuthorRead, PlayRead


router = APIRouter(prefix="/api/authors", tags=["authors"])


@router.get("/", response_model=List[AuthorRead])
def list_authors(
    search: Optional[str] = Query(default=None, description="Търсене по име"),
    session: Session = Depends(get_session),
) -> List[AuthorRead]:
    query = select(Author)
    if search:
        search_value = f"%{search.lower()}%"
        query = query.where(func.lower(Author.name).like(search_value))
    authors = session.exec(query.order_by(Author.name)).all()
    return [AuthorRead.from_orm(author) for author in authors]


@router.get("/{author_id}", response_model=AuthorDetail)
def get_author(
    author_id: int,
    session: Session = Depends(get_session),
    play_search: Optional[str] = Query(default=None, alias="playSearch"),
) -> AuthorDetail:
    author = session.exec(
        select(Author)
        .where(Author.id == author_id)
        .options(selectinload(Author.plays))
    ).first()
    if not author:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Авторът не е намерен."
        )
    plays_query = select(Play).where(Play.author_id == author.id)
    if play_search:
        pattern = f"%{play_search.lower()}%"
        plays_query = plays_query.where(
            or_(
                func.lower(Play.title_bg).like(pattern),
                (Play.title_en.isnot(None)) & (func.lower(Play.title_en).like(pattern)),
            )
        )
    plays = session.exec(plays_query.order_by(Play.title_bg)).all()
    author_dict = AuthorRead.from_orm(author).dict()
    author_dict["plays"] = [PlayRead.from_orm(play) for play in plays]
    return AuthorDetail.parse_obj(author_dict)

