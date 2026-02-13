import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import ImageGallery from '../components/ImageGallery'
import Loader from '../components/Loader'
import { api, API_BASE } from '../services/api'
import type { PlayDetail } from '../types'
import { getLocalized } from '../types'

const PlayDetails = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { id } = useParams()
  const [play, setPlay] = useState<PlayDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCopyrightModal, setShowCopyrightModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const data = await api.getPlay(id)
        setPlay(data)
      } catch {
        setError(t('playDetail.loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, t])

  if (loading) {
    return <Loader />
  }

  if (error || !play) {
    return <ErrorMessage message={error ?? t('playDetail.notFound')} />
  }

  const title = getLocalized(play.title_bg, play.title_en, lang)
  const description = getLocalized(play.description_bg, play.description_en, lang)

  const galleryImages =
    play.images?.map((img) => ({
      url: img.image_url.startsWith('http') ? img.image_url : `${API_BASE}${img.image_url}`,
      caption: getLocalized(img.caption_bg ?? null, img.caption_en ?? null, lang),
    })) ?? []

  return (
    <div className="page page--narrow">
      <section className="section">
        <p className="eyebrow">{t('playDetail.eyebrow')}</p>
        <h1>{title}</h1>
        <div className="meta">
          <span>
            {t('playDetail.author')}{' '}
            {play.author ? (
              <Link to={`/authors/${play.author.id}`}>{play.author.name}</Link>
            ) : (
              t('plays.unknown')
            )}
          </span>
          {play.year && <span>{t('playDetail.year')}: {play.year}</span>}
          {play.genre && <span>{t('playDetail.genre')}: {play.genre}</span>}
        </div>
        <p>{description}</p>

        <div className="actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to={`/library?author=${play.author_id}`} className="btn btn--ghost">
            {t('playDetail.literature')}
          </Link>
          {play.pdf_path ? (
            <>
              <button
                type="button"
                className="btn"
                onClick={() => setShowCopyrightModal(true)}
              >
                {t('playDetail.downloadPdf')}
              </button>
              {showCopyrightModal && (
                <div
                  className="modal-overlay"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="copyright-modal-title"
                  onClick={(e) => e.target === e.currentTarget && setShowCopyrightModal(false)}
                >
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <h3 id="copyright-modal-title">{t('playDetail.copyrightTitle')}</h3>
                    <p>{t('playDetail.copyrightText')}</p>
                    <div className="modal__actions">
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => setShowCopyrightModal(false)}
                      >
                        {t('playDetail.copyrightCancel')}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          window.open(api.downloadPdfUrl(play.id), '_blank', 'noopener,noreferrer')
                          setShowCopyrightModal(false)
                        }}
                      >
                        {t('playDetail.copyrightConfirm')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="muted">{t('playDetail.noPdf')}</p>
          )}
        </div>
      </section>
      <section className="section">
        <h2>{t('playDetail.gallery')}</h2>
        <ImageGallery images={galleryImages} emptyMessage={t('playDetail.galleryEmpty')} />
      </section>
      {(play.files ?? []).length > 0 && (
        <section className="section">
          <h2>{t('playDetail.files')}</h2>
          <ul className="file-list">
            {(play.files ?? []).map((f) => (
              <li key={f.id} className="file-list__item">
                <a
                  href={api.viewFileUrl(play.id, f.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-list__link"
                >
                  {f.file_url.split('/').pop()?.split('?')[0] ?? t('playDetail.downloadFile')}
                </a>
                {(f.caption_bg || f.caption_en) && (
                  <p className="file-list__caption muted">
                    {getLocalized(f.caption_bg ?? null, f.caption_en ?? null, lang)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default PlayDetails
