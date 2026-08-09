'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

const DANGER = '#B4503C'

type DeleteAccountResult = {
  ok: boolean
  error?: string
}

type DeleteAccountButtonProps = {
  userEmail: string
  deleteAccount: (confirmationEmail: string) => Promise<DeleteAccountResult>
}

export function DeleteAccountButton({ userEmail, deleteAccount }: DeleteAccountButtonProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('dashboard.settings.deleteAccount')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
        style={{ background: 'transparent', border: '1px solid var(--ink-200)', color: DANGER }}
      >
        {t('cta')}
      </button>

      {open && (
        <ConfirmDeleteAccountDialog
          userEmail={userEmail}
          deleteAccount={deleteAccount}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function ConfirmDeleteAccountDialog({
  userEmail,
  deleteAccount,
  onClose,
}: {
  userEmail: string
  deleteAccount: (confirmationEmail: string) => Promise<DeleteAccountResult>
  onClose: () => void
}) {
  const t = useTranslations('dashboard.settings.deleteAccount')
  const router = useRouter()
  const supabase = createClient()
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const canConfirm = confirmationEmail.trim().toLowerCase() === userEmail.trim().toLowerCase()

  async function handleConfirm() {
    if (!canConfirm || deleting) return
    setDeleting(true)
    setError('')

    const result = await deleteAccount(confirmationEmail)

    if (!result.ok) {
      setError(result.error || t('genericError'))
      setDeleting(false)
      return
    }

    // The server action already destroyed the server-side session; clear
    // the client-side auth state too before navigating away.
    await supabase.auth.signOut()
    toast.success(t('deleted'))
    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={deleting ? undefined : onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
        style={{ background: 'var(--bg-elev)', borderColor: 'var(--ink-200)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: DANGER + '15' }}
          >
            <AlertTriangle size={16} style={{ color: DANGER }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{t('confirmTitle')}</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-500)' }}>
              {t('warning')}
            </p>
          </div>
        </div>

        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>
          {t('typeEmailLabel', { email: userEmail })}
        </label>
        <input
          type="email"
          value={confirmationEmail}
          onChange={(e) => setConfirmationEmail(e.target.value)}
          disabled={deleting}
          autoComplete="off"
          className="w-full rounded-lg px-3 py-2 text-sm mb-4"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink)' }}
        />

        {error && (
          <div className="mb-4 rounded-lg px-3 py-2 text-xs" style={{ border: `1px solid ${DANGER}40`, background: `${DANGER}12`, color: DANGER }}>
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 rounded-lg px-4 py-2.5 text-xs font-medium transition-colors disabled:opacity-50"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--ink-200)', color: 'var(--ink-700)' }}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting || !canConfirm}
            className="flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: DANGER }}
          >
            {deleting && <Loader2 size={12} className="animate-spin" />}
            {deleting ? t('deleting') : t('confirmCta')}
          </button>
        </div>
      </div>
    </div>
  )
}
