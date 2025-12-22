import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthorCard from '../components/AuthorCard'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import PlayCard from '../components/PlayCard'
import { api } from '../services/api'
import type { Author, Play } from '../types'

const galleryImages = [
  {
    url: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef',
    caption: 'Културно наследство',
  },
  {
    url: 'https://images.unsplash.com/photo-1485561671471-0afc94eba8dd',
    caption: 'Сценичен живот',
  },
  {
    url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26',
    caption: 'Силата на думите',
  },
]

const Home = () => {
  const [authors, setAuthors] = useState<Author[]>([])
  const [plays, setPlays] = useState<Play[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [authorsResponse, playsResponse] = await Promise.all([
          api.getAuthors(),
          api.getPlays(),
        ])
        setAuthors(authorsResponse.slice(0, 3))
        setPlays(playsResponse.slice(0, 3))
      } catch (err) {
        setError('Грешка при зареждането на данните.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="page">
      <section className="hero">
        <p className="hero__eyebrow">Сцена за българската драматургия</p>
        <h1>БГПиеса – Български театър онлайн</h1>
        <p className="hero__subtitle">
          Архив и библиотека за съвременни и класически български пиеси.
          Открийте автори, истории и сценични изображения в единно дигитално
          пространство.
        </p>
        <div className="hero__actions">
          <Link to="/plays" className="btn">
            Разгледай пиеси
          </Link>
          <Link to="/authors" className="btn btn--outline">
            Срещни автори
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>За нас</h2>
          <p>
            БГПиеса събира културната памет на театъра – от класическите текстове
            до съвременните сцени.
          </p>
        </div>
        <div className="section__content section__content--split">
          <p>
            Екипът ни работи за свободен достъп до българския театрален архив,
            като комбинира дигитална библиотека, визуална колекция и инструменти
            за управление на съдържание. Проектът обединява драматурзи, режисьори,
            изследователи и любители в обща мрежа.
          </p>
          <div>
            <p>Открий:</p>
            <ul>
              <li>биографии на емблематични автори</li>
              <li>селекция от театрални текстове</li>
              <li>галерии със сценични фотографии</li>
            </ul>
            <Link to="/about" className="btn btn--ghost">
              Научи повече
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Подбрани автори</h2>
          <Link to="/authors" className="link">
            Всички автори →
          </Link>
        </div>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <div className="grid">
            {authors.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Популярни пиеси</h2>
          <Link to="/plays" className="link">
            Всички пиеси →
          </Link>
        </div>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <div className="grid grid--compact grid--three">
            {plays.map((play) => (
              <PlayCard key={play.id} play={play} />
            ))}
          </div>
        )}
      </section>

      <section className="section section--gallery">
        <div className="section__header">
          <h2>Сцени и снимки</h2>
          <p>Визуални вдъхновения от българския театър</p>
        </div>
        <div className="gallery__grid">
          {galleryImages.map((item) => (
            <figure key={item.url}>
              <img src={item.url} alt={item.caption} />
              <figcaption>{item.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home

