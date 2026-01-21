export type Author = {
  id: number
  name: string
  biography: string
  photo_url?: string | null
  created_at: string
  updated_at: string
}

export type PlayImage = {
  id: number
  image_url: string
}

export type Play = {
  id: number
  title: string
  description: string
  year?: number | null
  genre?: string | null
  theme?: string | null
  duration?: number | null
  male_participants?: number | null
  female_participants?: number | null
  author_id: number
  author?: Author
  pdf_path?: string | null
  created_at: string
  updated_at: string
  images?: PlayImage[]
}

export type AuthorDetail = Author & {
  plays: Play[]
}

export type PlayDetail = Play & {
  images: PlayImage[]
}

export type TokenResponse = {
  access_token: string
  token_type: string
}

