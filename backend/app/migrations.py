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
        add_column_if_not_exists("play", "duration", "INTEGER")
        add_column_if_not_exists("play", "male_participants", "INTEGER")
        add_column_if_not_exists("play", "female_participants", "INTEGER")
    except Exception as e:
        # If table doesn't exist yet, that's fine - init_db will create it
        if "does not exist" not in str(e).lower() and "relation" not in str(e).lower():
            print(f"Migration error (non-critical): {e}")
        # Silently continue if table doesn't exist - it will be created by init_db


def run_migrations() -> None:
    """Run all pending migrations."""
    migrate_play_table()
