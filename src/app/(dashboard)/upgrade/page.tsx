import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckoutButton } from '@/components/checkout-button'

const FEATURES_FREE = [
  '5 générations IA par mois',
  'Accès à tous les formats',
  'Import PDF · texte · YouTube',
  'Répétition espacée FSRS',
]

const FEATURES_PRO = [
  'Générations IA illimitées',
  'Mode Socrate (maïeutique)',
  "Planning d'examen personnalisé",
  'Analyse des lacunes avancée',
  'Toutes les futures fonctionnalités',
]

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('plan, generations_used_this_month').eq('id', user!.id).single()

  if (profile?.plan === 'pro') redirect('/dashboard')

  const generationsLeft = Math.max(0, 5 - (profile?.generations_used_this_month ?? 0))
  const overQuota = generationsLeft === 0

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10">
        <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#818cf8]">Abonnement</span>
        <h1 className="text-3xl font-semibold tracking-tight text-white mt-2 mb-3">
          Passe à la vitesse supérieure
        </h1>
        {overQuota ? (
          <p className="text-[#f87171] text-sm">
            Tu as utilisé tes 5 générations ce mois-ci. Passe Pro pour continuer sans limite.
          </p>
        ) : (
          <p className="text-zinc-400 text-sm">
            Il te reste <strong className="text-white">{generationsLeft} génération{generationsLeft > 1 ? 's' : ''}</strong> ce mois-ci.
          </p>
        )}
      </div>

      {/* Pricing grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {/* Free plan */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-7 flex flex-col gap-5">
          <div>
            <div className="text-lg font-semibold text-white mb-1">Gratuit</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold text-white">0&nbsp;€</span>
              <span className="text-zinc-500 text-sm">/pour toujours</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {FEATURES_FREE.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-400">
                <span className="w-4 h-4 rounded-full flex items-center justify-center bg-white/5 text-zinc-500 text-[10px] flex-shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <div className="py-3 rounded-xl border border-white/8 text-center text-sm text-zinc-500 font-medium">
            Plan actuel
          </div>
        </div>

        {/* Pro plan */}
        <div className="relative rounded-2xl border border-[rgba(99,102,241,0.4)] bg-gradient-to-b from-[#15152e] to-[#0e0e1c] p-7 flex flex-col gap-5 shadow-[0_32px_64px_-32px_rgba(99,102,241,0.4)]">
          <span className="absolute top-5 right-5 font-mono text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-full bg-[rgba(99,102,241,0.2)] text-[#818cf8]">
            Recommandé
          </span>
          <div>
            <div className="text-lg font-semibold text-white mb-1">Pro</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold text-white">4,99&nbsp;€</span>
              <span className="text-zinc-500 text-sm">/mois</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {FEATURES_PRO.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                <span className="w-4 h-4 rounded-full flex items-center justify-center bg-[rgba(99,102,241,0.2)] text-[#818cf8] text-[10px] flex-shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <CheckoutButton />
        </div>
      </div>

      <p className="text-center text-zinc-600 text-xs">
        Sans engagement · Annule en 1 clic depuis les paramètres · Paiement sécurisé via Stripe
      </p>
    </div>
  )
}
