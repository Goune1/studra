import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import Link from 'next/link'
import { Brain, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CheckoutButton } from '@/components/checkout-button'
import { ManageSubscriptionButton } from '@/components/manage-subscription-button'
import { MarketingConsentToggle } from '@/components/settings/MarketingConsentToggle'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { updateMarketingConsent } from './actions'

const COLOR = '#1F4D3F'

export default async function SettingsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const isPro = profile?.plan === 'pro'
  const generationsLeft = isPro ? null : Math.max(0, 5 - (profile?.generations_used_this_month ?? 0))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <Eyebrow className="mb-2">Compte</Eyebrow>
        <h1 className="section-h">Paramètres</h1>
      </div>

      {/* FSRS shortcut */}
      <Link
        href="/settings/revision"
        className="flex items-center gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5 group animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '40ms' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: COLOR + '15', border: `1px solid ${COLOR}25` }}
        >
          <Brain size={18} style={{ color: COLOR }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>Répétition espacée (FSRS)</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-400)' }}>
            Stats, rétention cible, prévision
          </p>
        </div>
        <ChevronRight
          size={16}
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: 'var(--ink-400)' }}
        />
      </Link>

      {/* Profil */}
      <div
        className="rounded-2xl p-8 space-y-6 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '60ms' }}
      >
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>Profil</h2>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>Email</label>
          <p className="text-sm" style={{ color: 'var(--ink)' }}>{user?.email}</p>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>Nom complet</label>
          <p className="text-sm" style={{ color: 'var(--ink)' }}>{profile?.full_name ?? 'Non renseigné'}</p>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>Membre depuis</label>
          <p className="text-sm" style={{ color: 'var(--ink)' }}>
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : '-'}
          </p>
        </div>
        <div
          className="flex items-center justify-between gap-4 border-t pt-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--ink-700)' }}>Emails marketing</p>
            <p className="text-xs" style={{ color: 'var(--ink-500)' }}>Recevoir les actualités et offres Studra par email.</p>
          </div>
          <MarketingConsentToggle
            initialValue={profile?.marketing_consent ?? false}
            updateMarketingConsent={updateMarketingConsent}
          />
        </div>
      </div>

      {/* Abonnement */}
      <div
        className="rounded-2xl p-8 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '80ms' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>Abonnement</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--ink-500)' }}>Votre abonnement Studra</p>
          </div>
          <span
            className="mono px-3 py-1.5 rounded-full text-xs font-semibold"
            style={isPro
              ? { background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}30` }
              : { background: 'var(--surface-2)', color: 'var(--ink-500)', border: '1px solid var(--border)' }
            }
          >
            {isPro ? 'Pro' : 'Gratuit'}
          </span>
        </div>

        {!isPro && (
          <div
            className="mb-6 p-4 rounded-xl"
            style={{ background: 'var(--accent-soft)', border: `1px solid ${COLOR}25` }}
          >
            <p className="text-sm" style={{ color: COLOR }}>
              {generationsLeft === 0
                ? 'Tu as utilisé toutes tes générations ce mois-ci.'
                : `Il te reste ${generationsLeft} génération${generationsLeft! > 1 ? 's' : ''} ce mois-ci.`}
            </p>
          </div>
        )}

        <div className="space-y-3 mb-8">
          {[
            { label: 'Flashcards illimitées',  included: isPro },
            { label: 'Fiches illimitées',       included: isPro },
            { label: 'Générations par mois',    value: isPro ? 'Illimitées' : '5' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--ink-700)' }}>{item.label}</span>
              {item.value ? (
                <span className="mono text-sm font-medium" style={{ color: 'var(--ink)' }}>{item.value}</span>
              ) : (
                <span style={{ color: item.included ? COLOR : 'var(--ink-400)' }}>
                  {item.included ? '✓' : '✗'}
                </span>
              )}
            </div>
          ))}
        </div>

        {!isPro ? <CheckoutButton /> : <ManageSubscriptionButton />}
      </div>
    </div>
  )
}
