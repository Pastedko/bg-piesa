# bgpiesa – Български театър онлайн

bgpiesa е пълноценна уеб платформа за представяне, управление и популяризиране на български автори и пиеси. Проектът включва:

- **Frontend**: React + TypeScript (Vite) с изцяло български интерфейс и модерна бежова визуална тема.
- **Backend**: FastAPI + SQLModel, JWT-базирана администрация и поддръжка на файлови качвания.
- **База данни**: PostgreSQL, с примерни данни за Иван Вазов, Пейо Яворов, Яна Добрева и свързани пиеси.
- **Файлово хранилище**: Cloudinary за качване и управление на изображения и PDF файлове.

## Структура на проекта

```
backend/    # FastAPI приложение и модели
frontend/   # React/Vite клиент
media/      # Качени снимки, PDF-и и изображения
docker-compose.yml
README.md
```

## Предварителни изисквания

- Python 3.11+
- Node.js 20.19+ (Vite предупреждава при по-стара версия)
- PostgreSQL 15+ (локално или в Docker)

## Настройки на средата

Backend чете конфигурация чрез променливи на средата (или `.env` файл в `backend/`):

```
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/bgpiesa
ADMIN_PASSWORD=ChangeMe123!
JWT_SECRET=super-secret-change-me
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
MEDIA_ROOT=media
# Cloudinary configuration (required)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Забележка**: За да използвате Cloudinary, трябва да създадете безплатен акаунт на [cloudinary.com](https://cloudinary.com) и да получите вашите credentials от Dashboard.

## Стартиране на backend локално

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API ще бъде достъпно на `http://localhost:8000`. Файловете се качват в Cloudinary и се връщат като URL адреси.

## Стартиране на frontend локално

```bash
cd frontend
npm install
npm run dev
```

Клиентът се отваря на `http://localhost:5173`. За продукционна сборка използвайте `npm run build`.

## Docker Compose

Проектът включва готов `docker-compose.yml`, който стартира Postgres, FastAPI и Vite dev сървър:

```bash
docker compose up --build
```

Променете `ADMIN_PASSWORD`/`JWT_SECRET` през променливи на средата при нужда.

## Функционалности

- **Публични страници**: Начало, За нас, Автори, Пиеси, детайлни страници за автор и пиеса с търсене.
- **Галерии и PDF**: Поддръжка на изображения и сваляне на сценарий като PDF.
- **Админ панел**: Вход с парола, CRUD за автори и пиеси, качване на снимки/изображения/PDF, предупреждения при изтриване.
- **API**: REST крайни точки `/api/authors`, `/api/plays`, `/api/admin/...` с JWT защита за админ операции.
- **Seed данни**: При старт се създават примерни автори и пиеси (виж `backend/app/seed_data.py`).

## Полезни команди

- Форматиране и проверка на фронтенда: `npm run build`
- Стартиране на backend тестово: `uvicorn app.main:app --reload`
- Достъп до документация на API: `http://localhost:8000/docs`

## Забележки

- Всички текстове във фронтенда са на български, както изисква спецификацията.
- Качените файлове (изображения и PDF) се съхраняват в Cloudinary, което осигурява автоматична оптимизация и CDN доставка.
- Директорията `media/` се използва само за обратна съвместимост със стари файлове. Новите качвания отиват директно в Cloudinary.

Приятна работа с bgpiesa!

