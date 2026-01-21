"""Pydantic schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class AuthorBase(BaseModel):
    name: str
    biography: str
    # Use snake_case in JSON to match frontend types
    photo_url: Optional[str] = None


class AuthorCreate(AuthorBase):
    pass


class AuthorUpdate(BaseModel):
    name: Optional[str] = None
    biography: Optional[str] = None
    photo_url: Optional[str] = None


class PlayImageRead(BaseModel):
    id: int
    # Use snake_case in JSON to match frontend types
    image_url: str

    class Config:
        orm_mode = True


class PlayBase(BaseModel):
    title: str
    description: str
    year: Optional[int] = None
    genre: Optional[str] = None
    theme: Optional[str] = None
    duration: Optional[int] = None
    male_participants: Optional[int] = None
    female_participants: Optional[int] = None
    author_id: int
    pdf_path: Optional[str] = None


class PlayCreate(PlayBase):
    image_urls: Optional[List[str]] = None


class PlayUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    theme: Optional[str] = None
    duration: Optional[int] = None
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


class AuthorDetail(AuthorRead):
    plays: List[PlayRead] = []


class AdminLoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

