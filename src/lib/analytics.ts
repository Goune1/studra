import { withPostHog } from './posthog-client'

const posthog = {
  capture(event: string, properties?: Record<string, unknown>) {
    withPostHog((client) => client.capture(event, properties))
  },
  identify(distinctId: string, properties?: Record<string, unknown>) {
    withPostHog((client) => client.identify(distinctId, properties))
  },
  reset() {
    withPostHog((client) => client.reset())
  },
  people: {
    set(properties: Record<string, unknown>) {
      withPostHog((client) => client.people.set(properties))
    },
  },
}

type Tool = 'flashcards' | 'fiches' | 'lacunes' | 'schemas' | 'frises' | 'exam'
type PricingPlan = 'free' | 'premium'

function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    posthog.capture(event, properties)
  } catch {}
}

// -------------------
// IDENTIFICATION
// -------------------

export function identifyUser(userId: string, email: string) {
  if (typeof window === 'undefined') return
  try {
    posthog.identify(userId, { email })
  } catch {}
}

// -------------------
// ACQUISITION FUNNEL
// -------------------

// UTMs capturés à l'arrivée sur la landing, persistés pour la durée de la session
// onglet afin de pouvoir les rattacher aux events plus loin dans le funnel
// (signup_attempted / signup_completed / signup_failed), sans backend ni lib tierce.
const UTM_STORAGE_KEY = 'studra_utm'

type StoredUTM = {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  landing_referrer: string | null
}

function storeUTM(utm: StoredUTM) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm))
  } catch {}
}

function getStoredUTM(): Partial<StoredUTM> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function trackLandingView(utm?: { source?: string; medium?: string; campaign?: string }) {
  if (typeof window === 'undefined') return
  try {
    const stored: StoredUTM = {
      utm_source: utm?.source ?? null,
      utm_medium: utm?.medium ?? null,
      utm_campaign: utm?.campaign ?? null,
      landing_referrer: document.referrer || null,
    }
    storeUTM(stored)
    posthog.capture('landing_viewed', {
      referrer: stored.landing_referrer,
      utm_source: stored.utm_source,
      utm_medium: stored.utm_medium,
      utm_campaign: stored.utm_campaign,
    })
  } catch {}
}

export function trackLandingCTAClick(cta_label: string, cta_position: 'hero' | 'mid' | 'bottom' | 'navbar') {
  capture('landing_cta_clicked', { cta_label, cta_position })
}

export function trackPricingView(from: string) {
  capture('pricing_viewed', { from })
}

export function trackPricingPlanClick(plan: PricingPlan) {
  capture('pricing_plan_clicked', { plan })
}

// -------------------
// AUTH FUNNEL
// -------------------

export function trackSignupPageView(from: string) {
  capture('signup_page_viewed', { from })
}

export function trackSignupAttempt(method: 'email' | 'google' | 'github') {
  capture('signup_attempted', { method, ...getStoredUTM() })
}

export function trackSignupSuccess(userId: string, email: string, method: 'email' | 'google' | 'github') {
  if (typeof window === 'undefined') return
  try {
    posthog.identify(userId, { email, signup_method: method })
    posthog.capture('signup_completed', { method, ...getStoredUTM() })
  } catch {}
}

export function trackSignupError(error_code: string) {
  capture('signup_failed', { error_code, ...getStoredUTM() })
}

export function trackLogin(userId: string, email: string, method: 'email' | 'google' | 'github') {
  if (typeof window === 'undefined') return
  try {
    posthog.identify(userId, { email })
    posthog.capture('login_completed', { method })
  } catch {}
}

export function trackLogout() {
  if (typeof window === 'undefined') return
  try {
    posthog.capture('logout')
    posthog.reset()
  } catch {}
}

// -------------------
// ONBOARDING
// -------------------

export function trackFirstDashboardView() {
  capture('onboarding_dashboard_first_view')
}

export function trackFirstSubjectCreated(subject_name: string) {
  capture('onboarding_first_subject_created', { subject_name })
}

export function trackFirstToolUse(tool: Tool) {
  capture('onboarding_first_tool_used', { tool })
}

// -------------------
// DASHBOARD
// -------------------

export function trackDashboardView() {
  capture('dashboard_viewed')
}

export function trackSubjectClick(subject_id: string, subject_name: string) {
  capture('subject_clicked', { subject_id, subject_name })
}

export function trackSubjectCreated(subject_name: string) {
  capture('subject_created', { subject_name })
}

export function trackSubjectDeleted(subject_id: string) {
  capture('subject_deleted', { subject_id })
}

// -------------------
// OUTIL : FLASHCARDS
// -------------------

export function trackFlashcardsOpen(subject_id: string) {
  capture('flashcards_opened', { subject_id })
}

export function trackFlashcardsGenerate(subject_id: string, count: number) {
  capture('flashcards_generated', { subject_id, count })
}

export function trackFlashcardsSessionStart(subject_id: string, card_count: number) {
  capture('flashcards_session_started', { subject_id, card_count })
}

export function trackFlashcardsSessionComplete(subject_id: string, score: number, duration_seconds: number) {
  capture('flashcards_session_completed', { subject_id, score, duration_seconds })
}

export function trackFlashcardsSessionAbandoned(subject_id: string, cards_seen: number, total_cards: number) {
  capture('flashcards_session_abandoned', { subject_id, cards_seen, total_cards })
}

// -------------------
// OUTIL : FICHES
// -------------------

export function trackFichesOpen(subject_id: string) {
  capture('fiches_opened', { subject_id })
}

export function trackFichesGenerate(subject_id: string, topic: string) {
  capture('fiches_generated', { subject_id, topic })
}

export function trackFichesView(fiche_id: string) {
  capture('fiche_viewed', { fiche_id })
}

export function trackFichesExport(fiche_id: string, format: 'pdf' | 'copy') {
  capture('fiche_exported', { fiche_id, format })
}

// -------------------
// OUTIL : LACUNES
// -------------------

export function trackLacunesOpen(subject_id: string) {
  capture('lacunes_opened', { subject_id })
}

export function trackLacunesAnalyze(subject_id: string) {
  capture('lacunes_analyzed', { subject_id })
}

export function trackLacuneResolved(lacune_id: string) {
  capture('lacune_resolved', { lacune_id })
}

// -------------------
// OUTIL : SCHEMAS
// -------------------

export function trackSchemasOpen(subject_id: string) {
  capture('schemas_opened', { subject_id })
}

export function trackSchemaGenerate(subject_id: string, schema_type: string) {
  capture('schema_generated', { subject_id, schema_type })
}

export function trackSchemaView(schema_id: string) {
  capture('schema_viewed', { schema_id })
}

// -------------------
// OUTIL : FRISES
// -------------------

export function trackFrisesOpen(subject_id: string) {
  capture('frises_opened', { subject_id })
}

export function trackFriseGenerate(subject_id: string, period: string) {
  capture('frise_generated', { subject_id, period })
}

export function trackFriseView(frise_id: string) {
  capture('frise_viewed', { frise_id })
}

// -------------------
// OUTIL : EXAM
// -------------------

export function trackExamOpen(subject_id: string) {
  capture('exam_opened', { subject_id })
}

export function trackExamGenerate(subject_id: string, difficulty: 'facile' | 'moyen' | 'difficile') {
  capture('exam_generated', { subject_id, difficulty })
}

export function trackExamSubmit(subject_id: string, duration_seconds: number) {
  capture('exam_submitted', { subject_id, duration_seconds })
}

export function trackExamCorrectionView(exam_id: string, score: number) {
  capture('exam_correction_viewed', { exam_id, score })
}

// -------------------
// MONETISATION
// -------------------

export function trackPaywallHit(tool: Tool, reason: string) {
  capture('paywall_hit', { tool, reason })
}

export function trackPaywallViewed(tool: Tool, source: 'banner' | 'modal') {
  capture('paywall_viewed', { tool, source })
}

export function trackPaywallCtaClicked(tool: Tool, source: 'banner' | 'modal') {
  capture('paywall_cta_clicked', { tool, source })
}

export function trackUpgradeClick(from: 'paywall' | 'settings' | 'navbar' | 'dashboard') {
  capture('upgrade_clicked', { from })
}

export function trackCheckoutStart(plan: PricingPlan, price_eur: number) {
  capture('checkout_started', { plan, price_eur })
}

export function trackCheckoutSuccess(plan: PricingPlan, price_eur: number) {
  if (typeof window === 'undefined') return
  try {
    posthog.capture('checkout_completed', { plan, price_eur })
    posthog.people.set({ plan: 'premium' })
  } catch {}
}

export function trackCheckoutAbandoned() {
  capture('checkout_abandoned')
}

export function trackSubscriptionCancelled(reason?: string) {
  if (typeof window === 'undefined') return
  try {
    posthog.capture('subscription_cancelled', { reason: reason ?? null })
    posthog.people.set({ plan: 'free' })
  } catch {}
}

// -------------------
// ERREURS IA
// -------------------

export function trackAIGenerationError(tool: Tool, error_code: string) {
  capture('ai_generation_failed', { tool, error_code })
}

export function trackAIGenerationSuccess(tool: Tool, duration_ms: number) {
  capture('ai_generation_succeeded', { tool, duration_ms })
}
