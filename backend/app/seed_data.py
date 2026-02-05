"""Seed helpers for initial demo data."""

from sqlmodel import Session, select

from .models import Author, Play, PlayImage


def seed_demo_data(session: Session) -> None:
    """Populate the database with Bulgarian demo authors and plays."""
    author_names = {
        "Иван Вазов": Author(
            name="Иван Вазов",
            biography_bg="Класик на българската литература, автор на множество пиеси и романи.",
            biography_en="Classic of Bulgarian literature, author of many plays and novels.",
            photo_url="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Ivan_Vazov.jpg/330px-Ivan_Vazov.jpg",
        ),
        "Пейо Яворов": Author(
            name="Пейо Яворов",
            biography_bg="Поет и драматург, свързан със символизма и модернизма в България.",
            biography_en="Poet and playwright associated with symbolism and modernism in Bulgaria.",
            photo_url="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Pejo_Yavorov.jpg/330px-Pejo_Yavorov.jpg",
        ),
        "Яна Добрева": Author(
            name="Яна Добрева",
            biography_bg="Съвременен драматург с фокус върху съвременното българско общество.",
            biography_en="Contemporary playwright focused on contemporary Bulgarian society.",
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
            "title_bg": "Под игото",
            "title_en": "Under the Yoke",
            "author_name": "Иван Вазов",
            "description_bg": "Драматизация на знаковия роман за българското възраждане.",
            "description_en": "Dramatization of the landmark novel about the Bulgarian Revival.",
            "year": 1894,
            "genre": "Историческа драма",
            "images": [
                "https://images.unsplash.com/photo-1545239351-1141bd82e8a6",
                "https://images.unsplash.com/photo-1485561672498-63b532250ede",
            ],
        },
        {
            "title_bg": "В полите на Витоша",
            "title_en": "On the Slopes of Vitosha",
            "author_name": "Пейо Яворов",
            "description_bg": "Трагическа пиеса за любов и общество, вдъхновена от истински събития.",
            "description_en": "Tragic play about love and society, inspired by true events.",
            "year": 1910,
            "genre": "Трагедия",
            "images": ["https://images.unsplash.com/photo-1454922915609-78549ad709bb"],
        },
        {
            "title_bg": "Гласове в мъглата",
            "title_en": "Voices in the Mist",
            "author_name": "Яна Добрева",
            "description_bg": "Съвременна урбанистична драма за семейство и памет.",
            "description_en": "Contemporary urban drama about family and memory.",
            "year": 2017,
            "genre": "Съвременна драма",
            "images": ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"],
        },
    ]

    for play_data in plays_data:
        author = session.exec(select(Author).where(Author.name == play_data["author_name"])).first()
        if not author:
            continue
        existing = session.exec(select(Play).where(Play.title_bg == play_data["title_bg"])).first()
        if existing:
            continue
        play = Play(
            title_bg=play_data["title_bg"],
            title_en=play_data.get("title_en"),
            description_bg=play_data["description_bg"],
            description_en=play_data.get("description_en"),
            year=play_data["year"],
            genre=play_data["genre"],
            author_id=author.id,  # type: ignore[arg-type]
        )
        session.add(play)
        session.flush()
        for image in play_data["images"]:
            session.add(PlayImage(play_id=play.id, image_url=image))  # type: ignore[arg-type]
    session.commit()

