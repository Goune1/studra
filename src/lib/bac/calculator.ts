import { BAC_COEFFICIENTS_CC, BAC_COEFFICIENTS_TERMINAL } from './coefficients'

export type BacSubjectType =
  | 'tronc_commun_cc'
  | 'specialite_terminale'
  | 'specialite_abandonnee_1ere'
  | 'terminal_hors_cc'
  | 'option'
  | 'inconnu'

export type BacCoefficientKey =
  | keyof typeof BAC_COEFFICIENTS_CC
  | 'specialite_1'
  | 'specialite_2'
  | 'philosophie'
  | 'francais'
  | 'inconnu'

export type BacConfidence = 'haute' | 'moyenne' | 'basse'

export interface IdentifiedSubject {
  pronoteId: string
  pronoteName: string
  normalizedName: string
  type: BacSubjectType
  coefficientKey: BacCoefficientKey
  coefficient: number
  confidence: BacConfidence
  notes?: string
}

export interface BacIdentificationResult {
  subjects: IdentifiedSubject[]
  detectedSpecialties: string[]
  warnings: string[]
}

export interface TerminalNotes {
  philosophie?: number
  specialite1?: number
  specialite2?: number
  grandOral?: number
  francaisEcrit?: number
  francaisOral?: number
}

export type BacMention =
  | 'Non admis'
  | 'Passable'
  | 'Assez bien'
  | 'Bien'
  | 'Très bien'
  | 'Félicitations'

export interface BacCalculationDetail {
  id: string
  label: string
  note: number
  coefficient: number
  points: number
  source: 'pronote' | 'terminal'
}

export interface BacCalculationResult {
  average: number | null
  totalPoints: number
  totalCoefficients: number
  details: BacCalculationDetail[]
  mention: BacMention
  isComplete: boolean
}

function isValidNote(note: number | undefined): note is number {
  return typeof note === 'number' && Number.isFinite(note) && note >= 0 && note <= 20
}

function getMention(average: number | null): BacMention {
  if (average === null || average < 10) return 'Non admis'
  if (average >= 18) return 'Félicitations'
  if (average >= 16) return 'Très bien'
  if (average >= 14) return 'Bien'
  if (average >= 12) return 'Assez bien'
  return 'Passable'
}

function addDetail(
  details: BacCalculationDetail[],
  id: string,
  label: string,
  note: number | undefined,
  coefficient: number,
  source: BacCalculationDetail['source'],
) {
  if (!isValidNote(note)) return

  details.push({
    id,
    label,
    note,
    coefficient,
    points: note * coefficient,
    source,
  })
}

export function calculateBacAverage(
  identifiedSubjects: IdentifiedSubject[],
  pronoteAverages: Record<string, number>,
  terminalNotes: TerminalNotes,
): BacCalculationResult {
  const details: BacCalculationDetail[] = []
  const ccSubjects = new Map<keyof typeof BAC_COEFFICIENTS_CC, {
    label: string
    notes: number[]
  }>()

  for (const subject of identifiedSubjects) {
    const isCcSubject =
      subject.type === 'tronc_commun_cc' ||
      subject.type === 'specialite_abandonnee_1ere'

    if (!isCcSubject) continue
    if (!(subject.coefficientKey in BAC_COEFFICIENTS_CC)) continue
    const note = pronoteAverages[subject.pronoteId]
    if (!isValidNote(note)) continue

    const key = subject.coefficientKey as keyof typeof BAC_COEFFICIENTS_CC
    const existing = ccSubjects.get(key)
    if (existing) {
      existing.notes.push(note)
    } else {
      ccSubjects.set(key, { label: subject.normalizedName, notes: [note] })
    }
  }

  for (const [key, subject] of ccSubjects) {
    const average = subject.notes.reduce((sum, note) => sum + note, 0) / subject.notes.length
    addDetail(details, `cc-${key}`, subject.label, average, BAC_COEFFICIENTS_CC[key], 'pronote')
  }

  addDetail(details, 'terminal-philosophie', 'Philosophie', terminalNotes.philosophie, BAC_COEFFICIENTS_TERMINAL.philosophie, 'terminal')
  addDetail(details, 'terminal-specialite-1', 'Spécialité 1', terminalNotes.specialite1, BAC_COEFFICIENTS_TERMINAL.specialite_1, 'terminal')
  addDetail(details, 'terminal-specialite-2', 'Spécialité 2', terminalNotes.specialite2, BAC_COEFFICIENTS_TERMINAL.specialite_2, 'terminal')
  addDetail(details, 'terminal-grand-oral', 'Grand Oral', terminalNotes.grandOral, BAC_COEFFICIENTS_TERMINAL.grand_oral, 'terminal')
  addDetail(details, 'terminal-francais-ecrit', 'Français écrit', terminalNotes.francaisEcrit, BAC_COEFFICIENTS_TERMINAL.francais_ecrit, 'terminal')
  addDetail(details, 'terminal-francais-oral', 'Français oral', terminalNotes.francaisOral, BAC_COEFFICIENTS_TERMINAL.francais_oral, 'terminal')

  const totalPoints = details.reduce((sum, detail) => sum + detail.points, 0)
  const totalCoefficients = details.reduce((sum, detail) => sum + detail.coefficient, 0)
  const average = totalCoefficients > 0 ? totalPoints / totalCoefficients : null

  return {
    average,
    totalPoints,
    totalCoefficients,
    details,
    mention: getMention(average),
    isComplete: totalCoefficients === 100,
  }
}
