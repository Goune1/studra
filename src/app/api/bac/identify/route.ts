import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { aiRateLimitResponse, checkAiRateLimit } from '@/lib/ai-rate-limit'
import type {
  BacCoefficientKey,
  BacConfidence,
  BacIdentificationResult,
  IdentifiedSubject,
  BacSubjectType,
} from '@/lib/bac/calculator'
import { BAC_COEFFICIENTS_CC, BAC_COEFFICIENTS_TERMINAL } from '@/lib/bac/coefficients'
import type { RawPeriod } from '@/lib/pronote/parse-grades'

export const runtime = 'nodejs'

const openai = new OpenAI()
const MAX_SUBJECTS = 20

interface SubjectCandidate {
  id: string
  name: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function extractSubject(subject: unknown): SubjectCandidate | null {
  if (!isRecord(subject)) return null
  const id = subject.id
  const name = subject.name
  if (typeof id !== 'string' || typeof name !== 'string') return null
  return { id, name }
}

function extractSubjectNames(rawData: RawPeriod[]): SubjectCandidate[] {
  const subjects = new Map<string, SubjectCandidate>()

  for (const period of rawData) {
    for (const average of period.subjectsAverages ?? []) {
      const subject = extractSubject(average.subject)
      if (subject) subjects.set(subject.id, subject)
    }

    for (const grade of period.grades ?? []) {
      const subject = extractSubject(grade.subject)
      if (subject) subjects.set(subject.id, subject)
    }
  }

  return [...subjects.values()]
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function toConfidence(value: unknown): BacConfidence {
  if (value === 'haute' || value === 'moyenne' || value === 'basse') return value
  return 'basse'
}

function toSubjectType(value: unknown): BacSubjectType {
  if (
    value === 'tronc_commun_cc' ||
    value === 'specialite_terminale' ||
    value === 'specialite_abandonnee_1ere' ||
    value === 'terminal_hors_cc' ||
    value === 'option' ||
    value === 'inconnu'
  ) {
    return value
  }
  return 'inconnu'
}

function toCoefficientKey(value: unknown): BacCoefficientKey {
  if (
    value === 'histoire_geo' ||
    value === 'lv_a' ||
    value === 'lv_b' ||
    value === 'enseignement_scientifique' ||
    value === 'eps' ||
    value === 'emc' ||
    value === 'specialite_1' ||
    value === 'specialite_2' ||
    value === 'specialite_abandonnee' ||
    value === 'philosophie' ||
    value === 'francais'
  ) {
    return value
  }
  return 'inconnu'
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isPhilosophy(subject: Pick<IdentifiedSubject, 'normalizedName' | 'pronoteName' | 'coefficientKey'>): boolean {
  const name = normalizeSearch(`${subject.normalizedName} ${subject.pronoteName}`)
  return subject.coefficientKey === 'philosophie' || name.includes('philosophie')
}

function isFrench(subject: Pick<IdentifiedSubject, 'normalizedName' | 'pronoteName' | 'coefficientKey'>): boolean {
  const name = normalizeSearch(`${subject.normalizedName} ${subject.pronoteName}`)
  return subject.coefficientKey === 'francais' || name.includes('francais')
}

function coefficientFor(type: BacSubjectType, key: BacCoefficientKey): number {
  if (key === 'histoire_geo') return BAC_COEFFICIENTS_CC.histoire_geo
  if (key === 'lv_a') return BAC_COEFFICIENTS_CC.lv_a
  if (key === 'lv_b') return BAC_COEFFICIENTS_CC.lv_b
  if (key === 'enseignement_scientifique') return BAC_COEFFICIENTS_CC.enseignement_scientifique
  if (key === 'eps') return BAC_COEFFICIENTS_CC.eps
  if (key === 'emc') return BAC_COEFFICIENTS_CC.emc
  if (key === 'specialite_abandonnee') return BAC_COEFFICIENTS_CC.specialite_abandonnee
  if (key === 'specialite_1') return BAC_COEFFICIENTS_TERMINAL.specialite_1
  if (key === 'specialite_2') return BAC_COEFFICIENTS_TERMINAL.specialite_2
  if (key === 'philosophie') return BAC_COEFFICIENTS_TERMINAL.philosophie
  if (key === 'francais') return BAC_COEFFICIENTS_TERMINAL.francais_ecrit + BAC_COEFFICIENTS_TERMINAL.francais_oral
  if (type === 'specialite_terminale') return BAC_COEFFICIENTS_TERMINAL.specialite_1
  if (type === 'specialite_abandonnee_1ere') return BAC_COEFFICIENTS_CC.specialite_abandonnee
  return 0
}

function normalizeSubject(subject: IdentifiedSubject): IdentifiedSubject {
  if (isPhilosophy(subject)) {
    return {
      ...subject,
      normalizedName: 'Philosophie',
      type: 'terminal_hors_cc',
      coefficientKey: 'philosophie',
      coefficient: BAC_COEFFICIENTS_TERMINAL.philosophie,
    }
  }

  if (isFrench(subject)) {
    return {
      ...subject,
      normalizedName: 'Français',
      type: 'terminal_hors_cc',
      coefficientKey: 'francais',
      coefficient: BAC_COEFFICIENTS_TERMINAL.francais_ecrit + BAC_COEFFICIENTS_TERMINAL.francais_oral,
    }
  }

  return {
    ...subject,
    coefficient: coefficientFor(subject.type, subject.coefficientKey),
  }
}

function normalizeIdentification(value: unknown): BacIdentificationResult | null {
  if (!isRecord(value)) return null
  if (!Array.isArray(value.subjects)) return null

  const subjects = value.subjects
    .filter(isRecord)
    .map((subject) => ({
      pronoteId: typeof subject.pronoteId === 'string' ? subject.pronoteId : '',
      pronoteName: typeof subject.pronoteName === 'string' ? subject.pronoteName : '',
      normalizedName: typeof subject.normalizedName === 'string' ? subject.normalizedName : 'Matière inconnue',
      type: toSubjectType(subject.type),
      coefficientKey: toCoefficientKey(subject.coefficientKey),
      coefficient: typeof subject.coefficient === 'number' ? subject.coefficient : 0,
      confidence: toConfidence(subject.confidence),
      notes: typeof subject.notes === 'string' ? subject.notes : undefined,
    }))
    .filter((subject) => subject.pronoteId !== '')
    .map(normalizeSubject)

  const detectedSpecialties = subjects
    .filter((subject) => subject.type === 'specialite_terminale')
    .filter((subject) => !isPhilosophy(subject) && !isFrench(subject))
    .map((subject) => subject.normalizedName)
    .slice(0, 2)

  return {
    subjects,
    detectedSpecialties: detectedSpecialties.length > 0
      ? detectedSpecialties
      : isStringArray(value.detectedSpecialties)
        ? value.detectedSpecialties.filter((name) => !isPhilosophy({ normalizedName: name, pronoteName: name, coefficientKey: 'inconnu' }) && !isFrench({ normalizedName: name, pronoteName: name, coefficientKey: 'inconnu' })).slice(0, 2)
        : [],
    warnings: isStringArray(value.warnings) ? value.warnings : [],
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const rateLimit = await checkAiRateLimit(user.id, 'bac-identify')
  if (!rateLimit.allowed) {
    return NextResponse.json(aiRateLimitResponse(rateLimit.reason), { status: 429 })
  }

  let body: { rawData?: unknown }
  try {
    body = await request.json() as { rawData?: unknown }
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  if (!Array.isArray(body.rawData)) {
    return NextResponse.json({ error: 'Données Pronote invalides' }, { status: 400 })
  }

  const rawData = body.rawData as RawPeriod[]
  const subjectNames = extractSubjectNames(rawData).slice(0, MAX_SUBJECTS)

  if (subjectNames.length === 0) {
    return NextResponse.json({ error: 'Aucune matière Pronote détectée' }, { status: 400 })
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Tu es un expert du système éducatif français et du baccalauréat général. Tu reçois la liste des matières d\'un lycéen sous forme de noms bruts extraits de Pronote. Ces noms peuvent être abrégés, mal formatés ou légèrement différents selon les établissements. Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, sans texte avant ou après.',
        },
        {
          role: 'user',
          content: `Voici les matières extraites de Pronote pour ce lycéen :
${JSON.stringify(subjectNames)}
La liste officielle des 13 spécialités possibles au bac général 2026 est :

Mathématiques
Physique-Chimie
Sciences de la Vie et de la Terre (SVT)
Histoire-Géographie, Géopolitique et Sciences Politiques (HGGSP)
Sciences Économiques et Sociales (SES)
Numérique et Sciences Informatiques (NSI)
Humanités, Littérature et Philosophie (HLP)
Langues, Littératures et Cultures Étrangères et Régionales (LLCER)
Langues et Cultures de l'Antiquité (LCA - Latin/Grec)
Arts (Arts plastiques, Musique, Théâtre, Cinéma, Danse, Histoire des arts)
Éducation Physique, Pratiques et Cultures Sportives (EPPCS)
Biologie-Écologie
Sciences et Technologies du Management et de la Gestion (STMG) (voie techno)

Les matières du tronc commun évaluées en contrôle continu sont :
Histoire-Géographie, Langues Vivantes A et B, Enseignement Scientifique,
EPS, EMC (Enseignement Moral et Civique).
Les matières avec épreuve terminale sont :
Philosophie, Français (écrit + oral en 1re), Grand Oral.
Pour chaque matière de la liste Pronote, identifie :

Son nom normalisé en français
Son type : "tronc_commun_cc" | "specialite_terminale" |
"specialite_abandonnee_1ere" | "terminal_hors_cc" | "option" | "inconnu"
Son identifiant de mapping pour les coefficients :
"histoire_geo" | "lv_a" | "lv_b" | "enseignement_scientifique" |
"eps" | "emc" | "specialite_1" | "specialite_2" |
"specialite_abandonnee" | "philosophie" | "francais" | "inconnu"
Le coefficient applicable selon le bac général 2026
Ta confiance dans l'identification : "haute" | "moyenne" | "basse"

Pour les spécialités terminales : il ne peut y en avoir QUE 2 maximum
conservées en terminale. Si tu détectes plus de 2 candidates, marque
les moins probables comme "specialite_abandonnee_1ere".
Réponds avec ce JSON exact :
{
"subjects": [
{
"pronoteId": "id de la matière dans les données source",
"pronoteName": "nom brut dans Pronote",
"normalizedName": "nom normalisé",
"type": "tronc_commun_cc",
"coefficientKey": "histoire_geo",
"coefficient": 6,
"confidence": "haute",
"notes": "explication courte si nécessaire"
}
],
"detectedSpecialties": ["nom spécialité 1", "nom spécialité 2"],
"warnings": ["avertissement si quelque chose est ambigu"]
}`,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'OpenAI n\'a retourné aucune réponse' }, { status: 500 })
    }

    try {
      const parsed = JSON.parse(content) as unknown
      const normalized = normalizeIdentification(parsed)
      if (!normalized) {
        return NextResponse.json(
          { error: 'OpenAI a retourné un JSON incomplet pour l\'identification des matières' },
          { status: 500 },
        )
      }

      return NextResponse.json(normalized)
    } catch {
      return NextResponse.json(
        { error: 'OpenAI a retourné une réponse qui n\'est pas un JSON valide' },
        { status: 500 },
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Impossible d\'identifier les matières pour le bac' },
      { status: 500 },
    )
  }
}
