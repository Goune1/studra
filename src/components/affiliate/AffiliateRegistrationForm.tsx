'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { registerAffiliate } from '@/app/[locale]/(dashboard)/affiliate/actions'

export function AffiliateRegistrationForm({ userEmail }: { userEmail: string }) {
  const t = useTranslations('dashboard.affiliate')
  const [method, setMethod] = useState<'paypal' | 'bank_transfer'>('paypal')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await registerAffiliate(formData)
      if (result.ok) {
        toast.success(t('welcome'))
      } else {
        toast.error(result.error ?? t('error'))
      }
    })
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
      <div className="mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
        <p className="text-sm text-violet-300 font-medium mb-1">{t('commission')}</p>
        <p className="text-xs" style={{ color: 'var(--text-4)' }}>
          {t('commissionHelp')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('firstName')} *</label>
            <input
              name="first_name"
              required
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors"
              placeholder="Jean"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('lastName')} *</label>
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
          <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('contactEmail')} *</label>
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
          <label className="block text-xs font-medium text-gray-400 mb-2">{t('paymentMethod')} *</label>
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
                {m === 'paypal' ? t('paypal') : t('bankTransfer')}
              </button>
            ))}
          </div>
          <input type="hidden" name="payment_method" value={method} />
        </div>

        {method === 'paypal' ? (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('paypalEmail')} *</label>
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
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('accountHolder')} *</label>
              <input
                name="account_holder_name"
                required
                maxLength={200}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors"
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('iban')} *</label>
              <input
                name="iban"
                required
                maxLength={34}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none transition-colors font-mono"
                placeholder="FR76 3000 6000 0112 3456 7890 189"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('bic')}</label>
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
          {isPending ? t('registering') : t('join')}
        </button>
      </form>
    </div>
  )
}
