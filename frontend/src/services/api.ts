import type {
  Author,
  AuthorDetail,
  Play,
  PlayDetail,
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
    throw new Error(errorText || 'Възникна грешка при заявката.')
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
    durationMin?: number
    durationMax?: number
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
    if (filters?.durationMin !== undefined) params.set('duration_min', String(filters.durationMin))
    if (filters?.durationMax !== undefined) params.set('duration_max', String(filters.durationMax))
    if (filters?.maleParticipantsMin !== undefined) params.set('male_participants_min', String(filters.maleParticipantsMin))
    if (filters?.maleParticipantsMax !== undefined) params.set('male_participants_max', String(filters.maleParticipantsMax))
    if (filters?.femaleParticipantsMin !== undefined) params.set('female_participants_min', String(filters.femaleParticipantsMin))
    if (filters?.femaleParticipantsMax !== undefined) params.set('female_participants_max', String(filters.femaleParticipantsMax))
    const query = params.toString()
    return request<Play[]>(`/api/plays${query ? `?${query}` : ''}`)
  },
  getPlay: (id: string) => request<PlayDetail>(`/api/plays/${id}`),
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
  uploadPlayImages: (id: number, files: File[], token: string) => {
    const data = new FormData()
    files.forEach((file) => data.append('files', file))
    return fetch(`${API_BASE}/api/admin/plays/${id}/upload-images`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: data,
    }).then((res) => {
      if (!res.ok) {
        throw new Error('Качването на изображения е неуспешно.')
      }
      return res.json() as Promise<PlayDetail>
    })
  },
  downloadPdfUrl: (id: number) => `${API_BASE}/api/plays/${id}/download-pdf`,
}

