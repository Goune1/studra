'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import {
  parseGrades,
  gradeAvgColor,
  type ParsedPeriod,
  type ParsedSubjectAverage,
  type ParsedGrade,
  type GradeValueStatus,
} from '@/lib/pronote/parse-grades'

const COLOR = '#1F4D3F'

interface GradesViewProps {
  rawData: unknown
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function GradeStatusLabel({ status }: { status: GradeValueStatus }) {
  if (status === 'normal') return null
  const label = status === 'absent' ? 'Absent' : status === 'not-rendered' ? 'Non rendu' : '-'
  return (
    <span className="italic text-xs" style={{ color: 'var(--text-4)' }}>
      {label}
    </span>
  )
}

function OverallBandeau({ period }: { period: ParsedPeriod }) {
  if (!period.overallAvg?.available) return null
  const avg = period.overallAvg.on20!
  const color = gradeAvgColor(avg)
  const isGood = avg >= 10

  return (
    <div
      className="rounded-2xl border p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{
        background: `${color}10`,
        borderColor: `${color}30`,
      }}
    >
      <div className="flex items-baseline gap-3">
        <span
          className="text-5xl font-bold tabular-nums"
          style={{ color, fontVariantNumeric: 'tabular-nums' }}
        >
          {period.overallAvg.display}
        </span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>
          /20
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
          Moyenne générale {isGood ? ': bien' : ': en difficulté'}
        </span>
        {period.classAvg?.available && (
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
            Moyenne de classe : {period.classAvg.display}/20
          </span>
        )}
      </div>
    </div>
  )
}

function SubjectCard({
  subject,
  isSelected,
  onToggle,
}: {
  subject: ParsedSubjectAverage
  isSelected: boolean
  onToggle: () => void
}) {
  const avg = subject.studentAvg.on20
  const color = avg !== null && subject.studentAvg.available ? gradeAvgColor(avg) : 'var(--text-4)'

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border text-left transition-all duration-150 hover:-translate-y-0.5"
      style={{
        background: 'var(--surface)',
        borderColor: isSelected ? COLOR + '40' : 'var(--border)',
      }}
    >
      {/* Subject name + averages */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate leading-snug">
          {subject.subjectName}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
          {subject.classAvg.available && (
            <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>
              Classe : {subject.classAvg.display}/20
            </span>
          )}
          {subject.minAvg.available && subject.maxAvg.available && (
            <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>
              Min {subject.minAvg.display} - Max {subject.maxAvg.display}
            </span>
          )}
        </div>
      </div>

      {/* Student average */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: subject.studentAvg.available ? color : 'var(--text-4)' }}
          >
            {subject.studentAvg.display}
          </span>
          {subject.studentAvg.available && (
            <span className="text-xs ml-0.5" style={{ color: 'var(--text-4)' }}>
              /20
            </span>
          )}
        </div>
        {isSelected ? (
          <ChevronDown size={14} style={{ color: 'var(--text-3)' }} />
        ) : (
          <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />
        )}
      </div>
    </button>
  )
}

function GradeRow({ grade }: { grade: ParsedGrade }) {
  const isNormal = grade.status === 'normal'

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Date + comment */}
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: 'var(--text-4)' }}>
          {formatDate(grade.date)}
        </p>
        {grade.comment && (
          <p className="text-sm mt-0.5 leading-snug" style={{ color: 'var(--text-2)' }}>
            {grade.comment}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {grade.coefficient !== 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--border)', color: 'var(--text-3)' }}>
              coeff. {grade.coefficient}
            </span>
          )}
          {grade.isOptional && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#6366F115', color: '#818CF8', border: '1px solid #6366F130' }}>
              Optionnel
            </span>
          )}
          {grade.isBonus && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#22C55E15', color: '#10B981', border: '1px solid #22C55E30' }}>
              Bonus
            </span>
          )}
          {grade.classAvgDisplay !== '-' && (
            <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>
              Classe : {grade.classAvgDisplay}
            </span>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="shrink-0 text-right">
        {isNormal ? (
          <span
            className="text-base font-bold tabular-nums"
            style={{
              color:
                grade.valuePoints !== null && grade.outOfPoints !== null
                  ? gradeAvgColor((grade.valuePoints / grade.outOfPoints) * 20)
                  : 'var(--text-1)',
            }}
          >
            {grade.valueDisplay}
          </span>
        ) : (
          <GradeStatusLabel status={grade.status} />
        )}
      </div>
    </div>
  )
}

function SubjectDetail({
  subject,
  grades,
}: {
  subject: ParsedSubjectAverage
  grades: ParsedGrade[]
}) {
  const sorted = [...grades].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  return (
    <div
      className="rounded-2xl border px-5 pt-4 pb-2 mb-2"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
        Notes - {subject.subjectName}
      </p>
      {sorted.length === 0 ? (
        <p className="text-xs pb-3" style={{ color: 'var(--text-4)' }}>
          Aucune note pour cette période.
        </p>
      ) : (
        sorted.map((g) => <GradeRow key={g.id} grade={g} />)
      )}
    </div>
  )
}

export function GradesView({ rawData }: GradesViewProps) {
  const periods = parseGrades(rawData)

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => periods[0]?.id ?? '')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)

  if (periods.length === 0) return null

  const period: ParsedPeriod = periods.find((p) => p.id === selectedPeriodId) ?? periods[0]

  function toggleSubject(id: string) {
    setSelectedSubjectId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-5">
      {/* Header section */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
          Notes par période
        </p>

        {/* Period pills */}
        {periods.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {periods.map((p) => {
              const active = p.id === period.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPeriodId(p.id)
                    setSelectedSubjectId(null)
                  }}
                  className="text-[11px] px-3 py-1.5 rounded-full font-semibold transition-all"
                  style={{
                    background: active ? COLOR + '20' : 'var(--surface)',
                    color: active ? COLOR : 'var(--text-4)',
                    border: `1px solid ${active ? COLOR + '40' : 'var(--border)'}`,
                  }}
                >
                  {p.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Overall average */}
      <OverallBandeau period={period} />

      {/* Subjects */}
      {period.subjects.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>
          Aucune matière disponible pour cette période.
        </p>
      ) : (
        <div className="space-y-2">
          {period.subjects.map((subject) => {
            const isSelected = selectedSubjectId === subject.subjectId
            const subjectGrades = period.grades.filter(
              (g) => g.subjectId === subject.subjectId,
            )

            return (
              <div key={subject.subjectId}>
                <SubjectCard
                  subject={subject}
                  isSelected={isSelected}
                  onToggle={() => toggleSubject(subject.subjectId)}
                />
                {isSelected && (
                  <div className="mt-2">
                    <SubjectDetail subject={subject} grades={subjectGrades} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
