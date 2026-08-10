'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { GraduationCap, Lock } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { unlockBac } from './actions'

const COLOR = '#1F4D3F'

export function BacGate() {
  const [error, action, pending] = useActionState(unlockBac, null)
  const t = useTranslations('dashboard.bac')

  return (
    <div className="max-w-md">
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap size={14} style={{ color: COLOR }} />
          <Eyebrow>{t('title')}</Eyebrow>
        </div>
        <h1 className="section-h">{t('soon')}</h1>
        <p className="text-sm mt-3" style={{ color: 'var(--ink-500)' }}>
          {t('development')}
        </p>
      </div>

      <div
        className="rounded-2xl p-6 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '60ms' }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{t('access')}</p>
        <p className="text-xs mb-5" style={{ color: 'var(--ink-500)' }}>
          {t('accessHelp')}
        </p>

        <form action={action} className="space-y-3">
          <div className="relative">
            <Lock
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--ink-400)' }}
            />
            <input
              type="password"
              name="password"
              placeholder={t('password')}
              required
              autoComplete="off"
              className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: 'var(--surface-2)',
                border: `1px solid ${error ? '#EF444450' : 'var(--border)'}`,
                color: 'var(--ink)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
              onBlur={(e) => (e.currentTarget.style.borderColor = error ? '#EF444450' : 'var(--border)')}
            />
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary w-full"
          >
            {pending ? t('checking') : t('accessButton')}
          </button>
        </form>
      </div>
    </div>
  )
}
