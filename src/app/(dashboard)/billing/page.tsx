import { createClient } from '@/lib/supabase/server'
import { CheckoutButton } from '@/components/checkout-button'
import { ManageSubscriptionButton } from '@/components/manage-subscription-button'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const isPro = profile?.plan === 'pro'
  const generationsLeft = isPro ? null : Math.max(0, 5 - (profile?.generations_used_this_month ?? 0))

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Abonnement</h1>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Plan actuel</h2>
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
            { label: 'Flashcards illimitées', included: isPro },
            { label: 'Fiches illimitées', included: isPro },
            { label: 'Générations par mois', value: isPro ? 'Illimitées' : '5' },
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

        {!isPro ? (
          <CheckoutButton />
        ) : (
          <ManageSubscriptionButton />
        )}
      </div>
    </div>
  )
}
