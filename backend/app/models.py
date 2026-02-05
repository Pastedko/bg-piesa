"""Database models for bgpiesa."""

from datetime import datetime
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class TimestampMixin(SQLModel):
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class Author(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(nullable=False, index=True)
    biography_bg: str = Field(nullable=False)
    biography_en: Optional[str] = Field(default=None)
    photo_url: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    plays: List["Play"] = Relationship(
        back_populates="author",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Play(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title_bg: str = Field(nullable=False, index=True)
    title_en: Optional[str] = Field(default=None)
    description_bg: str = Field(nullable=False)
    description_en: Optional[str] = Field(default=None)
    year: Optional[int] = Field(default=None)
    genre: Optional[str] = Field(default=None)
    theme: Optional[str] = Field(default=None)
    male_participants: Optional[int] = Field(default=None)
    female_participants: Optional[int] = Field(default=None)
    pdf_path: Optional[str] = Field(default=None)
    author_id: int = Field(foreign_key="author.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    author: "Author" = Relationship(back_populates="plays")
    images: List["PlayImage"] = Relationship(
        back_populates="play",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class PlayImage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    image_url: str = Field(nullable=False)
    caption_bg: Optional[str] = Field(default=None)
    caption_en: Optional[str] = Field(default=None)
    play_id: int = Field(foreign_key="play.id", nullable=False)

    play: "Play" = Relationship(back_populates="images")

