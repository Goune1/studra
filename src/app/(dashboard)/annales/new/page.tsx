'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, FileText, Sparkles } from 'lucide-react'
import ContentPicker from '@/components/ContentPicker'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { ContentItem } from '@/types'

const COLOR = '#1F4D3F'

export default function AnnalesNewPage() {
  const [examText, setExamText] = useState('')
  const [examFile, setExamFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [courseContent, setCourseContent] = useState<ContentItem | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleFileUpload(file: File) {
    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés')
      return
    }
    setExamFile(file)
    setExtracting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract/pdf', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erreur extraction PDF'); return }
      setExamText(json.text)
      toast.success(`PDF extrait (${json.pages} page${json.pages > 1 ? 's' : ''})`)
    } catch {
      toast.error('Erreur lors de la lecture du PDF')
    } finally {
      setExtracting(false)
    }
  }

  async function handleGenerate() {
    if (!examText || !courseContent || !title) return
    setLoading(true)
    try {
      const res = await fetch('/api/generate/annales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_text: examText,
          course_content: courseContent.source_content,
          title,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erreur lors de la génération'); return }
      toast.success('Annale générée !')
      router.push(`/annales/${json.examId}`)
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = examText.length >= 100 && courseContent && title.trim()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <Eyebrow className="mb-2">Annales</Eyebrow>
        <h1 className="section-h">Générer une annale</h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--ink-500)' }}>
          Uploade une ancienne annale, choisis ton cours — Studra génère un nouveau sujet dans le même style avec corrigé.
        </p>
      </div>

      {/* Step 1: annale upload */}
      <div
        className="rounded-2xl p-6 mb-4 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '60ms' }}
      >
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
          1. Ancienne annale
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--ink-500)' }}>
          Dépose un PDF ou colle le texte de l&apos;examen
        </p>

        {/* PDF drop zone */}
        <label
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 mb-3 cursor-pointer transition-colors"
          style={{
            borderColor: examFile ? COLOR + '50' : 'var(--ink-200)',
            background: 'var(--surface-2)',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f) handleFileUpload(f)
          }}
        >
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFileUpload(f)
            }}
          />
          {extracting ? (
            <p className="text-sm" style={{ color: 'var(--ink-500)' }}>Extraction…</p>
          ) : examFile ? (
            <div className="flex items-center gap-2">
              <FileText size={16} style={{ color: COLOR }} />
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{examFile.name}</p>
            </div>
          ) : (
            <>
              <Upload size={20} style={{ color: 'var(--ink-400)' }} />
              <p className="text-sm" style={{ color: 'var(--ink-500)' }}>
                Dépose un PDF ici ou clique pour sélectionner
              </p>
            </>
          )}
        </label>

        <p className="mono text-xs text-center mb-2" style={{ color: 'var(--ink-400)' }}>ou</p>

        <textarea
          value={examText}
          onChange={(e) => setExamText(e.target.value)}
          placeholder="Colle ici le texte de l'ancienne annale…"
          rows={6}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-colors"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--ink)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
        {examText.length > 0 && (
          <p className="mono text-xs mt-1" style={{ color: 'var(--ink-500)' }}>
            {examText.length} caractères extraits
          </p>
        )}
      </div>

      {/* Step 2: course content */}
      <div
        className="rounded-2xl p-6 mb-4 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '90ms' }}
      >
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
          2. Cours source
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--ink-500)' }}>
          Sélectionne le cours sur lequel générer le nouveau sujet
        </p>
        <ContentPicker selected={courseContent} onSelect={setCourseContent} />
      </div>

      {/* Step 3: title */}
      <div
        className="rounded-2xl p-5 mb-4 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '120ms' }}
      >
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>
          3. Titre du sujet généré
        </h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Examen — Chapitre 3 — La photosynthèse"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--ink)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!canGenerate || loading}
        className="btn btn-primary w-full animate-fade-up"
        style={{ padding: '14px', fontSize: '14px', animationDelay: '150ms' }}
      >
        <Sparkles size={15} />
        {loading ? 'Génération en cours…' : 'Générer le sujet'}
      </button>

      <p className="mono text-xs text-center mt-3" style={{ color: 'var(--ink-400)' }}>
        Compte comme 1 génération sur ton quota mensuel
      </p>
    </div>
  )
}
