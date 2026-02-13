export type Author = {
  id: number
  name: string
  biography_bg: string
  biography_en?: string | null
  photo_url?: string | null
  created_at: string
  updated_at: string
}

export type PlayImage = {
  id: number
  image_url: string
  caption_bg?: string | null
  caption_en?: string | null
}

export type PlayFile = {
  id: number
  file_url: string
  caption_bg?: string | null
  caption_en?: string | null
}

export type Play = {
  id: number
  title_bg: string
  title_en?: string | null
  description_bg: string
  description_en?: string | null
  year?: number | null
  genre?: string | null
  theme?: string | null
  male_participants?: number | null
  female_participants?: number | null
  author_id: number
  author?: Author
  pdf_path?: string | null
  created_at: string
  updated_at: string
  images?: PlayImage[]
}

/** Get localized string: prefers current language, falls back to the other. */
export function getLocalized(
  bg: string | null | undefined,
  en: string | null | undefined,
  lang: string
): string {
  const wantEn = lang === 'en'
  if (wantEn && en) return en
  if (bg) return bg
  return (wantEn ? en : bg) ?? ''
}

export type AuthorDetail = Author & {
  plays: Play[]
}

export type PlayDetail = Play & {
  images: PlayImage[]
  files: PlayFile[]
}

export type LiteraryPiece = {
  id: number
  title_bg: string
  title_en?: string | null
  description_bg: string
  description_en?: string | null
  pdf_path?: string | null
  author_id: number
  play_id?: number | null
  author?: Author
  play?: Play
  created_at: string
  updated_at: string
}

export type TokenResponse = {
  access_token: string
  token_type: string
}

