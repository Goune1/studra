'use client'

import { useState } from 'react'
import { CircleNotch, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        style={{ background: 'transparent', border: '1px solid var(--ink-200)', color: DANGER }}
      >
        {"Supprimer mon compte"}
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
      setError(result.error || "Impossible de supprimer le compte. Réessaie ou contacte le support.")
      setDeleting(false)
      return
    }

    // The server action already destroyed the server-side session; clear
    // the client-side auth state too before navigating away.
    await supabase.auth.signOut()
    toast.success("Ton compte a été supprimé.")
    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={deleting ? undefined : onClose}
    >
      <div
        className="w-full max-w-sm rounded-[11px] border p-6"
        style={{ background: 'var(--bg-elev)', borderColor: 'var(--ink-200)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: DANGER + '15' }}
          >
            <Warning size={16} style={{ color: DANGER }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{"Supprimer définitivement ton compte ?"}</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-500)' }}>
              {"Cette action est irréversible. Toutes tes données seront supprimées et ton abonnement, s'il est actif, sera immédiatement résilié."}
            </p>
          </div>
        </div>

        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>
          {`Tape ${userEmail} pour confirmer`}
        </label>
        <input
          type="email"
          value={confirmationEmail}
          onChange={(e) => setConfirmationEmail(e.target.value)}
          disabled={deleting}
          autoComplete="off"
          className="w-full rounded-lg px-3 py-2 text-sm mb-4"
          style={{ background: '#fcfcfb', border: '1px solid var(--ink-200)', color: 'var(--ink)' }}
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
            style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', color: 'var(--ink-700)' }}
          >
            {"Annuler"}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting || !canConfirm}
            className="flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: DANGER }}
          >
            {deleting && <CircleNotch size={12} className="animate-spin" />}
            {deleting ? "Suppression…" : "Supprimer définitivement"}
          </button>
        </div>
      </div>
    </div>
  )
}
