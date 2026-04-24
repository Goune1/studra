import Link from 'next/link'
import { Brain } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CheckoutButton } from '@/components/checkout-button'
import { ManageSubscriptionButton } from '@/components/manage-subscription-button'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const isPro = profile?.plan === 'pro'
  const generationsLeft = isPro ? null : Math.max(0, 5 - (profile?.generations_used_this_month ?? 0))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>

      {/* FSRS */}
      <Link href="/settings/revision"
        className="flex items-center gap-4 rounded-2xl border p-5 transition-all hover:border-violet-500/40 hover:bg-white/[0.02] group"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#8B5CF615', border: '1px solid #8B5CF630' }}>
          <Brain size={18} style={{ color: '#8B5CF6' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">Répétition espacée (FSRS)</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
            Stats, rétention cible, prévision
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: 'var(--text-4)' }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>

      {/* Profil */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
        <h2 className="text-lg font-semibold tracking-tight">Profil</h2>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
          <p className="text-white">{user?.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Nom complet</label>
          <p className="text-white">{profile?.full_name ?? 'Non renseigné'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Membre depuis</label>
          <p className="text-white">
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : '-'}
          </p>
        </div>
      </div>

      {/* Abonnement */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Abonnement</h2>
            <p className="text-gray-400 text-sm mt-1">Votre abonnement Studra</p>
          </div>
          <span className={`px-4 py-2 rounded-full font-semibold ${isPro ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-gray-500/20 text-gray-400'}`}>
            {isPro ? 'Pro' : 'Gratuit'}
          </span>
        </div>

        {!isPro && (
          <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <p className="text-orange-400 text-sm">
              {generationsLeft === 0
                ? '⚠️ Vous avez utilisé toutes vos générations ce mois-ci.'
                : `💡 Il vous reste ${generationsLeft} génération${generationsLeft! > 1 ? 's' : ''} ce mois-ci.`}
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
              <span className="text-gray-300">{item.label}</span>
              {item.value ? (
                <span className="text-white font-medium">{item.value}</span>
              ) : (
                <span className={item.included ? 'text-green-400' : 'text-gray-600'}>
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
