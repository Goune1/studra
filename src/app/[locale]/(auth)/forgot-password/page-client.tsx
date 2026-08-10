'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')
  const common = useTranslations('auth.common')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? t('error'))
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      toast.error(t('error'))
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            {common('brand')}
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-2">{t('title')}</h1>
          <p className="text-gray-400">{sent ? t('sentSubtitle') : t('subtitle')}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {sent ? (
            <p className="text-sm text-gray-300 leading-relaxed">{t('sentBody')}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{common('email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder={common('emailPlaceholder')}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-colors"
              >
                {loading ? t('submitting') : t('submit')}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-gray-400">
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            {t('backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  )
}
