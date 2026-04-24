'use client'

import Link from 'next/link'

export type AlsoKey = 'fiche' | 'flashcards' | 'schema' | 'exam' | 'timeline'

export type ResultColor = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose'

interface TypeConfig {
  label: string
  icon: string
  pillColorClass: string
  apiPath: string
  idField: string
  viewPath: (id: string) => string
  description: string
  resultColor: ResultColor
}

export const CONTENT_TYPES: Record<AlsoKey, TypeConfig> = {
  fiche: {
    label: 'Fiche de révision',
    icon: '📋',
    pillColorClass:
      'bg-violet-500/10 border-violet-500/25 text-violet-300 data-[on=true]:bg-violet-500/25 data-[on=true]:border-violet-500/60 data-[on=true]:text-violet-200',
    apiPath: '/api/generate/fiche',
    idField: 'ficheId',
    viewPath: (id) => `/fiches/${id}`,
    description: 'Résumé structuré, notions clés et points importants',
    resultColor: 'violet',
  },
  flashcards: {
    label: 'Flashcards',
    icon: '🃏',
    pillColorClass:
      'bg-blue-500/10 border-blue-500/25 text-blue-300 data-[on=true]:bg-blue-500/25 data-[on=true]:border-blue-500/60 data-[on=true]:text-blue-200',
    apiPath: '/api/generate/flashcards',
    idField: 'deckId',
    viewPath: (id) => `/flashcards/${id}`,
    description: 'Cartes question-réponse pour la mémorisation active',
    resultColor: 'blue',
  },
  schema: {
    label: 'Schéma conceptuel',
    icon: '🕸️',
    pillColorClass:
      'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 data-[on=true]:bg-emerald-500/25 data-[on=true]:border-emerald-500/60 data-[on=true]:text-emerald-200',
    apiPath: '/api/generate/schema',
    idField: 'schemaId',
    viewPath: (id) => `/schemas/${id}`,
    description: 'Carte mentale interactive des concepts et relations',
    resultColor: 'emerald',
  },
  exam: {
    label: 'Examen simulé',
    icon: '📝',
    pillColorClass:
      'bg-amber-500/10 border-amber-500/25 text-amber-300 data-[on=true]:bg-amber-500/25 data-[on=true]:border-amber-500/60 data-[on=true]:text-amber-200',
    apiPath: '/api/generate/exam',
    idField: 'examId',
    viewPath: (id) => `/exams/${id}`,
    description: '7 QCM + 3 questions ouvertes avec corrections',
    resultColor: 'amber',
  },
  timeline: {
    label: 'Frise chronologique',
    icon: '📅',
    pillColorClass:
      'bg-rose-500/10 border-rose-500/25 text-rose-300 data-[on=true]:bg-rose-500/25 data-[on=true]:border-rose-500/60 data-[on=true]:text-rose-200',
    apiPath: '/api/generate/timeline',
    idField: 'timelineId',
    viewPath: (id) => `/timelines/${id}`,
    description: 'Événements organisés sur une ligne du temps',
    resultColor: 'rose',
  },
}

// ─── Also Generate pills ────────────────────────────────────────────────────

interface AlsoGenerateSectionProps {
  options: AlsoKey[]
  selected: Set<AlsoKey>
  onChange: (key: AlsoKey) => void
}

export function AlsoGenerateSection({ options, selected, onChange }: AlsoGenerateSectionProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-medium text-gray-300 mb-3">Générer aussi depuis ce contenu</p>
      <div className="flex flex-wrap gap-2">
        {options.map((key) => {
          const { label, icon, pillColorClass } = CONTENT_TYPES[key]
          const on = selected.has(key)
          return (
            <button
              key={key}
              type="button"
              data-on={on ? 'true' : 'false'}
              onClick={() => onChange(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${pillColorClass}`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              {on && <span className="opacity-60 text-xs">✓</span>}
            </button>
          )
        })}
      </div>
      {selected.size > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          Tout sera généré en parallèle depuis le même contenu.
        </p>
      )}
    </div>
  )
}

// ─── Results screen ──────────────────────────────────────────────────────────

export interface GeneratedResource {
  href: string
  icon: string
  title: string
  description: string
  color: ResultColor
}

const resultBorder: Record<ResultColor, string> = {
  violet: 'border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/5',
  blue: 'border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5',
  emerald: 'border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5',
  amber: 'border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5',
  rose: 'border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/5',
}

interface GenerationResultsScreenProps {
  resources: GeneratedResource[]
  newPath: string
  newLabel?: string
}

export function GenerationResultsScreen({ resources, newPath, newLabel = 'Créer un autre contenu' }: GenerationResultsScreenProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold">Contenu généré !</h1>
        <p className="text-gray-400 mt-1">
          {resources.length > 1
            ? `${resources.length} ressources créées depuis votre source.`
            : 'Votre ressource a été créée avec succès.'}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {resources.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className={`flex items-center gap-4 p-5 rounded-2xl bg-white/5 border ${resultBorder[r.color]} transition-all group`}
          >
            <span className="text-3xl">{r.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{r.title}</p>
              <p className="text-sm text-gray-400 mt-0.5">{r.description}</p>
            </div>
            <span className="text-gray-500 group-hover:text-white transition-colors text-lg">→</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link href={newPath} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          ← {newLabel}
        </Link>
      </div>
    </div>
  )
}

// ─── Shared generation helper ────────────────────────────────────────────────

interface FormData {
  title: string
  subject: string
  content: string
  language: string
}

export async function generateWithAlso(
  primaryKey: AlsoKey,
  alsoKeys: AlsoKey[],
  data: FormData,
  onPartialError: (msg: string) => void,
): Promise<{ primary: { ok: boolean; id?: string }; also: { key: AlsoKey; ok: boolean; id?: string }[] }> {
  const allKeys = [primaryKey, ...alsoKeys]
  const responses = await Promise.all(
    allKeys.map((key) =>
      fetch(CONTENT_TYPES[key].apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async (r) => ({ key, ok: r.ok, json: await r.json() })),
    ),
  )

  const [primaryRes, ...alsoRes] = responses

  alsoRes.forEach(({ key, ok, json }) => {
    if (!ok) onPartialError(json.error ?? `Erreur lors de la génération des ${CONTENT_TYPES[key].label.toLowerCase()}`)
  })

  return {
    primary: {
      ok: primaryRes.ok,
      id: primaryRes.ok ? primaryRes.json[CONTENT_TYPES[primaryKey].idField] : undefined,
    },
    also: alsoRes.map(({ key, ok, json }) => ({
      key,
      ok,
      id: ok ? json[CONTENT_TYPES[key].idField] : undefined,
    })),
  }
}

export function buildResources(
  primaryKey: AlsoKey,
  primaryId: string,
  alsoResults: { key: AlsoKey; ok: boolean; id?: string }[],
): GeneratedResource[] {
  const resources: GeneratedResource[] = []
  const addResource = (key: AlsoKey, id: string) => {
    const cfg = CONTENT_TYPES[key]
    resources.push({
      href: cfg.viewPath(id),
      icon: cfg.icon,
      title: cfg.label,
      description: cfg.description,
      color: cfg.resultColor,
    })
  }
  addResource(primaryKey, primaryId)
  alsoResults.forEach(({ key, ok, id }) => { if (ok && id) addResource(key, id) })
  return resources
}
