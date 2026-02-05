import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import SearchBar from '../components/SearchBar'
import { api, API_BASE } from '../services/api'
import type { AuthorDetail } from '../types'
import { getLocalized } from '../types'

const AuthorDetails = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { id } = useParams()
  const [author, setAuthor] = useState<AuthorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playSearch, setPlaySearch] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const data = await api.getAuthor(id)
        setAuthor(data)
      } catch {
        setError(t('authorDetail.loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, t])

  const filteredPlays = useMemo(() => {
    if (!author) return []
    return author.plays.filter((play) => {
      const title = getLocalized(play.title_bg, play.title_en, lang)
      return title.toLowerCase().includes(playSearch.toLowerCase())
    })
  }, [author, playSearch, lang])

  if (loading) {
    return <Loader />
  }

  if (error || !author) {
    return <ErrorMessage message={error ?? t('authorDetail.notFound')} />
  }

  const biography = getLocalized(author.biography_bg, author.biography_en, lang)

  return (
    <div className="page page--narrow">
      <section className="section section--profile">
        <div className="profile__media">
          <img
            src={
              author.photo_url
                ? author.photo_url.startsWith('http')
                  ? author.photo_url
                  : `${API_BASE}${author.photo_url}`
                : 'https://images.unsplash.com/photo-1478720568477-152d9b164e26'
            }
            alt={author.name}
          />
        </div>
        <div className="profile__body">
          <p className="eyebrow">{t('authorDetail.eyebrow')}</p>
          <h1>{author.name}</h1>
          <p>{biography}</p>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>{t('authorDetail.playsTitle')}</h2>
          <SearchBar
            label={t('authorDetail.searchLabel')}
            value={playSearch}
            onChange={setPlaySearch}
            placeholder={t('authorDetail.searchPlaceholder')}
          />
        </div>
        {!filteredPlays.length && (
          <p className="muted">{t('authorDetail.noPlays')}</p>
        )}
        <div className="list list--plays">
          {filteredPlays.map((play) => {
            const title = getLocalized(play.title_bg, play.title_en, lang)
            const description = getLocalized(play.description_bg, play.description_en, lang)
            return (
              <article key={play.id} className="list__item">
                <div>
                  <h3>{title}</h3>
                  <p>{description.slice(0, 160)}...</p>
                </div>
                <Link to={`/plays/${play.id}`} className="btn btn--ghost">
                  {t('authorDetail.viewPlay')}
                </Link>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default AuthorDetails
