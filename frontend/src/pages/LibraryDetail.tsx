import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import { api } from '../services/api'
import type { LiteraryPiece } from '../types'
import { getLocalized } from '../types'

const LibraryDetail = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { id } = useParams()
  const [piece, setPiece] = useState<LiteraryPiece | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const data = await api.getLiteraryPiece(id)
        setPiece(data)
      } catch {
        setError(t('library.loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, t])

  if (loading) return <Loader />
  if (error || !piece) {
    return <ErrorMessage message={error ?? t('library.notFound')} />
  }

  const title = getLocalized(piece.title_bg, piece.title_en, lang)
  const description = getLocalized(piece.description_bg, piece.description_en, lang)

  return (
    <div className="page page--narrow">
      <section className="section">
        <p className="eyebrow">{t('library.eyebrow')}</p>
        <h1>{title}</h1>
        <div className="meta">
          <span>
            {t('library.author')}{' '}
            {piece.author ? (
              <Link to={`/authors/${piece.author.id}`}>{piece.author.name}</Link>
            ) : (
              t('plays.unknown')
            )}
          </span>
          {piece.play && (
            <span>
              {t('library.play')}{' '}
              <Link to={`/plays/${piece.play.id}`}>
                {getLocalized(piece.play.title_bg, piece.play.title_en, lang)}
              </Link>
            </span>
          )}
        </div>
        <p>{description}</p>
        <div className="actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {piece.pdf_path ? (
            <button
              type="button"
              className="btn"
              onClick={() =>
                window.open(api.viewLiteraryPiecePdfUrl(piece.id), '_blank', 'noopener,noreferrer')
              }
            >
              {t('library.viewPdf')}
            </button>
          ) : (
            <p className="muted">{t('library.noPdf')}</p>
          )}
          <Link
            to={piece.play ? `/library?play=${piece.play.id}` : '/library'}
            className="btn btn--ghost"
          >
            ← {t('library.backToList')}
          </Link>
        </div>
      </section>
    </div>
  )
}

export default LibraryDetail
