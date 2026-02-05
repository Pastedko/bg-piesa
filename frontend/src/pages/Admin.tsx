import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import { useAdmin } from '../context/AdminContext'
import { api, API_BASE } from '../services/api'
import type { Author, Play, PlayDetail } from '../types'
import { getLocalized } from '../types'

type AuthorFormState = {
  name: string
  biography_bg: string
  biography_en: string
  photo_url: string
}

type PlayFormState = {
  title_bg: string
  title_en: string
  description_bg: string
  description_en: string
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
  biography_bg: '',
  biography_en: '',
  photo_url: '',
}

const initialPlayForm: PlayFormState = {
  title_bg: '',
  title_en: '',
  description_bg: '',
  description_en: '',
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
  const { t, i18n } = useTranslation()
  const lang = i18n.language
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
  const [playImageItems, setPlayImageItems] = useState<
    Array<{ file: File | null; caption_bg: string; caption_en: string }>
  >([])
  const [editingPlayId, setEditingPlayId] = useState<number | null>(null)
  const [editingPlayDetail, setEditingPlayDetail] = useState<PlayDetail | null>(null)
  const [existingImagesToDelete, setExistingImagesToDelete] = useState<number[]>([])
  const [existingImageCaptions, setExistingImageCaptions] = useState<
    Record<number, { caption_bg: string; caption_en: string }>
  >({})

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
      setError(t('admin.loadError'))
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
      setLoginError(t('admin.loginError'))
    }
  }

  const handleAuthorSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    try {
      const payload = {
        name: authorForm.name,
        biography_bg: authorForm.biography_bg,
        biography_en: authorForm.biography_en || undefined,
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
      setError(t('admin.saveAuthorError'))
    }
  }

  const handleAuthorEdit = (author: Author) => {
    setEditingAuthorId(author.id)
    setAuthorForm({
      name: author.name,
      biography_bg: author.biography_bg,
      biography_en: author.biography_en ?? '',
      photo_url: author.photo_url ?? '',
    })
  }

  const handleAuthorDelete = async (id: number) => {
    if (!token) return
    if (!confirm(t('admin.confirmDeleteAuthor'))) return
    try {
      await api.deleteAuthor(id, token)
      refreshData()
    } catch {
      setError(t('admin.deleteAuthorError'))
    }
  }

  const handlePlaySubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    const image_urls = playForm.imageUrls
      ? playForm.imageUrls.split('\n').map((url) => url.trim()).filter(Boolean)
      : undefined
    const payload: Parameters<typeof api.updatePlay>[1] = {
      title_bg: playForm.title_bg,
      title_en: playForm.title_en || undefined,
      description_bg: playForm.description_bg,
      description_en: playForm.description_en || undefined,
      genre: playForm.genre || undefined,
      theme: playForm.theme || undefined,
      year: playForm.year ? Number(playForm.year) : undefined,
      duration: playForm.duration ? Number(playForm.duration) : undefined,
      male_participants: playForm.male_participants ? Number(playForm.male_participants) : undefined,
      female_participants: playForm.female_participants ? Number(playForm.female_participants) : undefined,
      author_id: Number(playForm.author_id),
    }
    if (!editingPlayId && image_urls?.length) payload.image_urls = image_urls
    try {
      const result = editingPlayId
        ? await api.updatePlay(editingPlayId, payload, token)
        : await api.createPlay(payload, token)

      if (editingPlayId) {
        for (const imageId of existingImagesToDelete) {
          await api.deletePlayImage(result.id, imageId, token)
        }
        for (const img of editingPlayDetail?.images ?? []) {
          if (existingImagesToDelete.includes(img.id)) continue
          const current = existingImageCaptions[img.id]
          if (!current) continue
          const captionBg = current.caption_bg.trim() || undefined
          const captionEn = current.caption_en.trim() || undefined
          const origBg = (img.caption_bg ?? '').trim() || undefined
          const origEn = (img.caption_en ?? '').trim() || undefined
          if (captionBg !== origBg || captionEn !== origEn) {
            await api.updatePlayImageCaption(result.id, img.id, {
              caption_bg: captionBg,
              caption_en: captionEn,
            }, token)
          }
        }
      }
      if (playPdfFile) {
        await api.uploadPlayPdf(result.id, playPdfFile, token)
      }
      for (const item of playImageItems) {
        if (item.file) {
          await api.uploadPlayImage(result.id, item.file, token, {
            caption_bg: item.caption_bg.trim() || undefined,
            caption_en: item.caption_en.trim() || undefined,
          })
        }
      }

      setPlayForm(initialPlayForm)
      setPlayPdfFile(null)
      setPlayImageItems([])
      setEditingPlayId(null)
      setEditingPlayDetail(null)
      setExistingImagesToDelete([])
      setExistingImageCaptions({})
      refreshData()
    } catch {
      setError(t('admin.savePlayError'))
    }
  }

  const handlePlayEdit = async (play: Play) => {
    setEditingPlayId(play.id)
    setPlayImageItems([])
    setExistingImagesToDelete([])
    setEditingPlayDetail(null)
    try {
      const detail = await api.getPlay(String(play.id))
      setEditingPlayDetail(detail)
      const captions: Record<number, { caption_bg: string; caption_en: string }> = {}
      for (const img of detail.images ?? []) {
        captions[img.id] = {
          caption_bg: img.caption_bg ?? '',
          caption_en: img.caption_en ?? '',
        }
      }
      setExistingImageCaptions(captions)
      setPlayForm({
        title_bg: detail.title_bg,
        title_en: detail.title_en ?? '',
        description_bg: detail.description_bg,
        description_en: detail.description_en ?? '',
        genre: detail.genre ?? '',
        theme: detail.theme ?? '',
        year: detail.year ? String(detail.year) : '',
        duration: detail.duration ? String(detail.duration) : '',
        male_participants: detail.male_participants ? String(detail.male_participants) : '',
        female_participants: detail.female_participants ? String(detail.female_participants) : '',
        author_id: String(detail.author_id),
        imageUrls: detail.images?.map((img) => img.image_url).join('\n') ?? '',
      })
    } catch {
      setError(t('admin.loadError'))
    }
  }

  const handlePlayDelete = async (id: number) => {
    if (!token) return
    if (!confirm(t('admin.confirmDeletePlay'))) return
    try {
      await api.deletePlay(id, token)
      refreshData()
    } catch {
      setError(t('admin.deletePlayError'))
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="page page--narrow">
        <section className="section">
          <h1>{t('admin.loginTitle')}</h1>
          <form className="form" onSubmit={handleLogin}>
            <label>
              {t('admin.password')}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {loginError && <ErrorMessage message={loginError} />}
            <button type="submit" className="btn">
              {t('admin.login')}
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
          <h1>{t('admin.panelTitle')}</h1>
          <div className="section__actions">
            <button className="btn btn--ghost" onClick={logout}>
              {t('admin.logout')}
            </button>
          </div>
        </div>
        <div className="tabs">
          <button
            className={activeTab === 'authors' ? 'tab tab--active' : 'tab'}
            onClick={() => setActiveTab('authors')}
          >
            {t('admin.tabAuthors')}
          </button>
          <button
            className={activeTab === 'plays' ? 'tab tab--active' : 'tab'}
            onClick={() => setActiveTab('plays')}
          >
            {t('admin.tabPlays')}
          </button>
        </div>
        {error && <ErrorMessage message={error} />}
        {loading ? (
          <Loader />
        ) : activeTab === 'authors' ? (
          <div className="admin-grid">
            <form className="form" onSubmit={handleAuthorSubmit}>
              <h2>{editingAuthorId ? t('admin.authorFormEdit') : t('admin.authorFormNew')}</h2>
              <label>
                {t('admin.name')}
                <input
                  value={authorForm.name}
                  onChange={(event) =>
                    setAuthorForm({ ...authorForm, name: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                {t('admin.biographyBg')}
                <textarea
                  value={authorForm.biography_bg}
                  onChange={(event) =>
                    setAuthorForm({
                      ...authorForm,
                      biography_bg: event.target.value,
                    })
                  }
                  rows={5}
                  required
                />
              </label>
              <label>
                {t('admin.biographyEn')}
                <textarea
                  value={authorForm.biography_en}
                  onChange={(event) =>
                    setAuthorForm({
                      ...authorForm,
                      biography_en: event.target.value,
                    })
                  }
                  rows={5}
                />
              </label>
              <label>
                {t('admin.photoUrl')}
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
                {t('admin.uploadPhoto')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setAuthorPhotoFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              <button className="btn" type="submit">
                {editingAuthorId ? t('admin.saveChanges') : t('admin.saveAuthor')}
              </button>
            </form>
            <div className="list list--admin">
              <h3>{t('admin.existingAuthors')}</h3>
              {authors.map((author) => (
                <div key={author.id} className="list__item">
                  <div>
                    <strong>{author.name}</strong>
                    <p>{getLocalized(author.biography_bg, author.biography_en, lang).slice(0, 100)}...</p>
                  </div>
                  <div className="list__actions">
                    <button
                      className="btn btn--ghost"
                      onClick={() => handleAuthorEdit(author)}
                    >
                      {t('admin.edit')}
                    </button>
                    <button
                      className="btn btn--danger"
                      onClick={() => handleAuthorDelete(author.id)}
                    >
                      {t('admin.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="admin-grid">
            <form className="form" onSubmit={handlePlaySubmit}>
              <h2>{editingPlayId ? t('admin.playFormEdit') : t('admin.playFormNew')}</h2>
              <label>
                {t('admin.titleBg')}
                <input
                  value={playForm.title_bg}
                  onChange={(event) =>
                    setPlayForm({ ...playForm, title_bg: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                {t('admin.titleEn')}
                <input
                  value={playForm.title_en}
                  onChange={(event) =>
                    setPlayForm({ ...playForm, title_en: event.target.value })
                  }
                />
              </label>
              <label>
                {t('admin.descriptionBg')}
                <textarea
                  value={playForm.description_bg}
                  onChange={(event) =>
                    setPlayForm({
                      ...playForm,
                      description_bg: event.target.value,
                    })
                  }
                  rows={5}
                  required
                />
              </label>
              <label>
                {t('admin.descriptionEn')}
                <textarea
                  value={playForm.description_en}
                  onChange={(event) =>
                    setPlayForm({
                      ...playForm,
                      description_en: event.target.value,
                    })
                  }
                  rows={5}
                />
              </label>
              <label>
                {t('plays.author')}
                <select
                  value={playForm.author_id}
                  onChange={(event) =>
                    setPlayForm({ ...playForm, author_id: event.target.value })
                  }
                  required
                >
                  <option value="">{t('admin.selectAuthor')}</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form__inline">
                <label>
                  {t('plays.year')}
                  <input
                    value={playForm.year}
                    onChange={(event) =>
                      setPlayForm({ ...playForm, year: event.target.value })
                    }
                    type="number"
                  />
                </label>
                <label>
                  {t('plays.genre')}
                  <input
                    value={playForm.genre}
                    onChange={(event) =>
                      setPlayForm({ ...playForm, genre: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t('plays.theme')}
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
                  {t('plays.duration')}
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
                  {t('plays.maleParticipants')}
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
                  {t('plays.femaleParticipants')}
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
                {t('plays.imagesUrl')}
                <textarea
                  value={playForm.imageUrls}
                  onChange={(event) =>
                    setPlayForm({ ...playForm, imageUrls: event.target.value })
                  }
                  rows={2}
                  placeholder="https://example.com/image1.jpg (one URL per line)"
                />
              </label>
              {editingPlayId && editingPlayDetail && (editingPlayDetail.images?.length ?? 0) > 0 && (
                <div className="form__image-captions">
                  <p className="form__hint">{t('admin.existingImages')}</p>
                  {(editingPlayDetail.images ?? [])
                    .filter((img) => !existingImagesToDelete.includes(img.id))
                    .map((img) => {
                      const url = img.image_url.startsWith('http')
                        ? img.image_url
                        : `${API_BASE}${img.image_url}`
                      const captions = existingImageCaptions[img.id] ?? {
                        caption_bg: img.caption_bg ?? '',
                        caption_en: img.caption_en ?? '',
                      }
                      return (
                        <div key={img.id} className="image-caption-row image-caption-row--existing">
                          <div className="image-caption-row__preview">
                            <img
                              src={url}
                              alt=""
                              width={60}
                              height={60}
                              style={{ objectFit: 'cover', borderRadius: 4 }}
                            />
                          </div>
                          <div className="image-caption-row__inputs">
                            <input
                              type="text"
                              placeholder={t('admin.captionBg')}
                              value={captions.caption_bg}
                              onChange={(e) =>
                                setExistingImageCaptions((prev) => ({
                                  ...prev,
                                  [img.id]: {
                                    ...prev[img.id],
                                    caption_bg: e.target.value,
                                    caption_en: prev[img.id]?.caption_en ?? captions.caption_en,
                                  },
                                }))
                              }
                            />
                            <input
                              type="text"
                              placeholder={t('admin.captionEn')}
                              value={captions.caption_en}
                              onChange={(e) =>
                                setExistingImageCaptions((prev) => ({
                                  ...prev,
                                  [img.id]: {
                                    ...prev[img.id],
                                    caption_bg: prev[img.id]?.caption_bg ?? captions.caption_bg,
                                    caption_en: e.target.value,
                                  },
                                }))
                              }
                            />
                            <button
                              type="button"
                              className="btn btn--sm btn--danger"
                              onClick={() =>
                                setExistingImagesToDelete((prev) => [...prev, img.id])
                              }
                            >
                              {t('admin.remove')}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  {existingImagesToDelete.length > 0 && (
                    <p className="form__hint form__hint--muted">
                      {t('admin.imagesMarkedForRemoval', { count: existingImagesToDelete.length })}
                    </p>
                  )}
                </div>
              )}
              <div className="form__image-captions">
                <p className="form__hint">{t('admin.addImageWithCaptionHint')}</p>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    setPlayImageItems((prev) => [...prev, { file: null as File | null, caption_bg: '', caption_en: '' }])
                  }
                >
                  + {t('admin.addImageWithCaption')}
                </button>
                {playImageItems.map((item, idx) => (
                  <div key={idx} className="image-caption-row">
                    <div className="image-caption-row__preview">
                      {item.file ? (
                        <>
                          <img
                            src={URL.createObjectURL(item.file)}
                            alt=""
                            width={60}
                            height={60}
                            style={{ objectFit: 'cover', borderRadius: 4 }}
                          />
                          <span className="image-caption-row__name">{item.file.name}</span>
                        </>
                      ) : (
                        <label className="image-caption-row__placeholder">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f)
                                setPlayImageItems((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, file: f } : p))
                                )
                              e.target.value = ''
                            }}
                          />
                          <span>{t('admin.chooseFile')}</span>
                        </label>
                      )}
                    </div>
                    <div className="image-caption-row__inputs">
                      <input
                        type="text"
                        placeholder={t('admin.captionBg')}
                        value={item.caption_bg}
                        onChange={(e) => {
                          setPlayImageItems((prev) =>
                            prev.map((p, i) =>
                              i === idx ? { ...p, caption_bg: e.target.value } : p
                            )
                          )
                        }}
                      />
                      <input
                        type="text"
                        placeholder={t('admin.captionEn')}
                        value={item.caption_en}
                        onChange={(e) => {
                          setPlayImageItems((prev) =>
                            prev.map((p, i) =>
                              i === idx ? { ...p, caption_en: e.target.value } : p
                            )
                          )
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          setPlayImageItems((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        {t('admin.remove')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <label>
                {t('plays.uploadPdf')}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) =>
                    setPlayPdfFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              <button className="btn" type="submit">
                {editingPlayId ? t('admin.saveChanges') : t('admin.savePlay')}
              </button>
            </form>
            <div className="list list--admin">
              <h3>{t('admin.existingPlays')}</h3>
              {plays.map((play) => (
                <div key={play.id} className="list__item">
                  <div>
                    <strong>{getLocalized(play.title_bg, play.title_en, lang)}</strong>
                    <p>{getLocalized(play.description_bg, play.description_en, lang).slice(0, 100)}...</p>
                  </div>
                  <div className="list__actions">
                    <button
                      className="btn btn--ghost"
                      onClick={() => handlePlayEdit(play)}
                    >
                      {t('admin.edit')}
                    </button>
                    <button
                      className="btn btn--danger"
                      onClick={() => handlePlayDelete(play.id)}
                    >
                      {t('admin.delete')}
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
