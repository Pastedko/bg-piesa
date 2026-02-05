import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import PlayCard from '../components/PlayCard'
import SearchBar from '../components/SearchBar'
import { api } from '../services/api'
import type { Play } from '../types'

const Plays = () => {
  const { t } = useTranslation()
  const [plays, setPlays] = useState<Play[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI filter states (what user is selecting)
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [selectedTheme, setSelectedTheme] = useState<string>('all')
  const [yearMin, setYearMin] = useState<number | ''>('')
  const [yearMax, setYearMax] = useState<number | ''>('')
  const [maleParticipantsMin, setMaleParticipantsMin] = useState<number>(0)
  const [maleParticipantsMax, setMaleParticipantsMax] = useState<number>(20)
  const [femaleParticipantsMin, setFemaleParticipantsMin] = useState<number>(0)
  const [femaleParticipantsMax, setFemaleParticipantsMax] = useState<number>(20)

  // Applied filter states (what's actually being used to filter)
  const [appliedGenre, setAppliedGenre] = useState<string>('all')
  const [appliedTheme, setAppliedTheme] = useState<string>('all')
  const [appliedYearMin, setAppliedYearMin] = useState<number | ''>('')
  const [appliedYearMax, setAppliedYearMax] = useState<number | ''>('')
  const [appliedMaleParticipantsMin, setAppliedMaleParticipantsMin] = useState<number>(0)
  const [appliedMaleParticipantsMax, setAppliedMaleParticipantsMax] = useState<number>(20)
  const [appliedFemaleParticipantsMin, setAppliedFemaleParticipantsMin] = useState<number>(0)
  const [appliedFemaleParticipantsMax, setAppliedFemaleParticipantsMax] = useState<number>(20)

  // Collapsible filter states
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({
    cast: false,
    year: false,
    genre: false,
    theme: false,
  })

  const toggleFilter = (filterKey: string) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }))
  }

  // Load all plays for filter options
  const [allPlays, setAllPlays] = useState<Play[]>([])

  useEffect(() => {
    const loadAll = async () => {
      try {
        const data = await api.getPlays()
        setAllPlays(data)
        // Also load initial plays
        setPlays(data)
        setLoading(false)
      } catch {
        // Ignore errors
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  // Clear filters function
  const clearFilters = async () => {
    setSelectedGenre('all')
    setSelectedTheme('all')
    setYearMin('')
    setYearMax('')
    setMaleParticipantsMin(0)
    setMaleParticipantsMax(20)
    setFemaleParticipantsMin(0)
    setFemaleParticipantsMax(20)
    
    setAppliedGenre('all')
    setAppliedTheme('all')
    setAppliedYearMin('')
    setAppliedYearMax('')
    setAppliedMaleParticipantsMin(0)
    setAppliedMaleParticipantsMax(20)
    setAppliedFemaleParticipantsMin(0)
    setAppliedFemaleParticipantsMax(20)

    // Reload all plays
    setLoading(true)
    try {
      const data = await api.getPlays({ search })
      setPlays(data)
      setError(null)
    } catch {
      setError(t('plays.loadError'))
    } finally {
      setLoading(false)
    }
  }

  // Calculate available filter options from all plays
  const genres = useMemo(() => {
    const set = new Set<string>()
    allPlays.forEach((play) => {
      if (play.genre) {
        set.add(play.genre)
      }
    })
    return Array.from(set).sort()
  }, [allPlays])

  const themes = useMemo(() => {
    const set = new Set<string>()
    allPlays.forEach((play) => {
      if (play.theme) {
        set.add(play.theme)
      }
    })
    return Array.from(set).sort()
  }, [allPlays])

  const years = useMemo(() => {
    const yearsList = allPlays
      .map((play) => play.year)
      .filter((year): year is number => year !== null && year !== undefined)
      .sort((a, b) => a - b)
    return yearsList.length > 0
      ? { min: yearsList[0], max: yearsList[yearsList.length - 1] }
      : { min: 1900, max: new Date().getFullYear() }
  }, [allPlays])

  const participantsRange = useMemo(() => {
    const allMale = allPlays
      .map((play) => play.male_participants)
      .filter((p): p is number => p !== null && p !== undefined)
    const allFemale = allPlays
      .map((play) => play.female_participants)
      .filter((p): p is number => p !== null && p !== undefined)
    const maxMale = allMale.length > 0 ? Math.max(...allMale) : 20
    const maxFemale = allFemale.length > 0 ? Math.max(...allFemale) : 20
    return { maxMale, maxFemale }
  }, [allPlays])

  // Apply filters function
  const applyFilters = async () => {
    setLoading(true)
    try {
      const filters: Parameters<typeof api.getPlays>[0] = {}
      if (search) filters.search = search
      if (selectedGenre !== 'all') filters.genre = selectedGenre
      if (selectedTheme !== 'all') filters.theme = selectedTheme
      if (yearMin !== '') filters.yearMin = Number(yearMin)
      if (yearMax !== '') filters.yearMax = Number(yearMax)
      if (maleParticipantsMin > 0) filters.maleParticipantsMin = maleParticipantsMin
      if (maleParticipantsMax < (participantsRange.maxMale || 20))
        filters.maleParticipantsMax = maleParticipantsMax
      if (femaleParticipantsMin > 0) filters.femaleParticipantsMin = femaleParticipantsMin
      if (femaleParticipantsMax < (participantsRange.maxFemale || 20))
        filters.femaleParticipantsMax = femaleParticipantsMax

      const data = await api.getPlays(filters)
      setPlays(data)
      setError(null)

      // Update applied filters
      setAppliedGenre(selectedGenre)
      setAppliedTheme(selectedTheme)
      setAppliedYearMin(yearMin)
      setAppliedYearMax(yearMax)
      setAppliedMaleParticipantsMin(maleParticipantsMin)
      setAppliedMaleParticipantsMax(maleParticipantsMax)
      setAppliedFemaleParticipantsMin(femaleParticipantsMin)
      setAppliedFemaleParticipantsMax(femaleParticipantsMax)
    } catch {
      setError(t('plays.loadError'))
    } finally {
      setLoading(false)
    }
  }

  // Load plays on initial mount and when search changes
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const filters: Parameters<typeof api.getPlays>[0] = {}
        if (search) filters.search = search
        if (appliedGenre !== 'all') filters.genre = appliedGenre
        if (appliedTheme !== 'all') filters.theme = appliedTheme
        if (appliedYearMin !== '') filters.yearMin = Number(appliedYearMin)
        if (appliedYearMax !== '') filters.yearMax = Number(appliedYearMax)
        if (appliedMaleParticipantsMin > 0) filters.maleParticipantsMin = appliedMaleParticipantsMin
        if (appliedMaleParticipantsMax < (participantsRange.maxMale || 20))
          filters.maleParticipantsMax = appliedMaleParticipantsMax
        if (appliedFemaleParticipantsMin > 0) filters.femaleParticipantsMin = appliedFemaleParticipantsMin
        if (appliedFemaleParticipantsMax < (participantsRange.maxFemale || 20))
          filters.femaleParticipantsMax = appliedFemaleParticipantsMax

        const data = await api.getPlays(filters)
        setPlays(data)
        setError(null)
      } catch {
        setError(t('plays.loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [search, appliedGenre, appliedTheme, appliedYearMin, appliedYearMax, appliedMaleParticipantsMin, appliedMaleParticipantsMax, appliedFemaleParticipantsMin, appliedFemaleParticipantsMax, participantsRange, t])

  // Update max values when data loads
  useEffect(() => {
    if (participantsRange.maxMale > 0 && maleParticipantsMax === 20) {
      setMaleParticipantsMax(participantsRange.maxMale)
    }
    if (participantsRange.maxFemale > 0 && femaleParticipantsMax === 20) {
      setFemaleParticipantsMax(participantsRange.maxFemale)
    }
  }, [participantsRange, maleParticipantsMax, femaleParticipantsMax])

  // Plays are already filtered by the API
  const filteredPlays = plays

  return (
    <div className="page">
      <section className="section">
        <div className="section__header">
          <div>
            <p className="eyebrow">{t('plays.eyebrow')}</p>
            <h1>{t('plays.title')}</h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <SearchBar
              label={t('plays.searchLabel')}
              value={search}
              onChange={setSearch}
              placeholder={t('plays.searchPlaceholder')}
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
                <button
                  className="filter-label"
                  onClick={() => toggleFilter('genre')}
                  type="button"
                >
                  <span>{t('plays.genre')}</span>
                  <span className="filter-toggle">
                    {expandedFilters.genre ? '−' : '+'}
                  </span>
                </button>
                {expandedFilters.genre && (
                  <div className="filter-content">
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                    >
                      <option value="all">{t('plays.allGenres')}</option>
                      {genres.map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="filter-group">
                <button
                  className="filter-label"
                  onClick={() => toggleFilter('year')}
                  type="button"
                >
                  <span>{t('plays.year')}</span>
                  <span className="filter-toggle">
                    {expandedFilters.year ? '−' : '+'}
                  </span>
                </button>
                {expandedFilters.year && (
                  <div className="filter-content">
                    <div className="range-inputs">
                      <input
                        type="number"
                        placeholder={t('plays.from')}
                        value={yearMin}
                        onChange={(e) =>
                          setYearMin(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        min={years.min}
                        max={years.max}
                      />
                      <input
                        type="number"
                        placeholder={t('plays.to')}
                        value={yearMax}
                        onChange={(e) =>
                          setYearMax(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        min={years.min}
                        max={years.max}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="filter-group">
                <button
                  className="filter-label"
                  onClick={() => toggleFilter('cast')}
                  type="button"
                >
                  <span>{t('plays.cast')}</span>
                  <span className="filter-toggle">
                    {expandedFilters.cast ? '−' : '+'}
                  </span>
                </button>
                {expandedFilters.cast && (
                  <div className="filter-content">
                  <div className="slider-group">
                    <label>
                      Мъже:
                    </label>
                    <div className="range-values">
                      <input
                        type="number"
                        min="0"
                        max={participantsRange.maxMale || 20}
                        value={maleParticipantsMin}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(Number(e.target.value), maleParticipantsMax))
                          setMaleParticipantsMin(val)
                        }}
                        style={{ width: '60px' }}
                      />
                      <span>-</span>
                      <input
                        type="number"
                        min="0"
                        max={participantsRange.maxMale || 20}
                        value={maleParticipantsMax}
                        onChange={(e) => {
                          const val = Math.min(participantsRange.maxMale || 20, Math.max(Number(e.target.value), maleParticipantsMin))
                          setMaleParticipantsMax(val)
                        }}
                        style={{ width: '60px' }}
                      />
                    </div>
                  </div>
                  <div className="slider-group">
                    <label>
                      {t('plays.females')}
                    </label>
                    <div className="range-values">
                      <input
                        type="number"
                        min="0"
                        max={participantsRange.maxFemale || 20}
                        value={femaleParticipantsMin}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(Number(e.target.value), femaleParticipantsMax))
                          setFemaleParticipantsMin(val)
                        }}
                        style={{ width: '60px' }}
                      />
                      <span>-</span>
                      <input
                        type="number"
                        min="0"
                        max={participantsRange.maxFemale || 20}
                        value={femaleParticipantsMax}
                        onChange={(e) => {
                          const val = Math.min(participantsRange.maxFemale || 20, Math.max(Number(e.target.value), femaleParticipantsMin))
                          setFemaleParticipantsMax(val)
                        }}
                        style={{ width: '60px' }}
                      />
                    </div>
                  </div>
                  </div>
                )}
              </div>
              <div className="filter-group">
                <button
                  className="filter-label"
                  onClick={() => toggleFilter('theme')}
                  type="button"
                >
                  <span>{t('plays.theme')}</span>
                  <span className="filter-toggle">
                    {expandedFilters.theme ? '−' : '+'}
                  </span>
                </button>
                {expandedFilters.theme && (
                  <div className="filter-content">
                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                    >
                      <option value="all">Всички теми</option>
                      {themes.map((theme) => (
                        <option key={theme} value={theme}>
                          {theme}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </aside>
            <div className="plays-content">
              <div className="grid grid--compact grid--three">
                {filteredPlays.map((play) => (
                  <PlayCard key={play.id} play={play} />
                ))}
              </div>
              {!filteredPlays.length && (
                <p className="muted">{t('plays.noResults')}</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default Plays
