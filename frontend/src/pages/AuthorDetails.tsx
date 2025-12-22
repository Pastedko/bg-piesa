import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import SearchBar from '../components/SearchBar'
import { api, API_BASE } from '../services/api'
import type { AuthorDetail } from '../types'

const AuthorDetails = () => {
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
        setError('Авторът не може да бъде зареден.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const filteredPlays = useMemo(() => {
    if (!author) return []
    return author.plays.filter((play) =>
      play.title.toLowerCase().includes(playSearch.toLowerCase())
    )
  }, [author, playSearch])

  if (loading) {
    return <Loader />
  }

  if (error || !author) {
    return <ErrorMessage message={error ?? 'Авторът не е намерен.'} />
  }

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
          <p className="eyebrow">Български автор</p>
          <h1>{author.name}</h1>
          <p>{author.biography}</p>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Пиеси от този автор</h2>
          <SearchBar
            label="Търсене на пиеса"
            value={playSearch}
            onChange={setPlaySearch}
            placeholder="Заглавие на пиеса..."
          />
        </div>
        {!filteredPlays.length && (
          <p className="muted">Няма пиеси, които да отговарят на търсенето.</p>
        )}
        <div className="list list--plays">
          {filteredPlays.map((play) => (
            <article key={play.id} className="list__item">
              <div>
                <h3>{play.title}</h3>
                <p>{play.description.slice(0, 160)}...</p>
              </div>
              <Link to={`/plays/${play.id}`} className="btn btn--ghost">
                Виж пиесата
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AuthorDetails

