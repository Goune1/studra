export type FsrsRating = 1 | 2 | 3 | 4

// Palette désaturée, cohérente avec le système clair/vert forêt (.app-v2).
// Good = vert de marque (--accent). Distinction fonctionnelle conservée.
export const RATING_META: Record<FsrsRating, { label: string; color: string; bg: string }> = {
  1: { label: 'À revoir',  color: '#B4503C', bg: '#B4503C15' },
  2: { label: 'Difficile', color: '#A8762E', bg: '#A8762E15' },
  3: { label: 'Bien',      color: '#1F4D3F', bg: '#1F4D3F15' },
  4: { label: 'Facile',    color: '#3E6B7A', bg: '#3E6B7A15' },
}

export interface FsrsUserSettings {
  desired_retention: number
  maximum_interval: number
  w: number[] | null
  last_optimization_at: string | null
  review_count_at_last_optimization: number
}

/** Preview of the interval that would apply for each rating */
export interface RatingPreview {
  rating: FsrsRating
  label: string
  color: string
  bg: string
  intervalLabel: string
}

/** Result returned by the review endpoint */
export interface ReviewResult {
  ok: true
  nextIntervals: RatingPreview[]
}
