import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import ImageGallery from '../components/ImageGallery'
import Loader from '../components/Loader'
import { api, API_BASE } from '../services/api'
import type { PlayDetail } from '../types'

const PlayDetails = () => {
  const { id } = useParams()
  const [play, setPlay] = useState<PlayDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const data = await api.getPlay(id)
        setPlay(data)
      } catch {
        setError('Пиесата не може да бъде заредена.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return <Loader />
  }

  if (error || !play) {
    return <ErrorMessage message={error ?? 'Пиесата не е намерена.'} />
  }

  const images =
    play.images?.map((img) =>
      img.image_url.startsWith('http') ? img.image_url : `${API_BASE}${img.image_url}`
    ) ?? []

  return (
    <div className="page page--narrow">
      <section className="section">
        <p className="eyebrow">Пиеса</p>
        <h1>{play.title}</h1>
        <div className="meta">
          <span>
            Автор:{' '}
            {play.author ? (
              <Link to={`/authors/${play.author.id}`}>{play.author.name}</Link>
            ) : (
              'Неизвестен'
            )}
          </span>
          {play.year && <span>Година: {play.year}</span>}
          {play.genre && <span>Жанр: {play.genre}</span>}
        </div>
        <p>{play.description}</p>

        <div className="actions">
          {play.pdf_path ? (
            <a
              className="btn"
              href={api.downloadPdfUrl(play.id)}
              target="_blank"
              rel="noreferrer"
            >
              Свали PDF сценарий
            </a>
          ) : (
            <p className="muted">Няма качен сценарий.</p>
          )}
        </div>
      </section>
      <section className="section">
        <h2>Галерия</h2>
        <ImageGallery images={images} />
      </section>
    </div>
  )
}

export default PlayDetails

