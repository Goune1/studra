'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'

function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword')
  const common = useTranslations('auth.common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash') ?? ''

  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmation) {
      toast.error(t('mismatch'))
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenHash, password }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      toast.error(data.error ?? t('error'))
      setLoading(false)
      return
    }

    toast.success(t('success'))
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            {common('brand')}
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-2">{t('title')}</h1>
          <p className="text-gray-400">{t('subtitle')}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {tokenHash ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('newPassword')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder={t('newPasswordPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder={t('confirmPasswordPlaceholder')}
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
          ) : (
            <p className="text-sm text-gray-300 leading-relaxed">{t('missingToken')}</p>
          )}
        </div>

        <p className="text-center mt-6 text-gray-400">
          <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300 transition-colors">
            {t('requestNewLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
