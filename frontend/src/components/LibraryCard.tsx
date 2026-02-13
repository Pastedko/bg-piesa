import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { LiteraryPiece } from '../types'
import { getLocalized } from '../types'

type Props = {
  piece: LiteraryPiece
}

const LibraryCard = ({ piece }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const title = getLocalized(piece.title_bg, piece.title_en, lang)
  const description = getLocalized(piece.description_bg, piece.description_en, lang)

  return (
    <article className="card card--compact">
      <div className="card__body">
        <h3>{title}</h3>
        <p className="card__meta">
          {t('library.author')}{' '}
          {piece.author ? (
            <Link to={`/authors/${piece.author.id}`}>{piece.author.name}</Link>
          ) : (
            t('plays.unknown')
          )}
        </p>
        {piece.play && (
          <p className="card__meta">
            {t('library.play')}{' '}
            <Link to={`/plays/${piece.play.id}`}>
              {getLocalized(piece.play.title_bg, piece.play.title_en, lang)}
            </Link>
          </p>
        )}
        <p>{description.slice(0, 140)}...</p>
        <div className="card__actions">
          <Link to={`/library/${piece.id}`} className="btn btn--ghost">
            {t('plays.details')}
          </Link>
        </div>
      </div>
    </article>
  )
}

export default LibraryCard
