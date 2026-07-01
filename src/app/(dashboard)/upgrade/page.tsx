import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckoutButton } from '@/components/checkout-button'
import { Eyebrow } from '@/components/ui/Eyebrow'

const COLOR = '#1F4D3F'

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
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <Eyebrow className="mb-2">Abonnement</Eyebrow>
        <h1 className="section-h">Passe à la vitesse supérieure</h1>
        {overQuota ? (
          <p className="text-sm mt-3" style={{ color: '#EF4444' }}>
            Tu as utilisé tes 5 générations ce mois-ci. Passe Pro pour continuer sans limite.
          </p>
        ) : (
          <p className="text-sm mt-3" style={{ color: 'var(--ink-700)' }}>
            Il te reste <strong style={{ color: 'var(--ink)' }}>{generationsLeft} génération{generationsLeft > 1 ? 's' : ''}</strong> ce mois-ci.
          </p>
        )}
      </div>

      {/* Pricing grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-10 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {/* Free plan */}
        <div
          className="rounded-2xl p-7 flex flex-col gap-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div>
            <div className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>Gratuit</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold" style={{ color: 'var(--ink)' }}>0&nbsp;€</span>
              <span className="text-sm" style={{ color: 'var(--ink-500)' }}>/pour toujours</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {FEATURES_FREE.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--ink-700)' }}>
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                  style={{ background: 'var(--surface-2)', color: 'var(--ink-400)' }}
                >✓</span>
                {f}
              </li>
            ))}
          </ul>
          <div
            className="py-3 rounded-xl text-center text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--ink-500)' }}
          >
            Plan actuel
          </div>
        </div>

        {/* Pro plan */}
        <div
          className="relative rounded-2xl p-7 flex flex-col gap-5"
          style={{
            background: COLOR + '08',
            border: `1.5px solid ${COLOR}`,
            boxShadow: `0 0 0 1px ${COLOR} inset`,
          }}
        >
          <span
            className="mono absolute top-5 right-5 text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-full font-medium"
            style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}30` }}
          >
            Recommandé
          </span>
          <div>
            <div className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>Pro</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold" style={{ color: 'var(--ink)' }}>4,99&nbsp;€</span>
              <span className="text-sm" style={{ color: 'var(--ink-500)' }}>/mois</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {FEATURES_PRO.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--ink-700)' }}>
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                  style={{ background: COLOR + '20', color: COLOR }}
                >✓</span>
                {f}
              </li>
            ))}
          </ul>
          <CheckoutButton />
        </div>
      </div>

      <p
        className="mono text-center text-xs animate-fade-up"
        style={{ color: 'var(--ink-400)', animationDelay: '90ms' }}
      >
        Sans engagement · Annule en 1 clic depuis les paramètres · Paiement sécurisé via Stripe
      </p>
    </div>
  )
}
