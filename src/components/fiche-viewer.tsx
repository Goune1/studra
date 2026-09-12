'use client'

import { useState } from 'react'
import { Check, Eye, FloppyDisk, PencilSimple, X } from '@phosphor-icons/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import styles from './fiche-viewer.module.css'

interface FicheViewerProps {
  content: string
  ficheId?: string
}

export function FicheViewer({ content, ficheId }: FicheViewerProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const [saved, setSaved] = useState(content)
  const [saving, setSaving] = useState(false)
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit')

  async function handleSave() {
    if (!ficheId) return
    setSaving(true)
    try {
      const response = await fetch(`/api/fiches/${ficheId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated_content: draft }),
      })
      if (!response.ok) throw new Error()
      setSaved(draft)
      setEditing(false)
      toast.success('Fiche sauvegardée')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraft(saved)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className={styles.viewer}>
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            <button type="button" className={styles.tab} data-active={previewTab === 'edit'} onClick={() => setPreviewTab('edit')}>
              <PencilSimple size={14} /> Éditer
            </button>
            <button type="button" className={styles.tab} data-active={previewTab === 'preview'} onClick={() => setPreviewTab('preview')}>
              <Eye size={14} /> Aperçu
            </button>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={handleCancel} className={styles.secondaryButton}>
              <X size={14} /> Annuler
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className={styles.primaryButton}>
              {saving ? <Check size={14} /> : <FloppyDisk size={14} />}
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {previewTab === 'edit' ? (
          <div>
            <p className={styles.helperText}>Markdown supporté : **gras**, *italique*, ## Titre, - liste, etc.</p>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className={styles.editor}
              spellCheck={false}
            />
          </div>
        ) : (
          <div className={styles.preview}>
            <div className={styles.prose}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.viewer}>
      {ficheId && (
        <div className={styles.editAction}>
          <button type="button" onClick={() => setEditing(true)} className={styles.secondaryButton}>
            <PencilSimple size={14} /> Modifier la fiche
          </button>
        </div>
      )}
      <div className={styles.prose}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{saved}</ReactMarkdown>
      </div>
    </div>
  )
}
