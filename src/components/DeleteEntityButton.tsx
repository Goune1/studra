'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

/** Destructive actions stay red (muted, on-system) regardless of the module accent. */
const DANGER = '#B4503C'

interface DeleteEntityButtonProps {
  table: string
  id: string
  /** Short label used inside the confirmation dialog, e.g. "ce deck", "cette fiche". */
  entityLabel: string
  /** Visual style. `icon` is for list cards (small trash icon), `button` is for detail pages. */
  variant: 'icon' | 'button'
  /** Callback invoked after successful deletion (list-page use case). */
  onDeleted?: (id: string) => void
  /** Path to navigate to after successful deletion (detail-page use case). */
  redirectTo?: string
  /** Optional accent color for the detail-page button hover state. */
  color?: string
  /** When variant is `icon`, the cards are usually wrapped in a Link — we stop propagation. */
  stopPropagation?: boolean
}

export function DeleteEntityButton({
  table,
  id,
  entityLabel,
  variant,
  onDeleted,
  redirectTo,
  stopPropagation = true,
}: DeleteEntityButtonProps) {
  const [open, setOpen] = useState(false)

  function handleOpen(e: React.MouseEvent) {
    if (stopPropagation) {
      e.preventDefault()
      e.stopPropagation()
    }
    setOpen(true)
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Supprimer"
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          style={{ color: 'var(--ink-400)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${DANGER}15`; e.currentTarget.style.color = DANGER }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--ink-400)' }}
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
          style={{
            background: 'transparent',
            border: '1px solid var(--ink-200)',
            color: DANGER,
          }}
        >
          <Trash2 size={14} />Supprimer
        </button>
      )}

      {open && (
        <ConfirmDeleteDialog
          table={table}
          id={id}
          entityLabel={entityLabel}
          onClose={() => setOpen(false)}
          onDeleted={onDeleted}
          redirectTo={redirectTo}
        />
      )}
    </>
  )
}

interface ConfirmDeleteDialogProps {
  table: string
  id: string
  entityLabel: string
  onClose: () => void
  onDeleted?: (id: string) => void
  redirectTo?: string
}

function ConfirmDeleteDialog({
  table,
  id,
  entityLabel,
  onClose,
  onDeleted,
  redirectTo,
}: ConfirmDeleteDialogProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleConfirm() {
    setDeleting(true)
    setError('')
    const { error: err } = await supabase.from(table).delete().eq('id', id)
    if (err) {
      setError(err.message || 'Erreur lors de la suppression')
      setDeleting(false)
      return
    }
    toast.success('Supprimé')
    onDeleted?.(id)
    if (redirectTo) router.push(redirectTo)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
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
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Supprimer {entityLabel} ?</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-500)' }}>
              Cette action est définitive et ne peut pas être annulée.
            </p>
          </div>
        </div>

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
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--ink-200)',
              color: 'var(--ink-700)',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: DANGER }}
          >
            {deleting && <Loader2 size={12} className="animate-spin" />}
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}
