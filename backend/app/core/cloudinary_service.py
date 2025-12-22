"""Cloudinary service for file uploads and management."""

import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from .config import get_settings


def init_cloudinary() -> None:
    """Initialize Cloudinary with settings from environment."""
    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,  # Use HTTPS
    )


def upload_file(
    upload: UploadFile, folder: str, name_prefix: str | None = None
) -> str:
    """Upload a file to Cloudinary and return the secure URL.
    
    Args:
        upload: The uploaded file
        folder: Cloudinary folder to organize files (e.g., 'authors', 'plays', 'pdfs')
        name_prefix: Optional prefix for the public_id (e.g., 'author-1')
    
    Returns:
        The secure URL of the uploaded file
    """
    init_cloudinary()
    
    # Read file content
    file_content = upload.file.read()
    upload.file.seek(0)  # Reset file pointer for potential reuse
    
    # Generate public_id with unique identifier to avoid overwrites
    import uuid
    unique_id = uuid.uuid4().hex[:8]  # Short unique ID
    if name_prefix:
        public_id = f"{name_prefix}-{unique_id}"
    else:
        public_id = unique_id
    
    # Upload to Cloudinary (folder is set separately, public_id is just the name)
    # Set access_mode to "public" to ensure files are accessible
    result = cloudinary.uploader.upload(
        file_content,
        folder=folder,
        public_id=public_id,
        resource_type="auto",  # Auto-detect image, video, or raw (for PDFs)
        access_mode="public",  # Make files publicly accessible
    )
    
    return result["secure_url"]


def delete_file(url: str) -> None:
    """Delete a file from Cloudinary by its URL.
    
    Args:
        url: The Cloudinary secure URL of the file to delete
    """
    if not url or not url.startswith("https://res.cloudinary.com"):
        # Not a Cloudinary URL, skip deletion
        return
    
    init_cloudinary()
    
    try:
        # Extract public_id from URL
        # URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{folder}/{public_id}.{format}
        # or: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
        parts = url.split("/upload/")
        if len(parts) < 2:
            return
        
        # Get the part after /upload/
        path_part = parts[1]
        
        # Remove version if present (format: v1234567890/)
        if "/" in path_part:
            path_parts = path_part.split("/", 1)
            if path_parts[0].startswith("v") and len(path_parts[0]) > 1 and path_parts[0][1:].isdigit():
                # Version found, use the rest
                public_id_with_ext = path_parts[1]
            else:
                # No version, use the whole path
                public_id_with_ext = path_part
        else:
            public_id_with_ext = path_part
        
        # Remove file extension to get public_id (which may include folder)
        if "." in public_id_with_ext:
            public_id = public_id_with_ext.rsplit(".", 1)[0]
        else:
            public_id = public_id_with_ext
        
        # Determine resource type from URL
        if "/image/" in url:
            resource_type = "image"
        elif "/video/" in url:
            resource_type = "video"
        elif "/raw/" in url or url.endswith(".pdf"):
            resource_type = "raw"
        else:
            resource_type = "auto"
        
        # Delete from Cloudinary
        cloudinary.uploader.destroy(public_id, resource_type=resource_type)
    except Exception:
        # Silently fail if deletion doesn't work (file might not exist or URL format is unexpected)
        pass

