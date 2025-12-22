"""Seed helpers for initial demo data."""

from sqlmodel import Session, select

from .models import Author, Play, PlayImage


def seed_demo_data(session: Session) -> None:
    """Populate the database with Bulgarian demo authors and plays."""
    author_names = {
        "Иван Вазов": Author(
            name="Иван Вазов",
            biography="Класик на българската литература, автор на множество пиеси и романи.",
            photo_url="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Ivan_Vazov.jpg/330px-Ivan_Vazov.jpg",
        ),
        "Пейо Яворов": Author(
            name="Пейо Яворов",
            biography="Поет и драматург, свързан със символизма и модернизма в България.",
            photo_url="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Pejo_Yavorov.jpg/330px-Pejo_Yavorov.jpg",
        ),
        "Яна Добрева": Author(
            name="Яна Добрева",
            biography="Съвременен драматург с фокус върху съвременното българско общество.",
            photo_url=None,
        ),
    }

    for name, author in author_names.items():
        exists = session.exec(select(Author).where(Author.name == name)).first()
        if not exists:
            session.add(author)
    session.commit()

    plays_data = [
        {
            "title": "Под игото",
            "author_name": "Иван Вазов",
            "description": "Драматизация на знаковия роман за българското възраждане.",
            "year": 1894,
            "genre": "Историческа драма",
            "images": [
                "https://images.unsplash.com/photo-1545239351-1141bd82e8a6",
                "https://images.unsplash.com/photo-1485561672498-63b532250ede",
            ],
        },
        {
            "title": "В полите на Витоша",
            "author_name": "Пейо Яворов",
            "description": "Трагическа пиеса за любов и общество, вдъхновена от истински събития.",
            "year": 1910,
            "genre": "Трагедия",
            "images": ["https://images.unsplash.com/photo-1454922915609-78549ad709bb"],
        },
        {
            "title": "Гласове в мъглата",
            "author_name": "Яна Добрева",
            "description": "Съвременна урбанистична драма за семейство и памет.",
            "year": 2017,
            "genre": "Съвременна драма",
            "images": ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"],
        },
    ]

    for play_data in plays_data:
        author = session.exec(select(Author).where(Author.name == play_data["author_name"])).first()
        if not author:
            continue
        existing = session.exec(select(Play).where(Play.title == play_data["title"])).first()
        if existing:
            continue
        play = Play(
            title=play_data["title"],
            description=play_data["description"],
            year=play_data["year"],
            genre=play_data["genre"],
            author_id=author.id,  # type: ignore[arg-type]
        )
        session.add(play)
        session.flush()
        for image in play_data["images"]:
            session.add(PlayImage(play_id=play.id, image_url=image))  # type: ignore[arg-type]
    session.commit()

