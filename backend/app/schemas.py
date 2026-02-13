"""Pydantic schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class AuthorBase(BaseModel):
    name: str
    biography_bg: str
    biography_en: Optional[str] = None
    # Use snake_case in JSON to match frontend types
    photo_url: Optional[str] = None


class AuthorCreate(AuthorBase):
    pass


class AuthorUpdate(BaseModel):
    name: Optional[str] = None
    biography_bg: Optional[str] = None
    biography_en: Optional[str] = None
    photo_url: Optional[str] = None


class PlayImageCaptionUpdate(BaseModel):
    caption_bg: Optional[str] = None
    caption_en: Optional[str] = None


class PlayImageRead(BaseModel):
    id: int
    # Use snake_case in JSON to match frontend types
    image_url: str
    caption_bg: Optional[str] = None
    caption_en: Optional[str] = None

    class Config:
        orm_mode = True


class PlayFileRead(BaseModel):
    id: int
    file_url: str
    caption_bg: Optional[str] = None
    caption_en: Optional[str] = None

    class Config:
        orm_mode = True


class PlayFileCaptionUpdate(BaseModel):
    caption_bg: Optional[str] = None
    caption_en: Optional[str] = None


class PlayBase(BaseModel):
    title_bg: str
    title_en: Optional[str] = None
    description_bg: str
    description_en: Optional[str] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    theme: Optional[str] = None
    male_participants: Optional[int] = None
    female_participants: Optional[int] = None
    author_id: int
    pdf_path: Optional[str] = None


class PlayCreate(PlayBase):
    image_urls: Optional[List[str]] = None


class PlayUpdate(BaseModel):
    title_bg: Optional[str] = None
    title_en: Optional[str] = None
    description_bg: Optional[str] = None
    description_en: Optional[str] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    theme: Optional[str] = None
    male_participants: Optional[int] = None
    female_participants: Optional[int] = None
    author_id: Optional[int] = None
    pdf_path: Optional[str] = None
    image_urls: Optional[List[str]] = None


class AuthorRead(AuthorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class PlayRead(PlayBase):
    id: int
    created_at: datetime
    updated_at: datetime
    author: Optional[AuthorRead] = None

    class Config:
        orm_mode = True


class PlayDetail(PlayRead):
    images: List[PlayImageRead] = []
    files: List[PlayFileRead] = []


class AuthorDetail(AuthorRead):
    plays: List[PlayRead] = []


class LiteraryPieceBase(BaseModel):
    title_bg: str
    title_en: Optional[str] = None
    description_bg: str
    description_en: Optional[str] = None
    pdf_path: Optional[str] = None
    author_id: int
    play_id: Optional[int] = None


class LiteraryPieceCreate(LiteraryPieceBase):
    pass


class LiteraryPieceUpdate(BaseModel):
    title_bg: Optional[str] = None
    title_en: Optional[str] = None
    description_bg: Optional[str] = None
    description_en: Optional[str] = None
    pdf_path: Optional[str] = None
    author_id: Optional[int] = None
    play_id: Optional[int] = None


class LiteraryPieceRead(LiteraryPieceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    author: Optional[AuthorRead] = None
    play: Optional[PlayRead] = None

    class Config:
        orm_mode = True


class AdminLoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

