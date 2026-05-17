export interface Profile {
  id: string
  email: string
  full_name: string | null
  plan: 'free' | 'pro'
  lemon_squeezy_customer_id: string | null
  lemon_squeezy_subscription_id: string | null
  generations_used_this_month: number
  generations_reset_at: string
  marketing_consent: boolean
  created_at: string
}

export interface Deck {
  id: string
  user_id: string
  title: string
  subject: string | null
  source_content: string
  card_count: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Flashcard {
  id: string
  deck_id: string
  question: string
  answer: string
  difficulty: number
  times_reviewed: number
  last_reviewed_at: string | null
  created_at: string
  // FSRS columns (migration 006)
  fsrs_difficulty: number | null
  fsrs_stability: number | null
  fsrs_due: string | null
  fsrs_last_review: string | null
  fsrs_state: number
  fsrs_reps: number
  fsrs_lapses: number
  fsrs_elapsed_days: number
  fsrs_scheduled_days: number
  fsrs_learning_steps: number
}

export interface Fiche {
  id: string
  user_id: string
  title: string
  subject: string | null
  source_content: string
  generated_content: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export type SchemaNodeColor = 'primary' | 'neutral' | 'accent'

export interface SchemaNode {
  id: string
  label: string
  x: number
  y: number
  width?: number
  height?: number
  color?: SchemaNodeColor
}

export interface SchemaEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface SchemaViewport {
  x: number
  y: number
  zoom: number
}

export interface SchemaData {
  nodes: SchemaNode[]
  edges: SchemaEdge[]
  viewport?: SchemaViewport
}

export interface Schema {
  id: string
  user_id: string
  title: string
  subject: string | null
  source_content: string
  generated_data: SchemaData
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  date: string
  end_date: string | null
  type: 'event' | 'period'
  title: string
  description: string
  category: string
}

export interface TimelineData {
  title: string
  events: TimelineEvent[]
}

export interface Timeline {
  id: string
  user_id: string
  title: string
  subject: string | null
  source_content: string
  generated_data: TimelineData
  is_public: boolean
  created_at: string
  updated_at: string
}

// --- New feature types ---

export interface ExamQuestionMCQ {
  id: string
  type: 'mcq'
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

export interface ExamQuestionOpen {
  id: string
  type: 'open'
  question: string
  model_answer: string
  keywords: string[]
}

export type ExamQuestion = ExamQuestionMCQ | ExamQuestionOpen

export interface ExamAnswer {
  question_id: string
  user_answer: string
  is_correct: boolean
  score: number
  feedback: string
}

export interface Exam {
  id: string
  user_id: string
  title: string
  subject: string | null
  source_content: string
  questions: ExamQuestion[]
  language: string
  created_at: string
}

export interface ExamSession {
  id: string
  exam_id: string
  user_id: string
  answers: ExamAnswer[]
  score: number
  total_questions: number
  completed_at: string
}

export interface FlashcardReview {
  id: string
  flashcard_id: string
  deck_id: string
  user_id: string
  knew: boolean
  // FSRS columns (migration 006)
  rating: number | null             // 1=Again 2=Hard 3=Good 4=Easy
  state_before: number | null
  elapsed_days: number | null
  scheduled_days: number | null
  review_duration_ms: number | null
  created_at: string
}

export interface UserFsrsSettings {
  user_id: string
  w: number[] | null
  desired_retention: number
  maximum_interval: number
  last_optimization_at: string | null
  review_count_at_last_optimization: number
  created_at: string
  updated_at: string
}

export interface LacuneCard {
  flashcard_id: string
  question: string
  answer: string
  wrong_count: number
  total_count: number
  wrong_rate: number
}

export interface SocrateMessage {
  role: 'user' | 'assistant'
  content: string
}

// ── Feynman ───────────────────────────────────────────────────────

export interface FeynmanSession {
  id: string
  user_id: string
  content_title: string
  source_content: string
  messages: SocrateMessage[]
  diagnosis: FeynmanDiagnosis | null
  created_at: string
}

export interface FeynmanDiagnosis {
  clarity_score: number          // 0-100
  well_explained: string[]       // notions bien vulgarisées
  still_unclear: string[]        // notions restées floues
  best_explanation: string       // meilleure explication de l'étudiant (extrait)
  suggestions: string[]          // parties du cours à relire
}

// ── Free Recall ───────────────────────────────────────────────────

export interface FreeRecallSession {
  id: string
  user_id: string
  content_title: string
  source_content: string
  duration_seconds: number
  user_text: string
  evaluation: FreeRecallEvaluation | null
  score: number | null
  created_at: string
}

export interface FreeRecallEvaluation {
  score: number                      // 0-100
  notions_couvertes: string[]
  notions_oubliees: string[]
  erreurs: string[]
  flashcards_suggerees: Array<{ question: string; answer: string }>
}

// ── Annales ───────────────────────────────────────────────────────

export interface ExamTemplate {
  id: string
  user_id: string
  source_text: string
  detected_style: DetectedExamStyle
  created_at: string
}

export interface DetectedExamStyle {
  question_types: string[]
  total_questions: number
  difficulty: 'easy' | 'intermediate' | 'hard'
  topics: string[]
  format_notes: string
  has_scoring: boolean
}

export interface GeneratedPastExam {
  id: string
  template_id: string | null
  user_id: string
  title: string
  source_content: string
  questions_json: AnnaleQuestion[]
  answers_json: AnnaleAnswer[]
  created_at: string
}

export interface AnnaleQuestion {
  id: string
  question: string
  type: 'mcq' | 'open' | 'cas_pratique'
  options?: string[]
  points?: number
}

export interface AnnaleAnswer {
  question_id: string
  answer: string
  key_points?: string[]
}

// ── Study Plan ────────────────────────────────────────────────────

export interface StudyPlanMasteryLevels {
  [contentId: string]: number // 1..5
}

export interface StudyPlan {
  id: string
  user_id: string
  title: string
  exam_date: string
  available_minutes_per_day: number
  status: 'active' | 'completed' | 'abandoned'
  mastery_levels: StudyPlanMasteryLevels
  strategy_notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type StudyPlanTaskType =
  | 'flashcards'
  | 'fiche'
  | 'exam'
  | 'review'
  | 'general_review'

export type StudyPlanSessionStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'postponed'
  | 'skipped'

export interface StudyPlanContentRef {
  id: string
  title: string
  type: 'fiche' | 'deck'
}

export interface StudyPlanTask {
  id: string
  plan_id: string
  user_id: string
  scheduled_date: string
  task_type: StudyPlanTaskType
  content_ref: string | null
  content_refs: StudyPlanContentRef[]
  content_title: string
  duration_minutes: number
  session_position: number
  rationale: string | null
  status: StudyPlanSessionStatus
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ContentItem {
  id: string
  title: string
  subject: string | null
  type: 'fiche' | 'deck'
  source_content: string
}
