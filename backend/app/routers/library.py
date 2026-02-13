"""Public library (literary pieces) endpoints."""

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
from ..models import LiteraryPiece
from ..schemas import LiteraryPieceRead

settings = get_settings()


router = APIRouter(prefix="/api/library", tags=["library"])


@router.get("/", response_model=List[LiteraryPieceRead])
def list_literary_pieces(
    search: Optional[str] = Query(default=None, description="Търсене по заглавие"),
    author_id: Optional[int] = Query(default=None, description="Филтър по автор"),
    play_id: Optional[int] = Query(default=None, description="Филтър по пиеса"),
    session: Session = Depends(get_session),
) -> List[LiteraryPieceRead]:
    query = select(LiteraryPiece).options(
        selectinload(LiteraryPiece.author),
        selectinload(LiteraryPiece.play),
    )
    if search:
        pattern = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(LiteraryPiece.title_bg).like(pattern),
                (LiteraryPiece.title_en.isnot(None))
                & (func.lower(LiteraryPiece.title_en).like(pattern)),
            )
        )
    if author_id:
        query = query.where(LiteraryPiece.author_id == author_id)
    if play_id is not None:
        query = query.where(LiteraryPiece.play_id == play_id)
    pieces = session.exec(query.order_by(LiteraryPiece.title_bg)).all()
    return [LiteraryPieceRead.from_orm(p) for p in pieces]


@router.get("/{piece_id}/download-pdf")
def download_literary_piece_pdf(
    piece_id: int, session: Session = Depends(get_session)
):
    piece = session.get(LiteraryPiece, piece_id)
    if not piece or not piece.pdf_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Няма качен PDF.",
        )
    if piece.pdf_path.startswith("https://res.cloudinary.com"):
        try:
            with httpx.Client() as client:
                response = client.get(piece.pdf_path, timeout=30.0)
                response.raise_for_status()
            return Response(
                content=response.content,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'inline; filename="piece-{piece_id}.pdf"',
                    "Content-Length": str(len(response.content)),
                },
            )
        except Exception:
            return RedirectResponse(url=piece.pdf_path, status_code=302)
    pdf_path = Path(piece.pdf_path)
    if not pdf_path.is_absolute():
        pdf_path = settings.media_root / pdf_path
    if not pdf_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Файлът липсва."
        )
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=pdf_path.name,
        headers={"Content-Disposition": f'inline; filename="{pdf_path.name}"'},
    )


@router.get("/{piece_id}", response_model=LiteraryPieceRead)
def get_literary_piece(
    piece_id: int, session: Session = Depends(get_session)
) -> LiteraryPieceRead:
    piece = session.exec(
        select(LiteraryPiece)
        .where(LiteraryPiece.id == piece_id)
        .options(
            selectinload(LiteraryPiece.author),
            selectinload(LiteraryPiece.play),
        )
    ).first()
    if not piece:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Литературното произведение не е намерено.",
        )
    return LiteraryPieceRead.from_orm(piece)
