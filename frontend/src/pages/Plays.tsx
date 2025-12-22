import { useEffect, useMemo, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import PlayCard from '../components/PlayCard'
import SearchBar from '../components/SearchBar'
import { api } from '../services/api'
import type { Play } from '../types'

const Plays = () => {
  const [plays, setPlays] = useState<Play[]>([])
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getPlays()
        setPlays(data)
      } catch {
        setError('Неуспешно зареждане на пиеси.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const genres = useMemo(() => {
    const set = new Set<string>()
    plays.forEach((play) => {
      if (play.genre) {
        set.add(play.genre)
      }
    })
    return Array.from(set).sort()
  }, [plays])

  const filteredPlays = useMemo(
    () =>
      plays.filter((play) => {
        const matchesTitle = play.title
          .toLowerCase()
          .includes(search.toLowerCase())
        const matchesGenre =
          selectedGenre === 'all' || play.genre === selectedGenre
        return matchesTitle && matchesGenre
      }),
    [plays, search, selectedGenre]
  )

  return (
    <div className="page">
      <section className="section">
        <div className="section__header">
          <div>
            <p className="eyebrow">Дигитална библиотека</p>
            <h1>Пиеси</h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <SearchBar
              label="Търсене на пиеса"
              value={search}
              onChange={setSearch}
              placeholder="Въведи заглавие..."
            />
            <div className="search-bar">
              <label htmlFor="genre-filter">Жанр</label>
              <select
                id="genre-filter"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                <option value="all">Всички жанрове</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <>
            <div className="grid grid--compact grid--three">
              {filteredPlays.map((play) => (
                <PlayCard key={play.id} play={play} />
              ))}
            </div>
            {!filteredPlays.length && (
              <p className="muted">Няма резултат по зададените критерии.</p>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default Plays

