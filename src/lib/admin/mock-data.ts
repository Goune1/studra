// Type definitions for the admin dashboard.
// Data is fetched from Supabase in lib/admin/queries.ts — no mock data here.

export type Plan         = 'free' | 'pro'
export type StripeStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | 'none'
export type GenType      = 'flashcards' | 'fiche' | 'schema' | 'frise' | 'examen' | 'annale' | 'feynman' | 'rappel' | 'planning' | 'socrate'

export interface RecentGeneration {
  type: GenType
  date: string
  lang: string
}

export interface ContentCounts {
  decks:   number
  fiches:  number
  schemas: number
  frises:  number
}

export interface AdminUser {
  id:                string
  name:              string
  email:             string
  plan:              Plan
  stripeStatus:      StripeStatus
  stripeCustomerId:  string | null
  generationsUsed:   number
  generationsQuota:  number | null    // 5 for free, null = unlimited (pro)
  createdAt:         string
  lastLoginAt:       string | null
  recentGenerations: RecentGeneration[]
  contentCounts:     ContentCounts
  stripeStartDate:   string | null   // not stored in DB
  stripeNextRenewal: string | null   // not stored in DB
  stripeCancelDate:  string | null   // not stored in DB
}
