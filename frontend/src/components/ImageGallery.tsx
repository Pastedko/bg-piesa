import { useState } from 'react'

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi

function linkifyText(text: string) {
  const parts = text.split(URL_REGEX)
  return parts.map((part, i) => {
    const isUrl = part.match(/^https?:\/\//) || part.match(/^www\./i)
    if (isUrl) {
      const href = part.startsWith('http') ? part : `https://${part}`
      return (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="lightbox__caption-link">
          {part}
        </a>
      )
    }
    return part
  })
}

export type ImageWithCaption = {
  url: string
  caption: string
}

type Props = {
  images: ImageWithCaption[]
  title?: string
  emptyMessage?: string
}

const ImageGallery = ({ images, title, emptyMessage }: Props) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!images.length) {
    return (
      <section className="gallery">
        {title && <h4>{title}</h4>}
        <div className="gallery__empty">
          {emptyMessage ?? 'Няма качени изображения за момента.'}
        </div>
      </section>
    )
  }

  const openLightbox = (idx: number) => setLightboxIndex(idx)
  const closeLightbox = () => setLightboxIndex(null)
  const goPrev = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length))
  const goNext = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length))

  const current = lightboxIndex !== null ? images[lightboxIndex] : null

  return (
    <section className="gallery">
      {title && <h4>{title}</h4>}
      <div className="gallery__grid gallery__grid--clickable">
        {images.map((item, idx) => (
          <figure
            key={item.url + idx}
            className="gallery__item"
            onClick={() => openLightbox(idx)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openLightbox(idx)
              }
            }}
          >
            <img src={item.url} alt={item.caption || `Gallery ${idx + 1}`} loading="lazy" />
          </figure>
        ))}
      </div>

      {lightboxIndex !== null && current && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={(e) => e.target === e.currentTarget && closeLightbox()}
        >
          <button
            type="button"
            className="lightbox__close"
            onClick={closeLightbox}
            aria-label="Close"
          >
            ×
          </button>
          <div
            className="lightbox__content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox__image-wrap">
              <img src={current.url} alt={current.caption || 'Gallery image'} />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="lightbox__nav lightbox__nav--prev"
                    onClick={goPrev}
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="lightbox__nav lightbox__nav--next"
                    onClick={goNext}
                    aria-label="Next"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            <div className="lightbox__sidebar">
              {current.caption ? (
                <p className="lightbox__caption">{linkifyText(current.caption)}</p>
              ) : (
                <p className="lightbox__caption lightbox__caption--muted">
                  —
                </p>
              )}
              {images.length > 1 && (
                <span className="lightbox__counter">
                  {lightboxIndex + 1} / {images.length}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default ImageGallery
