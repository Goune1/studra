'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { registerAffiliate } from '@/app/(dashboard)/affiliate/actions'

export function AffiliateRegistrationForm({ userEmail }: { userEmail: string }) {
  const [method, setMethod] = useState<'paypal' | 'bank_transfer'>('paypal')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await registerAffiliate(formData)
      if (result.ok) {
        toast.success('Bienvenue dans le programme d\'affiliation !')
      } else {
        toast.error(result.error ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
      <div className="mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
        <p className="text-sm text-violet-300 font-medium mb-1">✨ 20% de commission à vie</p>
        <p className="text-xs" style={{ color: 'var(--text-4)' }}>
          Gagnez 20% sur chaque paiement mensuel de vos filleuls tant qu'ils sont abonnés.
          Versement dès 10€ accumulés.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Prénom *</label>
            <input
              name="first_name"
              required
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors"
              placeholder="Jean"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Nom *</label>
            <input
              name="last_name"
              required
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors"
              placeholder="Dupont"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Email de contact *</label>
          <input
            name="contact_email"
            type="email"
            required
            defaultValue={userEmail}
            maxLength={254}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors"
            placeholder="jean@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Moyen de paiement *</label>
          <div className="grid grid-cols-2 gap-3">
            {(['paypal', 'bank_transfer'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left ${
                  method === m
                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                {m === 'paypal' ? '💳 PayPal' : '🏦 Virement bancaire'}
              </button>
            ))}
          </div>
          <input type="hidden" name="payment_method" value={method} />
        </div>

        {method === 'paypal' ? (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email PayPal *</label>
            <input
              name="paypal_email"
              type="email"
              required
              maxLength={254}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors"
              placeholder="jean@paypal.com"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Titulaire du compte *</label>
              <input
                name="account_holder_name"
                required
                maxLength={200}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors"
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">IBAN *</label>
              <input
                name="iban"
                required
                maxLength={34}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors font-mono"
                placeholder="FR76 3000 6000 0112 3456 7890 189"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">BIC / SWIFT <span className="text-gray-600">(optionnel)</span></label>
              <input
                name="bic"
                maxLength={11}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors font-mono"
                placeholder="BNPAFRPP"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold text-sm transition-colors"
        >
          {isPending ? 'Inscription...' : 'Rejoindre le programme d\'affiliation'}
        </button>
      </form>
    </div>
  )
}
