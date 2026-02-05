import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import AuthorCard from '../components/AuthorCard'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import PlayCard from '../components/PlayCard'
import { api } from '../services/api'
import type { Author, Play } from '../types'

const Home = () => {
  const { t } = useTranslation()
  const [authors, setAuthors] = useState<Author[]>([])
  const [plays, setPlays] = useState<Play[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const galleryImages = [
    { url: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef', captionKey: 'home.galleryCaption1' as const },
    { url: 'https://images.unsplash.com/photo-1485561671471-0afc94eba8dd', captionKey: 'home.galleryCaption2' as const },
    { url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26', captionKey: 'home.galleryCaption3' as const },
  ]

  useEffect(() => {
    const load = async () => {
      try {
        const [authorsResponse, playsResponse] = await Promise.all([
          api.getAuthors(),
          api.getPlays(),
        ])
        setAuthors(authorsResponse.slice(0, 3))
        setPlays(playsResponse.slice(0, 3))
      } catch {
        setError(t('home.loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [t])

  return (
    <div className="page">
      <section className="hero">
        <p className="hero__eyebrow">{t('home.heroEyebrow')}</p>
        <h1>{t('home.heroTitle')}</h1>
        <p className="hero__subtitle">{t('home.heroSubtitle')}</p>
        <div className="hero__actions">
          <Link to="/plays" className="btn">
            {t('home.viewPlays')}
          </Link>
          <Link to="/authors" className="btn btn--outline">
            {t('home.meetAuthors')}
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>{t('home.aboutTitle')}</h2>
        </div>
        <div className="section__content section__content--split">
          <div className="section__content-left">
            <p>{t('home.aboutIntro')}</p>
            <p>{t('home.aboutBody')}</p>
          </div>
          <div className="section__content-right">
            <p>{t('home.discover')}</p>
            <ul>
              <li>{t('home.discover1')}</li>
              <li>{t('home.discover2')}</li>
              <li>{t('home.discover3')}</li>
            </ul>
            <Link to="/about" className="btn btn--ghost">
              {t('home.learnMore')}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>{t('home.featuredAuthors')}</h2>
          <Link to="/authors" className="link">
            {t('home.allAuthors')} →
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
          <h2>{t('home.popularPlays')}</h2>
          <Link to="/plays" className="link">
            {t('home.allPlays')} →
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
          <h2>{t('home.galleryTitle')}</h2>
          <p>{t('home.gallerySubtitle')}</p>
        </div>
        <div className="gallery__grid">
          {galleryImages.map((item) => (
            <figure key={item.url}>
              <img src={item.url} alt={t(item.captionKey)} />
              <figcaption>{t(item.captionKey)}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
