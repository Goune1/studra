import {
  fsrs,
  createEmptyCard,
  Rating,
  generatorParameters,
  type Card,
} from 'ts-fsrs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Flashcard } from '@/types'
import type { FsrsRating, FsrsUserSettings, RatingPreview } from './types'
import { RATING_META } from './types'
import { formatInterval } from './utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a DB flashcard row into a ts-fsrs Card object. */
function dbToCard(fc: Flashcard): Card {
  if (fc.fsrs_state === 0 && fc.fsrs_reps === 0) {
    return createEmptyCard()
  }
  return {
    due:            fc.fsrs_due ? new Date(fc.fsrs_due) : new Date(),
    stability:      fc.fsrs_stability  ?? 0,
    difficulty:     fc.fsrs_difficulty ?? 0,
    elapsed_days:   fc.fsrs_elapsed_days,
    scheduled_days: fc.fsrs_scheduled_days,
    reps:           fc.fsrs_reps,
    lapses:         fc.fsrs_lapses,
    learning_steps: fc.fsrs_learning_steps,
    state:          fc.fsrs_state as 0 | 1 | 2 | 3,
    last_review:    fc.fsrs_last_review ? new Date(fc.fsrs_last_review) : undefined,
  } as Card
}

/** Convert a ts-fsrs Card back to a DB update object. */
function cardToDb(card: Card) {
  return {
    fsrs_due:            card.due.toISOString(),
    fsrs_stability:      card.stability,
    fsrs_difficulty:     card.difficulty,
    fsrs_elapsed_days:   card.elapsed_days,
    fsrs_scheduled_days: card.scheduled_days,
    fsrs_reps:           card.reps,
    fsrs_lapses:         card.lapses,
    fsrs_learning_steps: (card as Card & { learning_steps: number }).learning_steps ?? 0,
    fsrs_state:          card.state,
    fsrs_last_review:    card.last_review?.toISOString() ?? null,
  }
}

// ─── User settings ────────────────────────────────────────────────────────────

export async function getUserSettings(
  userId: string,
  supabase: SupabaseClient,
): Promise<FsrsUserSettings> {
  const { data } = await supabase
    .from('user_fsrs_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) {
    return {
      desired_retention: 0.9,
      maximum_interval: 36500,
      w: null,
      last_optimization_at: null,
      review_count_at_last_optimization: 0,
    }
  }
  return {
    desired_retention: data.desired_retention,
    maximum_interval: data.maximum_interval,
    w: data.w ?? null,
    last_optimization_at: data.last_optimization_at ?? null,
    review_count_at_last_optimization: data.review_count_at_last_optimization,
  }
}

export async function upsertUserSettings(
  userId: string,
  patch: Partial<Pick<FsrsUserSettings, 'desired_retention' | 'maximum_interval'>>,
  supabase: SupabaseClient,
): Promise<void> {
  await supabase.from('user_fsrs_settings').upsert(
    { user_id: userId, ...patch, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
}

// ─── FSRS instance ───────────────────────────────────────────────────────────

function getFsrsInstance(settings: FsrsUserSettings) {
  const params = generatorParameters({
    request_retention: settings.desired_retention,
    maximum_interval: settings.maximum_interval,
  })
  if (settings.w) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(params as any).w = settings.w
  }
  return fsrs(params)
}

// ─── Preview intervals ────────────────────────────────────────────────────────

/** Compute the 4 interval previews for a card without writing anything. */
export function previewIntervals(card: Card, settings: FsrsUserSettings): RatingPreview[] {
  const f = getFsrsInstance(settings)
  const now = new Date()
  const scheduled = f.repeat(card, now)

  return ([1, 2, 3, 4] as FsrsRating[]).map((rating) => {
    const due = new Date(scheduled[rating as 1 | 2 | 3 | 4].card.due)
    return {
      rating,
      ...RATING_META[rating],
      intervalLabel: formatInterval(due, now),
    }
  })
}

// ─── Schedule a review ────────────────────────────────────────────────────────

export async function scheduleReview(
  flashcard: Flashcard,
  deckId: string,
  userId: string,
  rating: FsrsRating,
  durationMs: number | undefined,
  supabase: SupabaseClient,
): Promise<RatingPreview[]> {
  const settings = await getUserSettings(userId, supabase)
  const f = getFsrsInstance(settings)
  const now = new Date()

  const card = dbToCard(flashcard)
  const stateBefore = card.state
  const scheduled = f.repeat(card, now)
  const { card: newCard, log } = scheduled[rating as 1 | 2 | 3 | 4]

  // Update flashcard FSRS state
  await supabase
    .from('flashcards')
    .update(cardToDb(newCard))
    .eq('id', flashcard.id)

  // Insert review log (rating + backward-compat knew)
  await supabase.from('flashcard_reviews').insert({
    flashcard_id:       flashcard.id,
    deck_id:            deckId,
    user_id:            userId,
    knew:               rating >= 2,
    rating,
    state_before:       stateBefore,
    elapsed_days:       log.elapsed_days ?? 0,
    scheduled_days:     newCard.scheduled_days,
    review_duration_ms: durationMs ?? null,
  })

  // Return previews based on the NEW card state (for next session)
  return previewIntervals(newCard, settings)
}

// ─── Due cards ───────────────────────────────────────────────────────────────

export interface DueCard extends Flashcard {
  preview: RatingPreview[]
}

export async function getDueCards(
  deckId: string,
  userId: string,
  limit: number,
  supabase: SupabaseClient,
): Promise<{ cards: DueCard[]; totalInDeck: number }> {
  const now = new Date().toISOString()

  const [dueRes, totalRes, settingsRes] = await Promise.all([
    supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .or(`fsrs_due.is.null,fsrs_due.lte.${now}`)
      .order('fsrs_due', { ascending: true, nullsFirst: true })
      .limit(limit),
    supabase
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('deck_id', deckId),
    supabase
      .from('user_fsrs_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const flashcards = (dueRes.data ?? []) as Flashcard[]
  const settings: FsrsUserSettings = settingsRes.data
    ? {
        desired_retention: settingsRes.data.desired_retention,
        maximum_interval: settingsRes.data.maximum_interval,
        w: settingsRes.data.w ?? null,
        last_optimization_at: settingsRes.data.last_optimization_at ?? null,
        review_count_at_last_optimization: settingsRes.data.review_count_at_last_optimization,
      }
    : {
        desired_retention: 0.9,
        maximum_interval: 36500,
        w: null,
        last_optimization_at: null,
        review_count_at_last_optimization: 0,
      }

  const cards: DueCard[] = flashcards.map((fc) => ({
    ...fc,
    preview: previewIntervals(dbToCard(fc), settings),
  }))

  return { cards, totalInDeck: totalRes.count ?? 0 }
}
