import type { TageMageSection, TageMageSectionResult } from './types'

export type RankedSection = Pick<TageMageSectionResult, 'correctCount' | 'totalQuestions' | 'averageDurationSeconds'> & {
  section: string
}

const STRENGTH_MIN_RATE = 0.75
const MAX_ITEMS = 3

export const TAGE_MAGE_SECTION_NEXT_STEPS: Record<TageMageSection, string> = {
  comprehension: 'Lis trois courts textes argumentatifs et, pour chacun, écris la thèse en une phrase avant de regarder les propositions.',
  calcul: 'Fais 15 minutes de calcul mental sans calculatrice : pourcentages successifs, fractions et conversions de durées.',
  conditions_minimales: 'Sur cinq items, teste toujours (1) seule, puis (2) seule, puis les deux ensemble, en notant ta décision à chaque étape.',
  expression: 'Révise l’accord du participe passé avec avoir et le sens des connecteurs (pourtant, donc, car), puis refais les questions ratées.',
  raisonnement_argumentation: 'Pour chaque argument, écris prémisses → conclusion, puis cherche la cause alternative ou la preuve qui manque.',
  logique: 'Schématise les contraintes (ordres, implications) avant de lire les réponses, puis élimine chaque option dès la première contrainte violée.',
}

function rate(result: RankedSection) {
  return result.totalQuestions ? result.correctCount / result.totalQuestions : 0
}

/**
 * Priorités : sous-tests non réussis en totalité, du plus faible au plus fort (le plus lent d’abord à égalité).
 * Points d’appui : sous-tests restants avec au moins 75 % de réussite. Un sous-test n’apparaît jamais dans les deux listes.
 */
export function rankTageMageSections(results: RankedSection[]) {
  const ascending = [...results].sort((a, b) => rate(a) - rate(b) || b.averageDurationSeconds - a.averageDurationSeconds)
  const priorities = ascending.filter((result) => result.correctCount < result.totalQuestions).slice(0, MAX_ITEMS)
  const prioritySections = new Set(priorities.map((result) => result.section))
  const strengths = ascending
    .filter((result) => !prioritySections.has(result.section) && rate(result) >= STRENGTH_MIN_RATE)
    .reverse()
    .slice(0, MAX_ITEMS)

  return { strengths, priorities }
}

export function getTageMageNextStep(section: string): string | null {
  return TAGE_MAGE_SECTION_NEXT_STEPS[section as TageMageSection] ?? null
}
