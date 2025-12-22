import { useEffect, useMemo, useState } from 'react'
import AuthorCard from '../components/AuthorCard'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import SearchBar from '../components/SearchBar'
import { api } from '../services/api'
import type { Author } from '../types'

const Authors = () => {
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
        setError('Неуспешно зареждане на автори.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
            <p className="eyebrow">Колекция от творци</p>
            <h1>Автори</h1>
          </div>
          <SearchBar
            label="Търсене на автор"
            value={search}
            onChange={setSearch}
            placeholder="Напиши име..."
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
              <p className="muted">Няма автори, които да отговарят на търсенето.</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default Authors

