"""Database migration utilities."""

from sqlalchemy import inspect, text
from sqlmodel import Session

from .database import engine


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    try:
        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            return False
        columns = {col["name"] for col in inspector.get_columns(table_name)}
        return column_name in columns
    except Exception:
        return False


def drop_column_if_exists(table_name: str, column_name: str) -> bool:
    """Drop a column from a table if it exists. Returns True if column was dropped."""
    if not column_exists(table_name, column_name):
        return False
    try:
        with Session(engine) as session:
            session.exec(text(f"ALTER TABLE {table_name} DROP COLUMN {column_name}"))
            session.commit()
            print(f"Dropped '{column_name}' column from {table_name} table")
            return True
    except Exception as e:
        print(f"Error dropping column {column_name} from {table_name}: {e}")
        raise


def add_column_if_not_exists(table_name: str, column_name: str, column_type: str) -> bool:
    """Add a column to a table if it doesn't exist. Returns True if column was added."""
    if column_exists(table_name, column_name):
        return False
    
    try:
        with Session(engine) as session:
            session.exec(
                text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
            )
            session.commit()
            print(f"Added '{column_name}' column to {table_name} table")
            return True
    except Exception as e:
        # Check if error is because column already exists (race condition)
        if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
            return False
        # Re-raise other errors
        print(f"Error adding column {column_name} to {table_name}: {e}")
        raise


def migrate_play_table() -> None:
    """Add new columns to the play table if they don't exist."""
    try:
        # Check if table exists
        if not column_exists("play", "id"):
            print("Table 'play' does not exist yet, will be created by init_db")
            return
        
        # Add new columns if they don't exist
        add_column_if_not_exists("play", "theme", "VARCHAR")
        add_column_if_not_exists("play", "male_participants", "INTEGER")
        add_column_if_not_exists("play", "female_participants", "INTEGER")
    except Exception as e:
        # If table doesn't exist yet, that's fine - init_db will create it
        if "does not exist" not in str(e).lower() and "relation" not in str(e).lower():
            print(f"Migration error (non-critical): {e}")
        # Silently continue if table doesn't exist - it will be created by init_db


def migrate_drop_duration() -> None:
    """Drop duration column from play table if it exists."""
    try:
        if not column_exists("play", "id"):
            return
        drop_column_if_exists("play", "duration")
    except Exception as e:
        if "does not exist" not in str(e).lower() and "relation" not in str(e).lower():
            print(f"Migration error dropping duration (non-critical): {e}")


def migrate_play_image_captions() -> None:
    """Add caption_bg and caption_en to playimage table."""
    try:
        if not column_exists("playimage", "id"):
            return
        add_column_if_not_exists("playimage", "caption_bg", "VARCHAR")
        add_column_if_not_exists("playimage", "caption_en", "VARCHAR")
    except Exception as e:
        if "does not exist" not in str(e).lower() and "relation" not in str(e).lower():
            print(f"Migration error playimage captions (non-critical): {e}")


def migrate_bilingual() -> None:
    """Add bilingual columns and backfill from existing title/description/biography."""
    try:
        with Session(engine) as session:
            # Author: add biography_bg, biography_en and backfill from biography
            if column_exists("author", "biography") and not column_exists("author", "biography_bg"):
                for stmt in [
                    "ALTER TABLE author ADD COLUMN biography_bg VARCHAR",
                    "ALTER TABLE author ADD COLUMN biography_en VARCHAR",
                ]:
                    session.exec(text(stmt))
                session.exec(text("UPDATE author SET biography_bg = biography"))
                session.commit()
                print("Migrated author to biography_bg/biography_en")

            # Play: add title_bg, title_en, description_bg, description_en and backfill
            if column_exists("play", "title") and not column_exists("play", "title_bg"):
                for stmt in [
                    "ALTER TABLE play ADD COLUMN title_bg VARCHAR",
                    "ALTER TABLE play ADD COLUMN title_en VARCHAR",
                    "ALTER TABLE play ADD COLUMN description_bg VARCHAR",
                    "ALTER TABLE play ADD COLUMN description_en VARCHAR",
                ]:
                    session.exec(text(stmt))
                session.exec(text("UPDATE play SET title_bg = title, description_bg = description"))
                session.commit()
                print("Migrated play to title_bg/title_en and description_bg/description_en")
    except Exception as e:
        if "does not exist" not in str(e).lower() and "relation" not in str(e).lower():
            print(f"Bilingual migration error (non-critical): {e}")


def run_migrations() -> None:
    """Run all pending migrations."""
    migrate_play_table()
    migrate_drop_duration()
    migrate_play_image_captions()
    migrate_bilingual()
