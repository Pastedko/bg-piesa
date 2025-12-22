"""Application configuration utilities."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Global application settings loaded from environment variables."""

    app_name: str = "bgpiesa"
    environment: Literal["development", "production", "test"] = "development"
    backend_cors_origins: list[str] = Field(default_factory=lambda: ["*"])
    database_url: str = Field(
        default="postgresql+psycopg2://postgres:postgres@db:5432/bgpiesa"
    )
    # Required; read from ADMIN_PASSWORD env var (or .env)
    admin_password: str = Field(..., env="ADMIN_PASSWORD")
    # Required; read from JWT_SECRET env var (or .env)
    jwt_secret: str = Field(..., env="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12
    media_root: Path = Field(default=Path("media").resolve())
    media_url_prefix: str = "/media"
    # Cloudinary configuration
    cloudinary_cloud_name: str = Field(..., env="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: str = Field(..., env="CLOUDINARY_API_KEY")
    cloudinary_api_secret: str = Field(..., env="CLOUDINARY_API_SECRET")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    settings = Settings()
    settings.media_root.mkdir(parents=True, exist_ok=True)
    return settings

