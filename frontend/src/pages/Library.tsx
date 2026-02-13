import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import LibraryCard from '../components/LibraryCard'
import SearchBar from '../components/SearchBar'
import { api } from '../services/api'
import type { Author, LiteraryPiece, Play } from '../types'

const Library = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const authorIdFromUrl = searchParams.get('author')
  const [pieces, setPieces] = useState<LiteraryPiece[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initialAuthorFilter = authorIdFromUrl ?? 'all'
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>(initialAuthorFilter)
  const [selectedPlayId, setSelectedPlayId] = useState<string>('all')
  const [appliedAuthorId, setAppliedAuthorId] = useState<string>(initialAuthorFilter)
  const [appliedPlayId, setAppliedPlayId] = useState<string>('all')

  const [authors, setAuthors] = useState<Author[]>([])
  const [plays, setPlays] = useState<Play[]>([])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [authorsData, playsData] = await Promise.all([
          api.getAuthors(),
          api.getPlays(),
        ])
        setAuthors(authorsData)
        setPlays(playsData)
      } catch {
        // Ignore
      }
    }
    loadOptions()
  }, [])


  const loadPieces = async () => {
    setLoading(true)
    try {
      const filters: { search?: string; authorId?: string; playId?: number } = {}
      if (search) filters.search = search
      if (appliedAuthorId !== 'all') filters.authorId = appliedAuthorId
      if (appliedPlayId !== 'all') filters.playId = Number(appliedPlayId)
      const data = await api.getLibrary(filters)
      setPieces(data)
      setError(null)
    } catch {
      setError(t('library.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPieces()
  }, [search, appliedAuthorId, appliedPlayId])

  const applyFilters = () => {
    setAppliedAuthorId(selectedAuthorId)
    setAppliedPlayId(selectedPlayId)
  }

  const clearFilters = () => {
    setSelectedAuthorId('all')
    setSelectedPlayId('all')
    setAppliedAuthorId('all')
    setAppliedPlayId('all')
    setSearchParams({})
    setSearch('')
  }

  const playsForAuthor = useMemo(() => {
    if (selectedAuthorId === 'all') return plays
    return plays.filter((p) => p.author_id === Number(selectedAuthorId))
  }, [plays, selectedAuthorId])

  return (
    <div className="page">
      <section className="section">
        <div className="section__header">
          <div>
            <p className="eyebrow">{t('library.eyebrow')}</p>
            <h1>{t('library.title')}</h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <SearchBar
              label={t('library.searchLabel')}
              value={search}
              onChange={setSearch}
              placeholder={t('library.searchPlaceholder')}
            />
          </div>
        </div>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <div className="plays-layout">
            <aside className="filters-sidebar">
              <h3>{t('plays.filterBy')}</h3>
              <div className="filter-actions">
                <button
                  className="btn btn--filter"
                  onClick={applyFilters}
                  type="button"
                  disabled={loading}
                >
                  {loading ? t('common.loading') : t('plays.applyFilters')}
                </button>
                <button
                  className="btn btn--ghost btn--filter"
                  onClick={clearFilters}
                  type="button"
                  disabled={loading}
                >
                  {t('plays.clearFilters')}
                </button>
              </div>
              <div className="filter-group">
                <button className="filter-label" type="button">
                  <span>{t('library.author')}</span>
                </button>
                <div className="filter-content">
                  <select
                    value={selectedAuthorId}
                    onChange={(e) => {
                      setSelectedAuthorId(e.target.value)
                      setSelectedPlayId('all')
                    }}
                  >
                    <option value="all">{t('library.allAuthors')}</option>
                    {authors.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="filter-group">
                <button className="filter-label" type="button">
                  <span>{t('library.play')}</span>
                </button>
                <div className="filter-content">
                  <select
                    value={selectedPlayId}
                    onChange={(e) => setSelectedPlayId(e.target.value)}
                  >
                    <option value="all">{t('library.allPlays')}</option>
                    {playsForAuthor.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.title_bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </aside>
            <div className="plays-content">
              <div className="grid grid--compact grid--three">
                {pieces.map((piece) => (
                  <LibraryCard key={piece.id} piece={piece} />
                ))}
              </div>
              {!pieces.length && (
                <p className="muted">{t('library.noResults')}</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default Library
