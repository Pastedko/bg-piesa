import type {
  Author,
  AuthorDetail,
  LiteraryPiece,
  Play,
  PlayDetail,
  PlayFile,
  PlayImage,
  TokenResponse,
} from '../types'

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers ?? {})
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Request failed.')
  }
  if (response.status === 204) {
    return {} as T
  }
  return (await response.json()) as T
}

export const api = {
  getAuthors: (search?: string) =>
    request<Author[]>(
      `/api/authors${search ? `?search=${encodeURIComponent(search)}` : ''}`
    ),
  getAuthor: (id: string) => request<AuthorDetail>(`/api/authors/${id}`),
  getPlays: (filters?: {
    search?: string
    authorId?: string
    genre?: string
    theme?: string
    yearMin?: number
    yearMax?: number
    maleParticipantsMin?: number
    maleParticipantsMax?: number
    femaleParticipantsMin?: number
    femaleParticipantsMax?: number
  }) => {
    const params = new URLSearchParams()
    if (filters?.search) params.set('search', filters.search)
    if (filters?.authorId) params.set('author_id', filters.authorId)
    if (filters?.genre) params.set('genre', filters.genre)
    if (filters?.theme) params.set('theme', filters.theme)
    if (filters?.yearMin !== undefined) params.set('year_min', String(filters.yearMin))
    if (filters?.yearMax !== undefined) params.set('year_max', String(filters.yearMax))
    if (filters?.maleParticipantsMin !== undefined) params.set('male_participants_min', String(filters.maleParticipantsMin))
    if (filters?.maleParticipantsMax !== undefined) params.set('male_participants_max', String(filters.maleParticipantsMax))
    if (filters?.femaleParticipantsMin !== undefined) params.set('female_participants_min', String(filters.femaleParticipantsMin))
    if (filters?.femaleParticipantsMax !== undefined) params.set('female_participants_max', String(filters.femaleParticipantsMax))
    const query = params.toString()
    return request<Play[]>(`/api/plays${query ? `?${query}` : ''}`)
  },
  getPlay: (id: string) => request<PlayDetail>(`/api/plays/${id}`),
  getLibrary: (filters?: { search?: string; authorId?: string; playId?: number }) => {
    const params = new URLSearchParams()
    if (filters?.search) params.set('search', filters.search)
    if (filters?.authorId) params.set('author_id', filters.authorId)
    if (filters?.playId !== undefined && filters?.playId !== null)
      params.set('play_id', String(filters.playId))
    const query = params.toString()
    return request<LiteraryPiece[]>(`/api/library${query ? `?${query}` : ''}`)
  },
  getLiteraryPiece: (id: string) => request<LiteraryPiece>(`/api/library/${id}`),
  login: (password: string) =>
    request<TokenResponse>(`/api/admin/login`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  createAuthor: (payload: Partial<Author>, token: string) =>
    request<Author>(`/api/admin/authors`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),
  updateAuthor: (id: number, payload: Partial<Author>, token: string) =>
    request<Author>(`/api/admin/authors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, token),
  deleteAuthor: (id: number, token: string) =>
    request<void>(`/api/admin/authors/${id}`, { method: 'DELETE' }, token),
  createPlay: (payload: Partial<Play> & { image_urls?: string[] }, token: string) =>
    request<PlayDetail>(`/api/admin/plays`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),
  updatePlay: (
    id: number,
    payload: Partial<Play> & { image_urls?: string[] },
    token: string
  ) =>
    request<PlayDetail>(`/api/admin/plays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, token),
  deletePlay: (id: number, token: string) =>
    request<void>(`/api/admin/plays/${id}`, { method: 'DELETE' }, token),
  createLiteraryPiece: (
    payload: Partial<LiteraryPiece>,
    token: string
  ) =>
    request<LiteraryPiece>(`/api/admin/library`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),
  updateLiteraryPiece: (
    id: number,
    payload: Partial<LiteraryPiece>,
    token: string
  ) =>
    request<LiteraryPiece>(`/api/admin/library/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, token),
  deleteLiteraryPiece: (id: number, token: string) =>
    request<void>(`/api/admin/library/${id}`, { method: 'DELETE' }, token),
  uploadLiteraryPiecePdf: (id: number, file: File, token: string) => {
    const data = new FormData()
    data.append('file', file)
    return fetch(`${API_BASE}/api/admin/library/${id}/upload-pdf`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: data,
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Качването на PDF е неуспешно.')
      }
      return res.json() as Promise<LiteraryPiece>
    })
  },
  viewLiteraryPiecePdfUrl: (id: number) =>
    `${API_BASE}/api/library/${id}/download-pdf`,
  uploadAuthorPhoto: (id: number, file: File, token: string) => {
    const data = new FormData()
    data.append('file', file)
    return fetch(`${API_BASE}/api/admin/authors/${id}/upload-photo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: data,
    }).then((res) => {
      if (!res.ok) {
        throw new Error('Качването на снимка е неуспешно.')
      }
      return res.json() as Promise<Author>
    })
  },
  uploadPlayPdf: (id: number, file: File, token: string) => {
    const data = new FormData()
    data.append('file', file)
    return fetch(`${API_BASE}/api/admin/plays/${id}/upload-pdf`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: data,
    }).then((res) => {
      if (!res.ok) {
        throw new Error('Качването на сценарий е неуспешно.')
      }
      return res.json() as Promise<Play>
    })
  },
  uploadPlayImage: (
    id: number,
    file: File,
    token: string,
    captions?: { caption_bg?: string; caption_en?: string }
  ) => {
    const data = new FormData()
    data.append('file', file)
    if (captions?.caption_bg) data.append('caption_bg', captions.caption_bg)
    if (captions?.caption_en) data.append('caption_en', captions.caption_en)
    return fetch(`${API_BASE}/api/admin/plays/${id}/upload-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: data,
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Качването на изображения е неуспешно.')
      }
      return res.json() as Promise<PlayDetail>
    })
  },
  deletePlayImage: (playId: number, imageId: number, token: string) =>
    request<void>(`/api/admin/plays/${playId}/images/${imageId}`, { method: 'DELETE' }, token),
  uploadPlayFile: (
    id: number,
    file: File,
    token: string,
    captions?: { caption_bg?: string; caption_en?: string }
  ) => {
    const data = new FormData()
    data.append('file', file)
    if (captions?.caption_bg) data.append('caption_bg', captions.caption_bg)
    if (captions?.caption_en) data.append('caption_en', captions.caption_en)
    return fetch(`${API_BASE}/api/admin/plays/${id}/upload-file`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: data,
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Качването на файла е неуспешно.')
      }
      return res.json() as Promise<PlayDetail>
    })
  },
  deletePlayFile: (playId: number, fileId: number, token: string) =>
    request<void>(`/api/admin/plays/${playId}/files/${fileId}`, { method: 'DELETE' }, token),
  updatePlayFileCaption: (
    playId: number,
    fileId: number,
    payload: { caption_bg?: string; caption_en?: string },
    token: string
  ) =>
    request<PlayFile>(
      `/api/admin/plays/${playId}/files/${fileId}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      token
    ),
  updatePlayImageCaption: (
    playId: number,
    imageId: number,
    payload: { caption_bg?: string; caption_en?: string },
    token: string
  ) =>
    request<PlayImage>(
      `/api/admin/plays/${playId}/images/${imageId}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      token
    ),
  downloadPdfUrl: (id: number) => `${API_BASE}/api/plays/${id}/download-pdf`,
  viewFileUrl: (playId: number, fileId: number) =>
    `${API_BASE}/api/plays/${playId}/files/${fileId}/view`,
}

