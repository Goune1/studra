import type { SupabaseClient } from '@supabase/supabase-js'
import type { StudyPlanContentItem } from '@/lib/openai'

/**
 * Ajuste la maîtrise auto-évaluée de decks via la stabilité FSRS moyenne :
 * - stabilité > 21 jours → +1 (max 5)
 * - stabilité < 3 jours → -1 (min 1)
 * - entre les deux → on garde l'auto-évaluation.
 */
export async function adjustMasteryWithFSRS(
  supabase: SupabaseClient,
  contents: StudyPlanContentItem[],
): Promise<StudyPlanContentItem[]> {
  const deckIds = contents.filter((c) => c.type === 'deck').map((c) => c.id)
  if (deckIds.length === 0) return contents

  const { data: stats } = await supabase
    .from('flashcards')
    .select('deck_id, fsrs_stability, fsrs_reps')
    .in('deck_id', deckIds)

  if (!stats || stats.length === 0) return contents

  const perDeck = new Map<string, { stabSum: number; count: number }>()
  for (const row of stats as Array<{
    deck_id: string
    fsrs_stability: number | null
    fsrs_reps: number
  }>) {
    if (row.fsrs_reps === 0 || row.fsrs_stability == null) continue
    const entry = perDeck.get(row.deck_id) ?? { stabSum: 0, count: 0 }
    entry.stabSum += row.fsrs_stability
    entry.count += 1
    perDeck.set(row.deck_id, entry)
  }

  return contents.map((c) => {
    if (c.type !== 'deck') return c
    const entry = perDeck.get(c.id)
    if (!entry || entry.count === 0) return c
    const avgStability = entry.stabSum / entry.count
    let mastery = c.mastery
    if (avgStability > 21) mastery = Math.min(5, mastery + 1)
    else if (avgStability < 3) mastery = Math.max(1, mastery - 1)
    return { ...c, mastery }
  })
}

/**
 * Résout la liste des contenus d'un plan à partir de mastery_levels.
 * Les entrées non retrouvées (contenu supprimé) sont filtrées silencieusement.
 */
export async function resolvePlanContents(
  supabase: SupabaseClient,
  userId: string,
  masteryLevels: Record<string, number>,
): Promise<StudyPlanContentItem[]> {
  const ids = Object.keys(masteryLevels)
  if (ids.length === 0) return []

  const [fichesRes, decksRes] = await Promise.all([
    supabase.from('fiches').select('id, title').eq('user_id', userId).in('id', ids),
    supabase.from('decks').select('id, title').eq('user_id', userId).in('id', ids),
  ])

  const out: StudyPlanContentItem[] = []
  for (const f of (fichesRes.data ?? []) as Array<{ id: string; title: string }>) {
    out.push({ id: f.id, title: f.title, type: 'fiche', mastery: masteryLevels[f.id] ?? 3 })
  }
  for (const d of (decksRes.data ?? []) as Array<{ id: string; title: string }>) {
    out.push({ id: d.id, title: d.title, type: 'deck', mastery: masteryLevels[d.id] ?? 3 })
  }
  return out
}
