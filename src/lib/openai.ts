import OpenAI from 'openai'
import type {
  SchemaData, TimelineData, ExamQuestion, SocrateMessage, LacuneCard,
  FeynmanDiagnosis, FreeRecallEvaluation, DetectedExamStyle, AnnaleQuestion, AnnaleAnswer,
} from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'French', en: 'English', es: 'Spanish', de: 'German',
  it: 'Italian', pt: 'Portuguese', ar: 'Arabic', zh: 'Chinese', ja: 'Japanese',
}

function langInstruction(language: string): string {
  if (language === 'fr') return ''
  const name = LANGUAGE_NAMES[language] ?? 'French'
  return `\n\nIMPORTANT: Generate ALL content in ${name}.`
}

export async function generateFlashcards(content: string, language = 'fr'): Promise<Array<{ question: string; answer: string }>> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: `Tu es un assistant pédagogique expert. À partir du contenu de cours fourni par l'étudiant, génère un set de flashcards de révision.

Règles :
- Génère entre 10 et 25 flashcards selon la densité du contenu
- Chaque flashcard a une "question" (recto) et une "answer" (verso)
- Les questions doivent couvrir les concepts clés, définitions, dates importantes, formules, et relations causales
- Varie les types de questions : définitions, QCM mentaux, "vrai ou faux" implicites, "expliquez..."
- Les réponses doivent être concises mais complètes (2-3 phrases max)
- Adapte le niveau de difficulté au contenu fourni

Réponds UNIQUEMENT en JSON valide avec ce format :
{
  "cards": [
    { "question": "...", "answer": "..." }
  ]
}${langInstruction(language)}`,
      },
      { role: 'user', content },
    ],
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content!) as { cards: Array<{ question: string; answer: string }> }
  return result.cards
}

export async function generateFiche(content: string, language = 'fr'): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: `Tu es un assistant pédagogique expert. À partir du contenu fourni, génère une fiche de révision complète et structurée.

La fiche doit contenir :
- Un titre clair
- Un résumé en 3-5 lignes du chapitre
- Les notions clés (avec définitions)
- Les points importants détaillés, organisés par sous-thèmes
- Les dates / chiffres / formules importants mis en évidence
- Un "À retenir" final avec les 5 points essentiels

Formate la fiche en Markdown riche (titres ##, listes, **gras**, etc.).
La fiche doit être détaillée et exploitable directement pour réviser.${langInstruction(language)}`,
      },
      { role: 'user', content },
    ],
  })

  return response.choices[0].message.content!
}

export async function generateSchema(content: string, language = 'fr'): Promise<SchemaData> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: `Tu es un assistant pédagogique expert en schématisation. À partir du contenu de cours fourni, génère un schéma explicatif structuré montrant les relations entre les concepts.

Règles :
- Identifie les concepts clés et leurs relations (cause/effet, inclusion, opposition, chronologie, etc.)
- Crée des nœuds clairs avec des labels courts (2-5 mots par nœud)
- Les connexions entre nœuds doivent avoir un label décrivant la relation
- Organise les nœuds de manière logique (hiérarchique, en flux, ou en réseau selon le sujet)
- Maximum 15 nœuds pour rester lisible
- Attribue une couleur : "primary" pour le concept racine, "accent" pour les concepts pivots importants, "neutral" pour le reste
- Positionne les nœuds avec des coordonnées x/y espacées (minimum 220px horizontal, 120px vertical) pour éviter les chevauchements

Réponds UNIQUEMENT en JSON valide avec ce format :
{
  "nodes": [
    { "id": "1", "label": "Concept principal", "x": 0, "y": 0, "color": "primary" }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "label": "entraîne" }
  ]
}${langInstruction(language)}`,
      },
      { role: 'user', content },
    ],
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content!) as SchemaData
  return result
}

export async function generateTimeline(content: string, language = 'fr'): Promise<TimelineData> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: `Tu es un assistant pédagogique expert en histoire et chronologie. À partir du contenu fourni, génère une frise chronologique structurée.

Règles :
- Identifie tous les événements datés ou datables dans le contenu
- Chaque événement a une date (ou période), un titre court, et une description (2-3 phrases)
- Classe les événements par ordre chronologique
- Attribue une catégorie thématique à chaque événement (politique, economique, social, culturel, militaire, etc.)
- Si des périodes longues sont mentionnées, les inclure comme événement de type "period"
- Génère entre 5 et 20 événements selon la densité du contenu

Réponds UNIQUEMENT en JSON valide avec ce format :
{
  "title": "Titre de la frise",
  "events": [
    {
      "id": "1",
      "date": "1789",
      "end_date": null,
      "type": "event",
      "title": "Prise de la Bastille",
      "description": "Le 14 juillet 1789...",
      "category": "politique"
    }
  ]
}${langInstruction(language)}`,
      },
      { role: 'user', content },
    ],
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content!) as TimelineData
  return result
}

export async function generateExam(content: string, language = 'fr'): Promise<ExamQuestion[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: `Tu es un professeur expert. À partir du contenu fourni, génère un examen de 10 questions : 7 QCM et 3 questions ouvertes.

Pour les QCM :
- 4 options de réponse (texte complet, pas juste A/B/C/D)
- correct_index est l'index (0-3) de la bonne réponse
- Une explication courte de la bonne réponse

Pour les questions ouvertes :
- Une question nécessitant une réponse développée
- model_answer : la réponse modèle complète
- keywords : 3-5 mots-clés que la réponse doit contenir

Réponds UNIQUEMENT en JSON valide :
{
  "questions": [
    {
      "id": "1",
      "type": "mcq",
      "question": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "..."
    },
    {
      "id": "8",
      "type": "open",
      "question": "...",
      "model_answer": "...",
      "keywords": ["mot1", "mot2", "mot3"]
    }
  ]
}${langInstruction(language)}`,
      },
      { role: 'user', content },
    ],
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content!) as { questions: ExamQuestion[] }
  return result.questions
}

export async function evaluateOpenAnswer(
  question: string,
  modelAnswer: string,
  keywords: string[],
  userAnswer: string,
): Promise<{ score: number; feedback: string }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: `Tu es un correcteur pédagogique. Évalue la réponse d'un étudiant à une question ouverte.

Critères :
- score : de 0 à 1 (0 = hors sujet, 0.5 = partiellement correct, 1 = excellent)
- Vérifie si la réponse contient les concepts clés attendus
- feedback : 1-2 phrases constructives (ce qui est bien + ce qui manque)

Réponds en JSON :
{
  "score": 0.8,
  "feedback": "..."
}`,
      },
      {
        role: 'user',
        content: `Question: ${question}\nRéponse modèle: ${modelAnswer}\nMots-clés attendus: ${keywords.join(', ')}\nRéponse étudiant: ${userAnswer}`,
      },
    ],
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content!) as { score: number; feedback: string }
}

export async function explainDifferently(
  question: string,
  answer: string,
  style: 'analogy' | 'example' | 'simple' | 'stepbystep',
): Promise<string> {
  const stylePrompts = {
    analogy: 'en utilisant une analogie créative et mémorable avec quelque chose du quotidien',
    example: 'en donnant un exemple concret et détaillé du monde réel',
    simple: "comme si tu expliquais à un enfant de 10 ans, avec des mots très simples",
    stepbystep: 'étape par étape, en décomposant le concept en micro-étapes numérotées',
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: `Tu es un tuteur pédagogique expert. Réexplique le concept suivant ${stylePrompts[style]}.
Sois clair, engageant et mémorable. Réponds en 3-5 phrases maximum.`,
      },
      {
        role: 'user',
        content: `Question : ${question}\nRéponse originale : ${answer}`,
      },
    ],
  })

  return response.choices[0].message.content!
}

export async function analyzeLacunes(lacunes: LacuneCard[]): Promise<{
  diagnostic: { summary: string; bullets: string[] }
  conseils: Array<{ icon: string; title: string; description: string }>
  encouragement: string
}> {
  const cardsText = lacunes
    .map((c) => `- "${c.question}" (raté ${c.wrong_count}/${c.total_count} fois)`)
    .join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Tu es un coach pédagogique. Analyse les lacunes d'un étudiant basé sur les cartes qu'il rate le plus souvent.

Réponds UNIQUEMENT en JSON avec ce format exact :
{
  "diagnostic": {
    "summary": "une phrase résumant le pattern principal",
    "bullets": ["observation 1", "observation 2", "observation 3"]
  },
  "conseils": [
    { "icon": "BookOpen", "title": "titre court", "description": "conseil actionnable" },
    { "icon": "Repeat", "title": "titre court", "description": "conseil actionnable" },
    { "icon": "Link", "title": "titre court", "description": "conseil actionnable" }
  ],
  "encouragement": "une phrase d'encouragement"
}

Les icônes disponibles sont : BookOpen, Repeat, Link, Users.`,
      },
      {
        role: 'user',
        content: `Voici les flashcards que l'étudiant rate le plus :\n${cardsText}`,
      },
    ],
  })

  return JSON.parse(response.choices[0].message.content!)
}

// ── Socrate ───────────────────────────────────────────────────────

export async function socrateResponse(
  content: string,
  history: SocrateMessage[],
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: `Tu es Socrate, le philosophe grec. Un étudiant va t'expliquer un cours en utilisant la méthode maïeutique.

Le sujet du cours :
---
${content.slice(0, 3000)}
---

Règles ABSOLUES :
- Utilise la maïeutique : pose des questions qui poussent l'étudiant à approfondir, préciser et justifier sa pensée.
- Ne donne JAMAIS la réponse ni une explication directe.
- Soulève des contradictions, des cas limites, des imprécisions dans les explications de l'étudiant.
- Si l'étudiant utilise un terme sans le définir, demande-lui ce qu'il entend exactement par là.
- Si l'explication est incomplète, demande ce qui se passe dans tel cas particulier.
- Reformule parfois ce que tu as compris pour vérifier et inviter l'étudiant à corriger ou compléter.
- Garde tes messages courts (2-3 phrases max), sous forme de questions incisives.
- Commence par inviter l'étudiant à t'expliquer le sujet dans ses propres mots.`,
      },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ],
  })

  return response.choices[0].message.content!
}

export async function socrateDiagnosis(
  content: string,
  history: SocrateMessage[],
): Promise<FeynmanDiagnosis> {
  const conversation = history
    .map((m) => `${m.role === 'user' ? 'Étudiant' : 'Socrate'}: ${m.content}`)
    .join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Tu es un expert pédagogique. Analyse la session d'apprentissage par la méthode socratique ci-dessous.
L'étudiant devait expliquer et défendre sa compréhension face aux questions de Socrate. Évalue la qualité et la profondeur de ses explications.

Réponds UNIQUEMENT en JSON avec ce format :
{
  "clarity_score": 72,
  "well_explained": ["notion 1 bien expliquée", "notion 2 bien expliquée"],
  "still_unclear": ["notion qui est restée floue", "concept mal maîtrisé"],
  "best_explanation": "Extrait de la meilleure explication de l'étudiant (citation directe)",
  "suggestions": ["Relire la partie sur X", "Revoir la définition de Y"]
}`,
      },
      {
        role: 'user',
        content: `Cours source :\n${content.slice(0, 2000)}\n\nSession :\n${conversation.slice(0, 4000)}`,
      },
    ],
  })

  return JSON.parse(response.choices[0].message.content!) as FeynmanDiagnosis
}

// ── Free Recall ───────────────────────────────────────────────────

export async function evaluateFreeRecall(
  sourceContent: string,
  userText: string,
): Promise<FreeRecallEvaluation> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Tu es un évaluateur pédagogique expert. Un étudiant a écrit de mémoire tout ce qu'il savait sur un sujet.
Compare sa réponse au contenu source et évalue sa complétude.

Réponds UNIQUEMENT en JSON avec ce format :
{
  "score": 68,
  "notions_couvertes": ["notion mentionnée correctement", "..."],
  "notions_oubliees": ["notion importante absente", "..."],
  "erreurs": ["affirmation inexacte ou incomplète", "..."],
  "flashcards_suggerees": [
    { "question": "Question sur une notion oubliée", "answer": "Réponse concise" }
  ]
}

- score : 0-100, proportion de notions clés couvertes correctement
- notions_couvertes : notions du cours correctement mentionnées (max 8)
- notions_oubliees : notions importantes du cours absentes (max 6)
- erreurs : formulations inexactes ou incomplètes (max 4)
- flashcards_suggerees : 3-5 flashcards sur les notions les plus importantes oubliées`,
      },
      {
        role: 'user',
        content: `Contenu source :\n${sourceContent.slice(0, 3000)}\n\nRéponse de l'étudiant :\n${userText}`,
      },
    ],
  })

  return JSON.parse(response.choices[0].message.content!) as FreeRecallEvaluation
}

// ── Annales ───────────────────────────────────────────────────────

export async function analyzeExamStyle(examText: string): Promise<DetectedExamStyle> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en ingénierie pédagogique. Analyse le format et le style de cet examen.

Réponds UNIQUEMENT en JSON avec ce format :
{
  "question_types": ["mcq", "open"],
  "total_questions": 10,
  "difficulty": "intermediate",
  "topics": ["thème principal 1", "thème principal 2"],
  "format_notes": "Description concise du format : structure, longueur des réponses attendues, style...",
  "has_scoring": true
}

- question_types : parmi "mcq" (QCM), "open" (question ouverte), "cas_pratique" (cas pratique)
- difficulty : "easy", "intermediate", ou "hard"
- format_notes : 2-3 phrases décrivant le style de l'examen pour pouvoir le reproduire`,
      },
      { role: 'user', content: examText.slice(0, 8000) },
    ],
  })

  return JSON.parse(response.choices[0].message.content!) as DetectedExamStyle
}

export async function generateFromTemplate(
  style: DetectedExamStyle,
  courseContent: string,
  title: string,
): Promise<{ questions: AnnaleQuestion[]; answers: AnnaleAnswer[] }> {
  const styleDescription = `
- Types de questions : ${style.question_types.join(', ')}
- Nombre total de questions : ${style.total_questions}
- Difficulté : ${style.difficulty}
- Thèmes couverts : ${style.topics.join(', ')}
- Notes de format : ${style.format_notes}
- Barème présent : ${style.has_scoring ? 'oui' : 'non'}
`.trim()

  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Tu es un professeur expert. Génère un sujet d'examen complet en respectant exactement le style détecté, adapté au cours fourni.

Style à respecter :
${styleDescription}

Réponds UNIQUEMENT en JSON avec ce format :
{
  "questions": [
    {
      "id": "1",
      "question": "...",
      "type": "mcq",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "points": 2
    },
    {
      "id": "2",
      "question": "...",
      "type": "open",
      "points": 4
    }
  ],
  "answers": [
    {
      "question_id": "1",
      "answer": "B. ...",
      "key_points": ["point clé 1", "point clé 2"]
    }
  ]
}

Génère exactement ${style.total_questions} questions dans le style demandé.`,
      },
      {
        role: 'user',
        content: `Titre du sujet : ${title}\n\nContenu du cours :\n${courseContent.slice(0, 6000)}`,
      },
    ],
  })

  const result = JSON.parse(response.choices[0].message.content!) as {
    questions: AnnaleQuestion[]
    answers: AnnaleAnswer[]
  }
  return result
}

// ── Planificateur ─────────────────────────────────────────────────

export interface StudyPlanContentItem {
  id: string
  title: string
  type: 'fiche' | 'deck'
  mastery: number // 1-5
}

export interface StudyPlanOrderedItem {
  id: string
  title: string
  type: 'fiche' | 'deck'
  priority: 'high' | 'medium' | 'low'
  rationale: string
  sessions_needed: number
  initial_duration_minutes: number
}

export interface StudyPlanLLMOutput {
  ordered_content: StudyPlanOrderedItem[]
  strategy_notes: string
}

export async function generateStudyPlanSchedule(
  contents: StudyPlanContentItem[],
  examDate: string,
  availableMinutesPerDay: number,
): Promise<StudyPlanLLMOutput> {
  const contentList = contents
    .map((c) => `- [${c.id}] [${c.type}] "${c.title}" — maîtrise auto-évaluée : ${c.mastery}/5`)
    .join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en stratégie de révision et sciences cognitives. Analyse les contenus à réviser et propose un ordre de priorité optimal pour un planning jour par jour.

Tiens compte :
- De la maîtrise auto-évaluée (1 = très difficile → plus de sessions ; 5 = maîtrisé → moins de sessions).
- De la date d'examen et du temps disponible par jour.
- Du principe de répétition espacée : les notions peu maîtrisées doivent être vues tôt et revues plusieurs fois (J+2, J+5, J+12).
- De l'ordre du tableau : tu dois trier par priorité (high d'abord), puis sous-trier par difficulté décroissante.
- Du temps de chargement d'une nouvelle notion : entre 15 et 30 minutes pour la session initiale.

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "ordered_content": [
    {
      "id": "<reprendre l'id fourni>",
      "title": "<titre du contenu>",
      "type": "fiche" | "deck",
      "priority": "high" | "medium" | "low",
      "rationale": "Pourquoi cette priorité, en 1 phrase concrète",
      "sessions_needed": 1..4,
      "initial_duration_minutes": 15..30
    }
  ],
  "strategy_notes": "Conseil général 2-3 phrases sur la méthode à suivre (actif, répétition espacée, rappel libre...)"
}

Règles de priorité :
- "high" si maîtrise ≤ 2 (sessions_needed 3 ou 4)
- "medium" si maîtrise = 3 (sessions_needed 2 ou 3)
- "low" si maîtrise ≥ 4 (sessions_needed 1 ou 2)

Durée initiale :
- deck : 15-20 min
- fiche : 20-30 min selon densité supposée.

Tri : high en premier, puis medium, puis low. Reprend tous les contenus fournis sans exception.`,
      },
      {
        role: 'user',
        content: `Date d'examen : ${examDate}\nTemps disponible : ${availableMinutesPerDay} min/jour\n\nContenus à réviser :\n${contentList}`,
      },
    ],
  })

  const raw = JSON.parse(response.choices[0].message.content!) as StudyPlanLLMOutput

  // Normalisation défensive : garantir les champs obligatoires côté scheduler
  const ordered = (raw.ordered_content ?? []).map((it) => ({
    id: it.id,
    title: it.title,
    type: (it.type === 'deck' ? 'deck' : 'fiche') as 'deck' | 'fiche',
    priority: (['high', 'medium', 'low'].includes(it.priority) ? it.priority : 'medium') as
      | 'high' | 'medium' | 'low',
    rationale: it.rationale ?? '',
    sessions_needed: clampInt(it.sessions_needed, 1, 4, 2),
    initial_duration_minutes: clampInt(
      it.initial_duration_minutes,
      10,
      45,
      it.type === 'deck' ? 15 : 25,
    ),
  }))

  return {
    ordered_content: ordered,
    strategy_notes: raw.strategy_notes ?? '',
  }
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? Math.round(v) : NaN
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

export default openai
