"""Admin endpoints protected by token."""

from datetime import datetime
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from ..core.cloudinary_service import delete_file, upload_file
from ..core.security import admin_required, create_access_token, verify_admin_password
from ..database import get_session
from ..models import Author, LiteraryPiece, Play, PlayFile, PlayImage
from ..schemas import (
    AdminLoginRequest,
    AuthorCreate,
    AuthorRead,
    AuthorUpdate,
    LiteraryPieceCreate,
    LiteraryPieceRead,
    LiteraryPieceUpdate,
    PlayCreate,
    PlayDetail,
    PlayFileCaptionUpdate,
    PlayFileRead,
    PlayImageCaptionUpdate,
    PlayImageRead,
    PlayRead,
    PlayUpdate,
    TokenResponse,
)


router = APIRouter(prefix="/api/admin", tags=["admin"])


def _play_with_relations(session: Session, play_id: int) -> Optional[Play]:
    return session.exec(
        select(Play)
        .where(Play.id == play_id)
        .options(
            selectinload(Play.author),
            selectinload(Play.images),
            selectinload(Play.files),
        )
    ).first()


@router.post("/login", response_model=TokenResponse)
def admin_login(payload: AdminLoginRequest) -> TokenResponse:
    if not verify_admin_password(payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Грешна парола.")
    token = create_access_token("admin")
    return TokenResponse(access_token=token)


@router.post("/authors", response_model=AuthorRead)
def create_author(
    author_in: AuthorCreate,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> AuthorRead:
    # Pydantic v1: use .dict() instead of .model_dump()
    author = Author(**author_in.dict())
    session.add(author)
    session.commit()
    session.refresh(author)
    # Pydantic v1: use from_orm with orm_mode
    return AuthorRead.from_orm(author)


@router.put("/authors/{author_id}", response_model=AuthorRead)
def update_author(
    author_id: int,
    author_in: AuthorUpdate,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> AuthorRead:
    author = session.get(Author, author_id)
    if not author:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Авторът не е намерен."
        )
    # Pydantic v1: use .dict(exclude_unset=True)
    for key, value in author_in.dict(exclude_unset=True).items():
        setattr(author, key, value)
    author.updated_at = datetime.utcnow()
    session.add(author)
    session.commit()
    session.refresh(author)
    return AuthorRead.from_orm(author)


@router.delete("/authors/{author_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_author(
    author_id: int,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> None:
    author = session.get(Author, author_id)
    if not author:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Авторът не е намерен.")
    if author.plays:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Изтрийте или преместете пиесите на автора преди тази операция.",
        )
    # Delete photo from Cloudinary if it exists
    if author.photo_url and author.photo_url.startswith("https://res.cloudinary.com"):
        delete_file(author.photo_url)
    session.delete(author)
    session.commit()


@router.post("/plays", response_model=PlayDetail)
def create_play(
    play_in: PlayCreate,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> PlayDetail:
    # Pydantic v1: use .dict(exclude=...)
    play = Play(**play_in.dict(exclude={"image_urls"}))
    session.add(play)
    session.commit()
    if play_in.image_urls:
        for url in play_in.image_urls:
            session.add(PlayImage(play_id=play.id, image_url=url))
        session.commit()
    enriched = _play_with_relations(session, play.id) or play
    return PlayDetail.from_orm(enriched)


@router.put("/plays/{play_id}", response_model=PlayDetail)
def update_play(
    play_id: int,
    play_in: PlayUpdate,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> PlayDetail:
    play = session.get(Play, play_id)
    if not play:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Пиесата не е намерена."
        )
    # Pydantic v1: use .dict(exclude_unset=True, ...)
    update_data = play_in.dict(exclude_unset=True, exclude={"image_urls"})
    for key, value in update_data.items():
        setattr(play, key, value)
    play.updated_at = datetime.utcnow()
    session.add(play)
    session.commit()
    if play_in.image_urls is not None:
        # Delete old images from Cloudinary before removing from database
        old_images = session.query(PlayImage).filter(PlayImage.play_id == play.id).all()  # type: ignore[attr-defined]
        for old_image in old_images:
            if old_image.image_url.startswith("https://res.cloudinary.com"):
                delete_file(old_image.image_url)
        session.query(PlayImage).filter(PlayImage.play_id == play.id).delete()  # type: ignore[attr-defined]
        for url in play_in.image_urls:
            session.add(PlayImage(play_id=play.id, image_url=url))
        session.commit()
    enriched = _play_with_relations(session, play.id) or play
    return PlayDetail.from_orm(enriched)


@router.delete("/plays/{play_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_play(
    play_id: int,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> None:
    play = session.get(Play, play_id)
    if not play:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пиесата не е намерена.")
    # Delete PDF from Cloudinary if it exists
    if play.pdf_path and play.pdf_path.startswith("https://res.cloudinary.com"):
        delete_file(play.pdf_path)
    # Delete images from Cloudinary
    for image in play.images:
        if image.image_url.startswith("https://res.cloudinary.com"):
            delete_file(image.image_url)
    # Delete files from Cloudinary
    for f in play.files:
        if f.file_url.startswith("https://res.cloudinary.com"):
            delete_file(f.file_url)
    session.delete(play)
    session.commit()


@router.post("/authors/{author_id}/upload-photo", response_model=AuthorRead)
def upload_author_photo(
    author_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> AuthorRead:
    author = session.get(Author, author_id)
    if not author:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Авторът не е намерен."
        )
    # Delete old photo from Cloudinary if it exists
    if author.photo_url and author.photo_url.startswith("https://res.cloudinary.com"):
        delete_file(author.photo_url)
    # Upload to Cloudinary
    cloudinary_url = upload_file(file, "authors", name_prefix=f"author-{author_id}")
    author.photo_url = cloudinary_url
    author.updated_at = datetime.utcnow()
    session.add(author)
    session.commit()
    session.refresh(author)
    return AuthorRead.from_orm(author)


@router.post("/plays/{play_id}/upload-pdf", response_model=PlayRead)
def upload_play_pdf(
    play_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> PlayRead:
    play = session.get(Play, play_id)
    if not play:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Пиесата не е намерена."
        )
    # Delete old PDF from Cloudinary if it exists
    if play.pdf_path and play.pdf_path.startswith("https://res.cloudinary.com"):
        delete_file(play.pdf_path)
    # Upload to Cloudinary
    cloudinary_url = upload_file(file, "pdfs", name_prefix=f"play-{play_id}-script")
    play.pdf_path = cloudinary_url
    play.updated_at = datetime.utcnow()
    session.add(play)
    session.commit()
    enriched = _play_with_relations(session, play.id) or play
    return PlayRead.from_orm(enriched)


@router.post("/plays/{play_id}/upload-image", response_model=PlayDetail)
def upload_play_image(
    play_id: int,
    file: UploadFile = File(...),
    caption_bg: Optional[str] = Form(None),
    caption_en: Optional[str] = Form(None),
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> PlayDetail:
    """Upload a single image with its captions. Call multiple times for multiple images."""
    play = session.get(Play, play_id)
    if not play:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Пиесата не е намерена."
        )
    cloudinary_url = upload_file(file, "images", name_prefix=f"play-{play_id}")
    session.add(
        PlayImage(
            play_id=play.id,
            image_url=cloudinary_url,
            caption_bg=caption_bg.strip() if caption_bg and caption_bg.strip() else None,
            caption_en=caption_en.strip() if caption_en and caption_en.strip() else None,
        )
    )
    play.updated_at = datetime.utcnow()
    session.commit()
    enriched = _play_with_relations(session, play.id) or play
    return PlayDetail.from_orm(enriched)


@router.delete("/plays/{play_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_play_image(
    play_id: int,
    image_id: int,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> None:
    image = session.get(PlayImage, image_id)
    if not image or image.play_id != play_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Изображението не е намерено."
        )
    if image.image_url.startswith("https://res.cloudinary.com"):
        delete_file(image.image_url)
    session.delete(image)
    session.commit()


@router.post("/plays/{play_id}/upload-file", response_model=PlayDetail)
def upload_play_file(
    play_id: int,
    file: UploadFile = File(...),
    caption_bg: Optional[str] = Form(None),
    caption_en: Optional[str] = Form(None),
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> PlayDetail:
    """Upload a single file with its captions. Call multiple times for multiple files."""
    play = session.get(Play, play_id)
    if not play:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Пиесата не е намерена."
        )
    cloudinary_url = upload_file(file, "files", name_prefix=f"play-{play_id}")
    session.add(
        PlayFile(
            play_id=play.id,
            file_url=cloudinary_url,
            caption_bg=caption_bg.strip() if caption_bg and caption_bg.strip() else None,
            caption_en=caption_en.strip() if caption_en and caption_en.strip() else None,
        )
    )
    play.updated_at = datetime.utcnow()
    session.commit()
    enriched = _play_with_relations(session, play.id) or play
    return PlayDetail.from_orm(enriched)


@router.delete("/plays/{play_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_play_file(
    play_id: int,
    file_id: int,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> None:
    f = session.get(PlayFile, file_id)
    if not f or f.play_id != play_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Файлът не е намерен."
        )
    if f.file_url.startswith("https://res.cloudinary.com"):
        delete_file(f.file_url)
    session.delete(f)
    session.commit()


@router.patch("/plays/{play_id}/files/{file_id}", response_model=PlayFileRead)
def update_play_file_caption(
    play_id: int,
    file_id: int,
    payload: PlayFileCaptionUpdate,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> PlayFileRead:
    f = session.get(PlayFile, file_id)
    if not f or f.play_id != play_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Файлът не е намерен."
        )
    if payload.caption_bg is not None:
        f.caption_bg = payload.caption_bg or None
    if payload.caption_en is not None:
        f.caption_en = payload.caption_en or None
    session.add(f)
    session.commit()
    session.refresh(f)
    return PlayFileRead.from_orm(f)


@router.post("/library", response_model=LiteraryPieceRead)
def create_literary_piece(
    piece_in: LiteraryPieceCreate,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> LiteraryPieceRead:
    piece = LiteraryPiece(**piece_in.dict())
    session.add(piece)
    session.commit()
    session.refresh(piece)
    piece = session.exec(
        select(LiteraryPiece)
        .where(LiteraryPiece.id == piece.id)
        .options(
            selectinload(LiteraryPiece.author),
            selectinload(LiteraryPiece.play),
        )
    ).first()
    return LiteraryPieceRead.from_orm(piece)


@router.put("/library/{piece_id}", response_model=LiteraryPieceRead)
def update_literary_piece(
    piece_id: int,
    piece_in: LiteraryPieceUpdate,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> LiteraryPieceRead:
    piece = session.get(LiteraryPiece, piece_id)
    if not piece:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Литературното произведение не е намерено.",
        )
    for key, value in piece_in.dict(exclude_unset=True).items():
        setattr(piece, key, value)
    piece.updated_at = datetime.utcnow()
    session.add(piece)
    session.commit()
    piece = session.exec(
        select(LiteraryPiece)
        .where(LiteraryPiece.id == piece_id)
        .options(
            selectinload(LiteraryPiece.author),
            selectinload(LiteraryPiece.play),
        )
    ).first()
    return LiteraryPieceRead.from_orm(piece)


@router.delete("/library/{piece_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_literary_piece(
    piece_id: int,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> None:
    piece = session.get(LiteraryPiece, piece_id)
    if not piece:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Литературното произведение не е намерено.",
        )
    if piece.pdf_path and piece.pdf_path.startswith("https://res.cloudinary.com"):
        delete_file(piece.pdf_path)
    session.delete(piece)
    session.commit()


@router.post("/library/{piece_id}/upload-pdf", response_model=LiteraryPieceRead)
def upload_literary_piece_pdf(
    piece_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> LiteraryPieceRead:
    piece = session.get(LiteraryPiece, piece_id)
    if not piece:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Литературното произведение не е намерено.",
        )
    if piece.pdf_path and piece.pdf_path.startswith("https://res.cloudinary.com"):
        delete_file(piece.pdf_path)
    cloudinary_url = upload_file(file, "pdfs", name_prefix=f"piece-{piece_id}")
    piece.pdf_path = cloudinary_url
    piece.updated_at = datetime.utcnow()
    session.add(piece)
    session.commit()
    piece = session.exec(
        select(LiteraryPiece)
        .where(LiteraryPiece.id == piece_id)
        .options(
            selectinload(LiteraryPiece.author),
            selectinload(LiteraryPiece.play),
        )
    ).first()
    return LiteraryPieceRead.from_orm(piece)


@router.patch("/plays/{play_id}/images/{image_id}", response_model=PlayImageRead)
def update_play_image_caption(
    play_id: int,
    image_id: int,
    payload: PlayImageCaptionUpdate,
    session: Session = Depends(get_session),
    _: str = Depends(admin_required),
) -> PlayImageRead:
    image = session.get(PlayImage, image_id)
    if not image or image.play_id != play_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Изображението не е намерено."
        )
    if payload.caption_bg is not None:
        image.caption_bg = payload.caption_bg or None
    if payload.caption_en is not None:
        image.caption_en = payload.caption_en or None
    session.add(image)
    session.commit()
    session.refresh(image)
    return PlayImageRead.from_orm(image)

