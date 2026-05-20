// Raw shapes retournees par l'API Pawnote (via pronote_connections.raw_data)

export interface RawGradeValue {
  kind: number
  points: number | null
}

export interface RawSubjectAverage {
  subject: { id: string; name: string }
  student: RawGradeValue
  class_average: RawGradeValue
  min: RawGradeValue
  max: RawGradeValue
  outOf: RawGradeValue
  backgroundColor: string
}

export interface RawGrade {
  id: string
  subject: { id: string; name: string }
  value: RawGradeValue
  outOf: RawGradeValue
  defaultOutOf: RawGradeValue
  date: string
  coefficient: number
  comment: string
  average: RawGradeValue
  min: RawGradeValue
  max: RawGradeValue
  isBonus: boolean
  isOptional: boolean
  isOutOf20: boolean
}

export interface RawPeriod {
  period: { id: string; name: string }
  overallAverage?: RawGradeValue
  classAverage?: RawGradeValue
  subjectsAverages: RawSubjectAverage[]
  grades: RawGrade[]
}

// Shapes parsees, utilisees par les composants

export type GradeValueStatus = 'normal' | 'absent' | 'not-rendered' | 'unavailable'

export interface ParsedAverage {
  available: boolean
  /** Valeur normalisee sur 20 */
  on20: number | null
  display: string
}

export interface ParsedSubjectAverage {
  subjectId: string
  subjectName: string
  color: string
  studentAvg: ParsedAverage
  classAvg: ParsedAverage
  minAvg: ParsedAverage
  maxAvg: ParsedAverage
}

export interface ParsedGrade {
  id: string
  subjectId: string
  date: string
  comment: string
  status: GradeValueStatus
  /** Affichage brut : "6.5/10", "Absent", etc. */
  valueDisplay: string
  /** Valeur numerique brute si disponible */
  valuePoints: number | null
  outOfPoints: number | null
  coefficient: number
  classAvgDisplay: string
  isOptional: boolean
  isBonus: boolean
}

export interface ParsedPeriod {
  id: string
  name: string
  overallAvg: ParsedAverage | null
  classAvg: ParsedAverage | null
  subjects: ParsedSubjectAverage[]
  grades: ParsedGrade[]
}

// Helpers

function fmt(n: number): string {
  return parseFloat(n.toFixed(2)).toString()
}

function normalizeOn20(points: number, outOf: number | null): number | null {
  if (outOf === null || outOf === 0) return null
  return outOf === 20 ? points : (points / outOf) * 20
}

function parseAverage(v: RawGradeValue, outOf?: RawGradeValue): ParsedAverage {
  if (v.kind !== 0 || v.points === null) {
    return { available: false, on20: null, display: '-' }
  }
  const outOfPoints = outOf && outOf.kind === 0 ? outOf.points : null
  const on20 = normalizeOn20(v.points, outOfPoints ?? 20)
  return {
    available: true,
    on20,
    display: on20 !== null ? fmt(on20) : '-',
  }
}

export function cleanSubjectName(name: string): string {
  const sep = name.indexOf(' > ')
  if (sep === -1) return name
  const before = name.slice(0, sep).trim()
  const after = name.slice(sep + 3).trim()
  return before === after ? before : name
}

function gradeValueStatus(v: RawGradeValue): GradeValueStatus {
  if (v.kind === 0 && v.points !== null) return 'normal'
  if (v.kind === 1) return 'absent'
  if (v.kind === 3) return 'not-rendered'
  return 'unavailable'
}

function gradeStatusDisplay(status: GradeValueStatus): string {
  if (status === 'absent') return 'Absent'
  if (status === 'not-rendered') return 'Non rendu'
  return '-'
}

function parseRawGrade(g: RawGrade): ParsedGrade {
  const status = gradeValueStatus(g.value)
  const outOfPoints = g.outOf.kind === 0 ? g.outOf.points : null

  let valueDisplay: string
  if (status === 'normal' && g.value.points !== null) {
    valueDisplay = `${fmt(g.value.points)}/${outOfPoints ?? '?'}`
  } else {
    valueDisplay = gradeStatusDisplay(status)
  }

  const classAvgStatus = g.average.kind === 0 && g.average.points !== null
  const classAvgDisplay = classAvgStatus
    ? `${fmt(g.average.points!)}/${outOfPoints ?? '?'}`
    : '-'

  return {
    id: g.id,
    subjectId: g.subject.id,
    date: g.date,
    comment: g.comment,
    status,
    valueDisplay,
    valuePoints: status === 'normal' ? g.value.points : null,
    outOfPoints,
    coefficient: g.coefficient,
    classAvgDisplay,
    isOptional: g.isOptional,
    isBonus: g.isBonus,
  }
}

function parseRawPeriod(raw: RawPeriod): ParsedPeriod {
  const subjects: ParsedSubjectAverage[] = raw.subjectsAverages.map((s) => ({
    subjectId: s.subject.id,
    subjectName: cleanSubjectName(s.subject.name),
    color: s.backgroundColor.startsWith('#') ? s.backgroundColor : `#${s.backgroundColor}`,
    studentAvg: parseAverage(s.student, s.outOf),
    classAvg: parseAverage(s.class_average, s.outOf),
    minAvg: parseAverage(s.min, s.outOf),
    maxAvg: parseAverage(s.max, s.outOf),
  }))

  const grades: ParsedGrade[] = raw.grades.map(parseRawGrade)

  const overallAvg = raw.overallAverage
    ? parseAverage(raw.overallAverage)
    : null

  const classAvg = raw.classAverage
    ? parseAverage(raw.classAverage)
    : null

  return {
    id: raw.period.id,
    name: raw.period.name,
    overallAvg,
    classAvg,
    subjects,
    grades,
  }
}

export function parseGrades(raw: unknown): ParsedPeriod[] {
  if (!Array.isArray(raw)) return []

  const result: ParsedPeriod[] = []
  for (const item of raw) {
    try {
      result.push(parseRawPeriod(item as RawPeriod))
    } catch {
      // Ignore les periodes malformees
    }
  }
  return result
}

export function gradeAvgColor(avg: number): string {
  if (avg < 8) return '#EF4444'
  if (avg < 10) return '#F97316'
  if (avg < 12) return '#EAB308'
  return '#22C55E'
}
