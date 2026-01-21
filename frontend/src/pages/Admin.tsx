import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import { useAdmin } from '../context/AdminContext'
import { api } from '../services/api'
import type { Author, Play } from '../types'

type AuthorFormState = {
  name: string
  biography: string
  photo_url: string
}

type PlayFormState = {
  title: string
  description: string
  year: string
  genre: string
  theme: string
  duration: string
  male_participants: string
  female_participants: string
  author_id: string
  imageUrls: string
}

const initialAuthorForm: AuthorFormState = {
  name: '',
  biography: '',
  photo_url: '',
}

const initialPlayForm: PlayFormState = {
  title: '',
  description: '',
  year: '',
  genre: '',
  theme: '',
  duration: '',
  male_participants: '',
  female_participants: '',
  author_id: '',
  imageUrls: '',
}

const Admin = () => {
  const { isAuthenticated, login, logout, token } = useAdmin()
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'authors' | 'plays'>('authors')
  const [authors, setAuthors] = useState<Author[]>([])
  const [plays, setPlays] = useState<Play[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [authorForm, setAuthorForm] = useState<AuthorFormState>(initialAuthorForm)
  const [authorPhotoFile, setAuthorPhotoFile] = useState<File | null>(null)
  const [editingAuthorId, setEditingAuthorId] = useState<number | null>(null)

  const [playForm, setPlayForm] = useState<PlayFormState>(initialPlayForm)
  const [playPdfFile, setPlayPdfFile] = useState<File | null>(null)
  const [playImageFiles, setPlayImageFiles] = useState<FileList | null>(null)
  const [editingPlayId, setEditingPlayId] = useState<number | null>(null)

  const refreshData = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const [authorsData, playsData] = await Promise.all([
        api.getAuthors(),
        api.getPlays(),
      ])
      setAuthors(authorsData)
      setPlays(playsData)
    } catch {
      setError('Неуспешно зареждане на данни от сървъра.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      refreshData()
    }
  }, [isAuthenticated])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const response = await api.login(password)
      login(response.access_token)
      setPassword('')
      setLoginError(null)
    } catch {
      setLoginError('Невалидна парола. Опитайте отново.')
    }
  }

  const handleAuthorSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    try {
      const payload = {
        name: authorForm.name,
        biography: authorForm.biography,
        photo_url: authorForm.photo_url || undefined,
      }
      const result = editingAuthorId
        ? await api.updateAuthor(editingAuthorId, payload, token)
        : await api.createAuthor(payload, token)

      if (authorPhotoFile) {
        await api.uploadAuthorPhoto(result.id, authorPhotoFile, token)
      }

      setAuthorForm(initialAuthorForm)
      setAuthorPhotoFile(null)
      setEditingAuthorId(null)
      refreshData()
    } catch {
      setError('Възникна грешка при запазване на автора.')
    }
  }

  const handleAuthorEdit = (author: Author) => {
    setEditingAuthorId(author.id)
    setAuthorForm({
      name: author.name,
      biography: author.biography,
      photo_url: author.photo_url ?? '',
    })
  }

  const handleAuthorDelete = async (id: number) => {
    if (!token) return
    if (!confirm('Сигурни ли сте, че искате да изтриете автора?')) return
    try {
      await api.deleteAuthor(id, token)
      refreshData()
    } catch (err) {
      setError(
        'Авторът не може да бъде изтрит. Уверете се, че няма свързани пиеси.'
      )
    }
  }

  const handlePlaySubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    const image_urls = playForm.imageUrls
      ? playForm.imageUrls.split('\n').map((url) => url.trim()).filter(Boolean)
      : undefined
    const payload = {
      title: playForm.title,
      description: playForm.description,
      genre: playForm.genre || undefined,
      theme: playForm.theme || undefined,
      year: playForm.year ? Number(playForm.year) : undefined,
      duration: playForm.duration ? Number(playForm.duration) : undefined,
      male_participants: playForm.male_participants ? Number(playForm.male_participants) : undefined,
      female_participants: playForm.female_participants ? Number(playForm.female_participants) : undefined,
      author_id: Number(playForm.author_id),
      image_urls,
    }
    try {
      const result = editingPlayId
        ? await api.updatePlay(editingPlayId, payload, token)
        : await api.createPlay(payload, token)

      if (playPdfFile) {
        await api.uploadPlayPdf(result.id, playPdfFile, token)
      }
      if (playImageFiles && playImageFiles.length > 0) {
        await api.uploadPlayImages(
          result.id,
          Array.from(playImageFiles),
          token
        )
      }

      setPlayForm(initialPlayForm)
      setPlayPdfFile(null)
      setPlayImageFiles(null)
      setEditingPlayId(null)
      refreshData()
    } catch {
      setError('Възникна грешка при запазване на пиесата.')
    }
  }

  const handlePlayEdit = (play: Play) => {
    setEditingPlayId(play.id)
    setPlayForm({
      title: play.title,
      description: play.description,
      genre: play.genre ?? '',
      theme: play.theme ?? '',
      year: play.year ? String(play.year) : '',
      duration: play.duration ? String(play.duration) : '',
      male_participants: play.male_participants ? String(play.male_participants) : '',
      female_participants: play.female_participants ? String(play.female_participants) : '',
      author_id: String(play.author_id),
      imageUrls: play.images?.map((img) => img.image_url).join('\n') ?? '',
    })
  }

  const handlePlayDelete = async (id: number) => {
    if (!token) return
    if (!confirm('Искате ли да изтриете тази пиеса?')) return
    try {
      await api.deletePlay(id, token)
      refreshData()
    } catch {
      setError('Пиесата не може да бъде изтрита в момента.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="page page--narrow">
        <section className="section">
          <h1>Администраторски вход</h1>
          <form className="form" onSubmit={handleLogin}>
            <label>
              Парола
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {loginError && <ErrorMessage message={loginError} />}
            <button type="submit" className="btn">
              Вход
            </button>
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <section className="section">
        <div className="section__header">
          <h1>Админ панел</h1>
          <div className="section__actions">
            <button className="btn btn--ghost" onClick={logout}>
              Изход
            </button>
          </div>
        </div>
        <div className="tabs">
          <button
            className={activeTab === 'authors' ? 'tab tab--active' : 'tab'}
            onClick={() => setActiveTab('authors')}
          >
            Управление на автори
          </button>
          <button
            className={activeTab === 'plays' ? 'tab tab--active' : 'tab'}
            onClick={() => setActiveTab('plays')}
          >
            Управление на пиеси
          </button>
        </div>
        {error && <ErrorMessage message={error} />}
        {loading ? (
          <Loader />
        ) : activeTab === 'authors' ? (
          <div className="admin-grid">
            <form className="form" onSubmit={handleAuthorSubmit}>
              <h2>{editingAuthorId ? 'Редакция на автор' : 'Нов автор'}</h2>
              <label>
                Име
                <input
                  value={authorForm.name}
                  onChange={(event) =>
                    setAuthorForm({ ...authorForm, name: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Биография
                <textarea
                  value={authorForm.biography}
                  onChange={(event) =>
                    setAuthorForm({
                      ...authorForm,
                      biography: event.target.value,
                    })
                  }
                  rows={5}
                  required
                />
              </label>
              <label>
                Снимка (URL)
                <input
                  value={authorForm.photo_url}
                  onChange={(event) =>
                    setAuthorForm({
                      ...authorForm,
                      photo_url: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Или качи снимка
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setAuthorPhotoFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              <button className="btn" type="submit">
                {editingAuthorId ? 'Запази промените' : 'Създай автор'}
              </button>
            </form>
            <div className="list list--admin">
              <h3>Съществуващи автори</h3>
              {authors.map((author) => (
                <div key={author.id} className="list__item">
                  <div>
                    <strong>{author.name}</strong>
                    <p>{author.biography.slice(0, 100)}...</p>
                  </div>
                  <div className="list__actions">
                    <button
                      className="btn btn--ghost"
                      onClick={() => handleAuthorEdit(author)}
                    >
                      Редактирай
                    </button>
                    <button
                      className="btn btn--danger"
                      onClick={() => handleAuthorDelete(author.id)}
                    >
                      Изтрий
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="admin-grid">
            <form className="form" onSubmit={handlePlaySubmit}>
              <h2>{editingPlayId ? 'Редакция на пиеса' : 'Нова пиеса'}</h2>
              <label>
                Заглавие
                <input
                  value={playForm.title}
                  onChange={(event) =>
                    setPlayForm({ ...playForm, title: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Описание
                <textarea
                  value={playForm.description}
                  onChange={(event) =>
                    setPlayForm({
                      ...playForm,
                      description: event.target.value,
                    })
                  }
                  rows={5}
                  required
                />
              </label>
              <label>
                Автор
                <select
                  value={playForm.author_id}
                  onChange={(event) =>
                    setPlayForm({ ...playForm, author_id: event.target.value })
                  }
                  required
                >
                  <option value="">Избери автор...</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form__inline">
                <label>
                  Година
                  <input
                    value={playForm.year}
                    onChange={(event) =>
                      setPlayForm({ ...playForm, year: event.target.value })
                    }
                    type="number"
                  />
                </label>
                <label>
                  Жанр
                  <input
                    value={playForm.genre}
                    onChange={(event) =>
                      setPlayForm({ ...playForm, genre: event.target.value })
                    }
                  />
                </label>
                <label>
                  Тема
                  <input
                    value={playForm.theme}
                    onChange={(event) =>
                      setPlayForm({ ...playForm, theme: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form__inline">
                <label>
                  Продължителност (минути)
                  <input
                    value={playForm.duration}
                    onChange={(event) =>
                      setPlayForm({ ...playForm, duration: event.target.value })
                    }
                    type="number"
                    min="0"
                  />
                </label>
                <label>
                  Мъже участници
                  <input
                    value={playForm.male_participants}
                    onChange={(event) =>
                      setPlayForm({ ...playForm, male_participants: event.target.value })
                    }
                    type="number"
                    min="0"
                  />
                </label>
                <label>
                  Жени участници
                  <input
                    value={playForm.female_participants}
                    onChange={(event) =>
                      setPlayForm({ ...playForm, female_participants: event.target.value })
                    }
                    type="number"
                    min="0"
                  />
                </label>
              </div>
              <label>
                Изображения (URL, по едно на ред)
                <textarea
                  value={playForm.imageUrls}
                  onChange={(event) =>
                    setPlayForm({ ...playForm, imageUrls: event.target.value })
                  }
                  rows={4}
                />
              </label>
              <label>
                Качи PDF сценарий
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) =>
                    setPlayPdfFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              <label>
                Качи изображения
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setPlayImageFiles(event.target.files)}
                />
              </label>
              <button className="btn" type="submit">
                {editingPlayId ? 'Запази промените' : 'Създай пиеса'}
              </button>
            </form>
            <div className="list list--admin">
              <h3>Съществуващи пиеси</h3>
              {plays.map((play) => (
                <div key={play.id} className="list__item">
                  <div>
                    <strong>{play.title}</strong>
                    <p>{play.description.slice(0, 100)}...</p>
                  </div>
                  <div className="list__actions">
                    <button
                      className="btn btn--ghost"
                      onClick={() => handlePlayEdit(play)}
                    >
                      Редактирай
                    </button>
                    <button
                      className="btn btn--danger"
                      onClick={() => handlePlayDelete(play.id)}
                    >
                      Изтрий
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default Admin

