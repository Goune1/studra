export type FsrsRating = 1 | 2 | 3 | 4

export const RATING_META: Record<FsrsRating, { label: string; color: string; bg: string }> = {
  1: { label: 'À revoir',  color: '#EF4444', bg: '#EF444415' },
  2: { label: 'Difficile', color: '#F97316', bg: '#F9731615' },
  3: { label: 'Bien',      color: '#22C55E', bg: '#22C55E15' },
  4: { label: 'Facile',    color: '#3B82F6', bg: '#3B82F615' },
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
