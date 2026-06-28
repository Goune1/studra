'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

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
  color = '#EF4444',
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
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-red-500/10 hover:text-red-400 text-[#475569]"
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
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
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
          color={color}
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
  color: string
  onClose: () => void
  onDeleted?: (id: string) => void
  redirectTo?: string
}

function ConfirmDeleteDialog({
  table,
  id,
  entityLabel,
  color,
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
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: color + '15' }}
          >
            <AlertTriangle size={16} style={{ color }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Supprimer {entityLabel} ?</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
              Cette action est définitive et ne peut pas être annulée.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">
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
              border: '1px solid var(--border)',
              color: 'var(--text-2)',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: color }}
          >
            {deleting && <Loader2 size={12} className="animate-spin" />}
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}
