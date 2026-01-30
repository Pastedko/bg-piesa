import { Link } from 'react-router-dom'
import type { Play } from '../types'

type Props = {
  play: Play
}

const PlayCard = ({ play }: Props) => (
  <article className="card card--compact">
    <div className="card__body">
      <h3>{play.title}</h3>
      <p className="card__meta">
        Автор:{' '}
        {play.author ? (
          <Link to={`/authors/${play.author.id}`}>{play.author.name}</Link>
        ) : (
          'Неизвестен'
        )}
      </p>
      <p className="card__meta">
        {play.male_participants ?? 0}м. {play.female_participants ?? 0}ж.
      </p>
      <p>{play.description.slice(0, 140)}...</p>
      <div className="card__actions">
        <Link to={`/plays/${play.id}`} className="btn btn--ghost">
          Детайли
        </Link>
      </div>
    </div>
  </article>
)

export default PlayCard

