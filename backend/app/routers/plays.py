"""Public play endpoints."""

from pathlib import Path
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse, RedirectResponse, Response
from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from ..core.config import get_settings
from ..database import get_session
from ..models import Play
from ..schemas import PlayDetail, PlayRead


router = APIRouter(prefix="/api/plays", tags=["plays"])
settings = get_settings()


@router.get("/", response_model=List[PlayRead])
def list_plays(
    search: Optional[str] = Query(default=None, description="Търсене по заглавие"),
    author_id: Optional[int] = Query(default=None, description="Филтър по автор"),
    genre: Optional[str] = Query(default=None, description="Филтър по жанр"),
    theme: Optional[str] = Query(default=None, description="Филтър по тема"),
    year_min: Optional[int] = Query(default=None, description="Минимална година"),
    year_max: Optional[int] = Query(default=None, description="Максимална година"),
    male_participants_min: Optional[int] = Query(default=None, description="Минимален брой мъже"),
    male_participants_max: Optional[int] = Query(default=None, description="Максимален брой мъже"),
    female_participants_min: Optional[int] = Query(default=None, description="Минимален брой жени"),
    female_participants_max: Optional[int] = Query(default=None, description="Максимален брой жени"),
    session: Session = Depends(get_session),
) -> List[PlayRead]:
    query = select(Play).options(selectinload(Play.author))
    if search:
        pattern = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(Play.title_bg).like(pattern),
                (Play.title_en.isnot(None)) & (func.lower(Play.title_en).like(pattern)),
            )
        )
    if author_id:
        query = query.where(Play.author_id == author_id)
    if genre:
        query = query.where(Play.genre == genre)
    if theme:
        query = query.where(Play.theme == theme)
    if year_min is not None:
        query = query.where(Play.year >= year_min)
    if year_max is not None:
        query = query.where(Play.year <= year_max)
    if male_participants_min is not None:
        query = query.where(Play.male_participants >= male_participants_min)
    if male_participants_max is not None:
        query = query.where(Play.male_participants <= male_participants_max)
    if female_participants_min is not None:
        query = query.where(Play.female_participants >= female_participants_min)
    if female_participants_max is not None:
        query = query.where(Play.female_participants <= female_participants_max)
    plays = session.exec(query.order_by(Play.title_bg)).all()
    return [PlayRead.from_orm(play) for play in plays]


@router.get("/{play_id}", response_model=PlayDetail)
def get_play(play_id: int, session: Session = Depends(get_session)) -> PlayDetail:
    play = session.exec(
        select(Play)
            .where(Play.id == play_id)
            .options(selectinload(Play.author), selectinload(Play.images))
    ).first()
    if not play:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Пиесата не е намерена."
        )
    return PlayDetail.from_orm(play)


@router.get("/{play_id}/download-pdf")
def download_pdf(play_id: int, session: Session = Depends(get_session)):
    play = session.get(Play, play_id)
    if not play or not play.pdf_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Няма качен сценарий.")
    
    # If it's a Cloudinary URL, proxy it through our server to avoid CORS issues
    if play.pdf_path.startswith("https://res.cloudinary.com"):
        try:
            # Fetch the PDF from Cloudinary
            with httpx.Client() as client:
                response = client.get(play.pdf_path, timeout=30.0)
                response.raise_for_status()
                # Return the PDF with proper headers
                return Response(
                    content=response.content,
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": f'attachment; filename="play-{play_id}-script.pdf"',
                        "Content-Length": str(len(response.content)),
                    },
                )
        except Exception:
            # Fallback to redirect if proxy fails
            return RedirectResponse(url=play.pdf_path, status_code=302)
    
    # Otherwise, try to serve from local storage (for backward compatibility)
    pdf_path = Path(play.pdf_path)
    if not pdf_path.is_absolute():
        pdf_path = settings.media_root / pdf_path
    if not pdf_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файлът липсва.")
    return FileResponse(pdf_path, media_type="application/pdf", filename=pdf_path.name)

