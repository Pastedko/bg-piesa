import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Author } from '../types'
import { getLocalized } from '../types'
import { API_BASE } from '../services/api'

type Props = {
  author: Author
}

const AuthorCard = ({ author }: Props) => {
  const { t, i18n } = useTranslation()
  const bio = getLocalized(author.biography_bg, author.biography_en, i18n.language)

  const src = author.photo_url
    ? author.photo_url.startsWith('http')
      ? author.photo_url
      : `${API_BASE}${author.photo_url}`
    : 'https://images.unsplash.com/photo-1478720568477-152d9b164e26'

  return (
    <article className="card">
      <div className="card__media">
        <img src={src} alt={author.name} />
      </div>
      <div className="card__body">
        <h3>{author.name}</h3>
        <p>{bio.slice(0, 120)}...</p>
        <Link to={`/authors/${author.id}`} className="btn btn--ghost">
          {t('authors.viewDetails')}
        </Link>
      </div>
    </article>
  )
}

export default AuthorCard
