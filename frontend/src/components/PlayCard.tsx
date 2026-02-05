import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Play } from '../types'
import { getLocalized } from '../types'

type Props = {
  play: Play
}

const PlayCard = ({ play }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const title = getLocalized(play.title_bg, play.title_en, lang)
  const description = getLocalized(play.description_bg, play.description_en, lang)

  return (
    <article className="card card--compact">
      <div className="card__body">
        <h3>{title}</h3>
        <p className="card__meta">
          {t('plays.author')}{' '}
          {play.author ? (
            <Link to={`/authors/${play.author.id}`}>{play.author.name}</Link>
          ) : (
            t('plays.unknown')
          )}
        </p>
        <p className="card__meta">
          {play.male_participants ?? 0}м. {play.female_participants ?? 0}ж.
        </p>
        <p>{description.slice(0, 140)}...</p>
        <div className="card__actions">
          <Link to={`/plays/${play.id}`} className="btn btn--ghost">
            {t('plays.details')}
          </Link>
        </div>
      </div>
    </article>
  )
}

export default PlayCard
