import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AuthorCard from '../components/AuthorCard'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import SearchBar from '../components/SearchBar'
import { api } from '../services/api'
import type { Author } from '../types'

const Authors = () => {
  const { t } = useTranslation()
  const [authors, setAuthors] = useState<Author[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAuthors()
        setAuthors(data)
      } catch {
        setError(t('authors.loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [t])

  const filteredAuthors = useMemo(() => {
    return authors.filter((author) =>
      author.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [authors, search])

  return (
    <div className="page">
      <section className="section">
        <div className="section__header">
          <div>
            <p className="eyebrow">{t('authors.eyebrow')}</p>
            <h1>{t('authors.title')}</h1>
          </div>
          <SearchBar
            label={t('authors.searchLabel')}
            value={search}
            onChange={setSearch}
            placeholder={t('authors.searchPlaceholder')}
          />
        </div>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <div className="grid grid--three">
            {filteredAuthors.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
            {!filteredAuthors.length && (
              <p className="muted">{t('authors.noResults')}</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default Authors
