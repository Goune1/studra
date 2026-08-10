'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { parseGrades } from '@/lib/pronote/parse-grades'
import {
  calculateBacAverage,
  type BacCalculationResult,
  type BacIdentificationResult,
  type BacMention,
  type BacSubjectType,
  type IdentifiedSubject,
  type TerminalNotes,
} from '@/lib/bac/calculator'
import { BAC_COEFFICIENTS_CC, BAC_COEFFICIENTS_TERMINAL } from '@/lib/bac/coefficients'

const COLOR = '#1F4D3F'

interface BacSimulatorProps {
  rawData: unknown
}

interface IdentifyError {
  error: string
}

type TerminalNoteKey = keyof TerminalNotes

const MENTION_COLORS: Record<BacMention, string> = {
  'Non admis': '#EF4444',
  Passable: '#F97316',
  'Assez bien': '#EAB308',
  Bien: '#22C55E',
  'Très bien': '#38BDF8',
  Félicitations: '#A78BFA',
}

function formatNumber(value: number | null): string {
  if (value === null) return '-'
  return parseFloat(value.toFixed(2)).toString()
}

function parseInputNote(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const note = Number(value)
  return Number.isFinite(note) ? note : undefined
}

function nextMentionProgress(result: BacCalculationResult): { label: string; progress: number } {
  const average = result.average ?? 0
  const thresholds = [
    { label: 'Passable', value: 10 },
    { label: 'Assez bien', value: 12 },
    { label: 'Bien', value: 14 },
    { label: 'Très bien', value: 16 },
    { label: 'Félicitations', value: 18 },
  ]

  const next = thresholds.find((threshold) => average < threshold.value)
  if (!next) return { label: 'Félicitations', progress: 100 }

  const previous = thresholds
    .filter((threshold) => threshold.value < next.value)
    .at(-1)?.value ?? 0
  const progress = ((average - previous) / (next.value - previous)) * 100

  return {
    label: next.label,
    progress: Math.max(0, Math.min(100, progress)),
  }
}

function NoteInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-3)' }}>
        {label}
      </span>
      <input
        type="number"
        min="0"
        max="20"
        step="0.5"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(event) => onChange(parseInputNote(event.target.value))}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: 'var(--ink)',
        }}
        onFocus={(event) => (event.currentTarget.style.borderColor = COLOR + '50')}
        onBlur={(event) => (event.currentTarget.style.borderColor = 'var(--border)')}
      />
    </label>
  )
}

function ConfidenceBadge({ confidence }: { confidence: IdentifiedSubject['confidence'] }) {
  const t = useTranslations('dashboard.bac')
  if (confidence === 'haute') return null
  const color = confidence === 'basse' ? '#F97316' : '#EAB308'
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
      style={{ background: `${color}15`, color, border: `1px solid ${color}35` }}
    >
      {t('confidenceLabel', {confidence})}
    </span>
  )
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isTerminalSubjectName(name: string): boolean {
  const normalized = normalizeSearch(name)
  return (
    normalized.includes('philosophie') ||
    normalized.includes('francais') ||
    normalized.includes('grand oral')
  )
}

function isAnnualPeriodName(name: string): boolean {
  const normalized = normalizeSearch(name)
  return normalized.includes('annee') || normalized.includes('annuel')
}

function displayCoefficient(subject: IdentifiedSubject): number {
  if (subject.coefficientKey === 'histoire_geo') return BAC_COEFFICIENTS_CC.histoire_geo
  if (subject.coefficientKey === 'lv_a') return BAC_COEFFICIENTS_CC.lv_a
  if (subject.coefficientKey === 'lv_b') return BAC_COEFFICIENTS_CC.lv_b
  if (subject.coefficientKey === 'enseignement_scientifique') return BAC_COEFFICIENTS_CC.enseignement_scientifique
  if (subject.coefficientKey === 'eps') return BAC_COEFFICIENTS_CC.eps
  if (subject.coefficientKey === 'emc') return BAC_COEFFICIENTS_CC.emc
  if (subject.coefficientKey === 'specialite_abandonnee') return BAC_COEFFICIENTS_CC.specialite_abandonnee
  if (subject.coefficientKey === 'specialite_1') return BAC_COEFFICIENTS_TERMINAL.specialite_1
  if (subject.coefficientKey === 'specialite_2') return BAC_COEFFICIENTS_TERMINAL.specialite_2
  if (subject.coefficientKey === 'philosophie') return BAC_COEFFICIENTS_TERMINAL.philosophie
  if (subject.coefficientKey === 'francais') {
    return BAC_COEFFICIENTS_TERMINAL.francais_ecrit + BAC_COEFFICIENTS_TERMINAL.francais_oral
  }
  if (subject.type === 'specialite_terminale') return BAC_COEFFICIENTS_TERMINAL.specialite_1
  if (subject.type === 'specialite_abandonnee_1ere') return BAC_COEFFICIENTS_CC.specialite_abandonnee
  return subject.coefficient
}

function sanitizeSubject(subject: IdentifiedSubject): IdentifiedSubject {
  if (isTerminalSubjectName(`${subject.normalizedName} ${subject.pronoteName}`)) {
    if (normalizeSearch(`${subject.normalizedName} ${subject.pronoteName}`).includes('philosophie')) {
      return {
        ...subject,
        normalizedName: 'Philosophie',
        type: 'terminal_hors_cc',
        coefficientKey: 'philosophie',
        coefficient: BAC_COEFFICIENTS_TERMINAL.philosophie,
      }
    }

    if (normalizeSearch(`${subject.normalizedName} ${subject.pronoteName}`).includes('francais')) {
      return {
        ...subject,
        normalizedName: 'Français',
        type: 'terminal_hors_cc',
        coefficientKey: 'francais',
        coefficient: BAC_COEFFICIENTS_TERMINAL.francais_ecrit + BAC_COEFFICIENTS_TERMINAL.francais_oral,
      }
    }
  }

  return {
    ...subject,
    coefficient: displayCoefficient(subject),
  }
}

function getSpecialtyNames(subjects: IdentifiedSubject[]): string[] {
  const terminalSpecialties = subjects.filter((subject) =>
    subject.type === 'specialite_terminale' &&
    !isTerminalSubjectName(`${subject.normalizedName} ${subject.pronoteName}`) &&
    subject.coefficientKey !== 'philosophie' &&
    subject.coefficientKey !== 'francais'
  )
  const fallbackSpecialties = subjects.filter((subject) =>
    subject.type === 'specialite_abandonnee_1ere' &&
    !isTerminalSubjectName(`${subject.normalizedName} ${subject.pronoteName}`)
  )

  const names = [...terminalSpecialties, ...fallbackSpecialties].map((subject) => subject.normalizedName)
  return [...new Set(names)].slice(0, 2)
}

export function BacSimulator({ rawData }: BacSimulatorProps) {
  const t = useTranslations('dashboard.bac')
  const [identification, setIdentification] = useState<BacIdentificationResult | null>(null)
  const [identifying, setIdentifying] = useState(false)
  const [terminalNotes, setTerminalNotes] = useState<TerminalNotes>({})
  const [showFrenchNotes, setShowFrenchNotes] = useState(false)

  const periods = useMemo(() => parseGrades(rawData), [rawData])
  const bacPeriods = useMemo(() => {
    const nonAnnualPeriods = periods.filter((period) => !isAnnualPeriodName(period.name))
    return nonAnnualPeriods.length > 0 ? nonAnnualPeriods : periods
  }, [periods])
  const identifiedSubjects = useMemo(
    () => (identification?.subjects ?? []).map(sanitizeSubject),
    [identification],
  )

  const pronoteAverages = useMemo(() => {
    const valuesBySubject: Record<string, number[]> = {}

    for (const period of bacPeriods) {
      for (const subject of period.subjects) {
        if (subject.studentAvg.on20 === null) continue
        valuesBySubject[subject.subjectId] = [
          ...(valuesBySubject[subject.subjectId] ?? []),
          subject.studentAvg.on20,
        ]
      }
    }

    const averages: Record<string, number> = {}
    for (const [subjectId, values] of Object.entries(valuesBySubject)) {
      averages[subjectId] = values.reduce((sum, value) => sum + value, 0) / values.length
    }

    return averages
  }, [bacPeriods])

  const calculation = useMemo(
    () => calculateBacAverage(identifiedSubjects, pronoteAverages, terminalNotes),
    [identifiedSubjects, pronoteAverages, terminalNotes],
  )

  const progress = nextMentionProgress(calculation)
  const specialtyNames = getSpecialtyNames(identifiedSubjects)
  const warnings = identification?.warnings ?? []
  const warningSubjects = identifiedSubjects.filter((subject) => subject.confidence === 'basse')
  const hasWarnings = warnings.length > 0 || warningSubjects.length > 0
  const typeLabels: Record<BacSubjectType, string> = {
    tronc_commun_cc: t('subjectType.tronc_commun_cc'),
    specialite_terminale: t('subjectType.specialite_terminale'),
    specialite_abandonnee_1ere: t('subjectType.specialite_abandonnee_1ere'),
    terminal_hors_cc: t('subjectType.terminal_hors_cc'),
    option: t('subjectType.option'),
    inconnu: t('subjectType.inconnu'),
  }
  const mentionLabels: Record<BacMention, string> = {
    'Non admis': t('mention.Non admis'),
    Passable: t('mention.Passable'),
    'Assez bien': t('mention.Assez bien'),
    Bien: t('mention.Bien'),
    'Très bien': t('mention.Très bien'),
    Félicitations: t('mention.Félicitations'),
  }

  function updateTerminalNote(key: TerminalNoteKey, value: number | undefined) {
    setTerminalNotes((prev) => ({ ...prev, [key]: value }))
  }

  async function handleIdentify() {
    setIdentifying(true)
    try {
      const res = await fetch('/api/bac/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawData }),
      })
      const json = await res.json() as BacIdentificationResult | IdentifyError

      if ('error' in json) {
        toast.error(json.error || t('analysisError'))
        return
      }

      if (!res.ok) {
        toast.error(t('analysisError'))
        return
      }

      setIdentification(json)
    } catch {
      toast.error(t('analysisError'))
    } finally {
      setIdentifying(false)
    }
  }

  return (
    <section
      className="rounded-2xl border p-5 mb-6"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR }}>
            {t('simulation')}
          </p>
          <h2 className="text-xl font-semibold text-white">{t('estimatedAverage')}</h2>
        </div>
      </div>

      {!identification ? (
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
            {t('analysisDescription')}
          </p>
          <button
            type="button"
            onClick={handleIdentify}
            disabled={identifying}
            className="btn btn-primary"
            style={{ color: '#fff' }}
          >
            {identifying ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t('identifyingSubjects')}
              </>
            ) : (
              <>
                <Sparkles size={14} />
                {t('identifySubjects')}
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {hasWarnings && (
            <div
              className="flex gap-3 rounded-xl border px-4 py-3 text-sm"
              style={{ background: '#F59E0B10', borderColor: '#F59E0B30', color: '#92400E' }}
            >
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                {warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
                {warningSubjects.map((subject) => (
                  <p key={subject.pronoteId}>
                    {t('uncertainIdentification', {subject: subject.pronoteName})}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--surface-2)' }}>
                <tr className="text-left" style={{ color: 'var(--text-3)' }}>
                  <th className="px-4 py-3 font-semibold">{t('subject')}</th>
                  <th className="px-4 py-3 font-semibold">{t('type')}</th>
                  <th className="px-4 py-3 font-semibold">{t('coefficientShort')}</th>
                  <th className="px-4 py-3 font-semibold">{t('aggregatedAverage')}</th>
                  <th className="px-4 py-3 font-semibold">{t('confidence')}</th>
                </tr>
              </thead>
              <tbody>
                {identifiedSubjects.map((subject) => {
                  const average = pronoteAverages[subject.pronoteId]
                  return (
                    <tr key={subject.pronoteId} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-4 py-3 text-white">{subject.normalizedName}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-3)' }}>
                        {typeLabels[subject.type]}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-white">{subject.coefficient}</td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-2)' }}>
                        {average === undefined ? '-' : `${formatNumber(average)}/20`}
                      </td>
                      <td className="px-4 py-3">
                        <ConfidenceBadge confidence={subject.confidence} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">{t('estimatedDay')}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <NoteInput
                label={t('philosophy')}
                value={terminalNotes.philosophie}
                onChange={(value) => updateTerminalNote('philosophie', value)}
              />
              <NoteInput
                label={t('specialty', {number: specialtyNames[0] ?? '1'})}
                value={terminalNotes.specialite1}
                onChange={(value) => updateTerminalNote('specialite1', value)}
              />
              <NoteInput
                label={t('specialty', {number: specialtyNames[1] ?? '2'})}
                value={terminalNotes.specialite2}
                onChange={(value) => updateTerminalNote('specialite2', value)}
              />
              <NoteInput
                label={t('grandOral')}
                value={terminalNotes.grandOral}
                onChange={(value) => updateTerminalNote('grandOral', value)}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFrenchNotes((prev) => !prev)}
              className="flex items-center gap-2 text-xs font-semibold mt-4 transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-3)' }}
            >
              <ChevronDown size={13} className={showFrenchNotes ? '' : '-rotate-90'} />
              {t('knownFrenchNotes')}
            </button>

            {showFrenchNotes && (
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <NoteInput
                  label={t('writtenFrench')}
                  value={terminalNotes.francaisEcrit}
                  onChange={(value) => updateTerminalNote('francaisEcrit', value)}
                />
                <NoteInput
                  label={t('oralFrench')}
                  value={terminalNotes.francaisOral}
                  onChange={(value) => updateTerminalNote('francaisOral', value)}
                />
              </div>
            )}
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{
              background: `${MENTION_COLORS[calculation.mention]}10`,
              borderColor: `${MENTION_COLORS[calculation.mention]}35`,
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>
                  {t('estimatedAverageShort')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-5xl font-bold tabular-nums"
                    style={{ color: MENTION_COLORS[calculation.mention] }}
                  >
                    {formatNumber(calculation.average)}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-3)' }}>/20</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-white">{t('estimatedMention', {mention: mentionLabels[calculation.mention]})}</p>
                <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress.progress}%`,
                      background: MENTION_COLORS[calculation.mention],
                    }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
                  {t('progressTo', {mention: mentionLabels[progress.label as BacMention]})}
                </p>
              </div>
            </div>
            {!calculation.isComplete && (
              <p className="text-xs mt-4" style={{ color: 'var(--text-4)' }}>
                {t('partialEstimate', {count: calculation.totalCoefficients})}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
