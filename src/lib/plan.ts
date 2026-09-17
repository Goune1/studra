/**
 * Seul point d'entrée TypeScript pour savoir si un utilisateur est Pro.
 *
 * La règle « abonnement Stripe actif OU Pro offert en cours » n'est pas
 * recalculée ici : elle vit en SQL dans public.is_pro(profiles)
 * (migration 021), que PostgREST expose comme champ calculé `is_pro`.
 * Ce module ne fait que lire ce champ, et les colonnes Stripe quand l'écran
 * doit distinguer un abonnement payant d'un Pro offert.
 *
 * Utilisable côté serveur comme côté client : aucun import serveur.
 */

/** Colonnes à sélectionner sur `profiles` pour résoudre le plan. */
export const PLAN_SELECT = 'plan, pro_until, stripe_customer_id, is_pro'

/** Champ calculé exposé par PostgREST, filtrable (`.eq(IS_PRO_FIELD, true)`). */
export const IS_PRO_FIELD = 'is_pro'

export interface PlanRow {
  plan?: string | null
  pro_until?: string | null
  stripe_customer_id?: string | null
  is_pro?: boolean | null
}

export interface UserPlan {
  /** Accès Pro effectif : abonnement Stripe actif ou Pro offert en cours. */
  isPro: boolean
  /** Abonnement Stripe actif (colonne `plan`, écrite uniquement par le webhook). */
  hasStripeSubscription: boolean
  /** Un client Stripe existe : le portail de gestion est utilisable. */
  hasStripeCustomer: boolean
  /** Fin du Pro offert, renseignée seulement si c'est lui qui donne l'accès Pro. */
  offeredProUntil: string | null
}

export function resolvePlan(row: PlanRow | null | undefined): UserPlan {
  const isPro = row?.is_pro === true
  const hasStripeSubscription = row?.plan === 'pro'
  return {
    isPro,
    hasStripeSubscription,
    hasStripeCustomer: Boolean(row?.stripe_customer_id),
    offeredProUntil: isPro && !hasStripeSubscription ? row?.pro_until ?? null : null,
  }
}
