'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleNotch, Trash, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import styles from './delete-entity-button.module.css'

interface DeleteEntityButtonProps {
  table: string
  id: string
  entityLabel: string
  variant: 'icon' | 'button'
  onDeleted?: (id: string) => void
  redirectTo?: string
  color?: string
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

  function handleOpen(event: React.MouseEvent) {
    if (stopPropagation) {
      event.preventDefault()
      event.stopPropagation()
    }
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Supprimer"
        className={variant === 'icon' ? styles.iconButton : styles.detailButton}
      >
        <Trash size={14} />
        {variant === 'button' && 'Supprimer'}
      </button>

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

function ConfirmDeleteDialog({ table, id, entityLabel, onClose, onDeleted, redirectTo }: ConfirmDeleteDialogProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleConfirm() {
    setDeleting(true)
    setError('')
    const { error: deleteError } = await supabase.from(table).delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message || 'Erreur lors de la suppression')
      setDeleting(false)
      return
    }
    toast.success('Supprimé')
    onDeleted?.(id)
    if (redirectTo) router.push(redirectTo)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title" onClick={(event) => event.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <span className={styles.warningIcon}><Warning size={16} /></span>
          <div>
            <h2 id="delete-dialog-title">Supprimer {entityLabel} ?</h2>
            <p>Cette action est définitive et ne peut pas être annulée.</p>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button type="button" onClick={onClose} disabled={deleting} className={styles.cancelButton}>Annuler</button>
          <button type="button" onClick={handleConfirm} disabled={deleting} className={styles.confirmButton}>
            {deleting && <CircleNotch size={13} className={styles.spinner} />}
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}
