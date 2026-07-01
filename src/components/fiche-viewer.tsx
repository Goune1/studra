'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

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
      const res = await fetch(`/api/fiches/${ficheId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated_content: draft }),
      })
      if (!res.ok) throw new Error()
      setSaved(draft)
      setEditing(false)
      toast.success('Fiche sauvegardée !')
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

  const proseClasses = `prose prose-neutral max-w-none
    prose-headings:font-semibold prose-headings:text-[color:var(--ink)]
    prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:border-[color:var(--ink-200)] prose-h2:pb-2
    prose-p:text-[color:var(--ink-700)]
    prose-strong:text-[color:var(--ink)]
    prose-ul:text-[color:var(--ink-700)]
    prose-ol:text-[color:var(--ink-700)]
    prose-li:marker:text-[color:var(--accent)]
    prose-code:text-[color:var(--accent)] prose-code:bg-[color:var(--accent-soft)] prose-code:px-1 prose-code:rounded
    prose-blockquote:border-[color:var(--accent)] prose-blockquote:text-[color:var(--ink-500)]`

  if (editing) {
    return (
      <div>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--ink-200)' }}>
            <button
              onClick={() => setPreviewTab('edit')}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={previewTab === 'edit' ? { background: 'var(--accent)', color: 'var(--accent-fg)' } : { color: 'var(--ink-500)' }}
            >
              ✏️ Éditer
            </button>
            <button
              onClick={() => setPreviewTab('preview')}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={previewTab === 'preview' ? { background: 'var(--accent)', color: 'var(--accent-fg)' } : { color: 'var(--ink-500)' }}
            >
              👁️ Aperçu
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCancel} className="btn btn-outline">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? '⟳ Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Editor / Preview */}
        {previewTab === 'edit' ? (
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--ink-500)' }}>Markdown supporté : **gras**, *italique*, ## Titre, - liste, etc.</p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full min-h-[60vh] px-4 py-3 rounded-xl outline-none transition-colors resize-y text-sm font-mono leading-relaxed"
              style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', color: 'var(--ink)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--ink-200)')}
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="min-h-[60vh] rounded-xl px-6 py-5" style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}>
            <div className={proseClasses}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {ficheId && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setEditing(true)} className="btn btn-outline">
            ✏️ Modifier la fiche
          </button>
        </div>
      )}
      <div className={proseClasses}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{saved}</ReactMarkdown>
      </div>
    </div>
  )
}
