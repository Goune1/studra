export const TAGE_MAGE_SECTIONS = [
  'comprehension',
  'calcul',
  'conditions_minimales',
  'expression',
  'raisonnement_argumentation',
  'logique',
] as const

export type TageMageSection = (typeof TAGE_MAGE_SECTIONS)[number]

export interface TageMageDiagnosticQuestion {
  id: string
  section: TageMageSection
  prompt: string
  options: [string, string, string, string, string]
  correctIndex: number
  explanation: string
  method: string
  difficulty: 1 | 2 | 3
  estimatedSeconds: number
  contentVersion: number
}

export interface TageMagePublicDiagnosticQuestion {
  id: string
  section: TageMageSection
  prompt: string
  options: [string, string, string, string, string]
  difficulty: 1 | 2 | 3
  estimatedSeconds: number
  contentVersion: number
}

export interface TageMageDiagnosticAnswer {
  questionId: string
  selectedIndex: number | null
  durationSeconds: number
}

export interface TageMageSectionResult {
  correctCount: number
  totalQuestions: number
  accuracy: number
  averageDurationSeconds: number
}

export interface TageMageDiagnosticScore {
  correctCount: number
  totalQuestions: number
  durationSeconds: number
  sectionResults: Partial<Record<TageMageSection, TageMageSectionResult>>
}
