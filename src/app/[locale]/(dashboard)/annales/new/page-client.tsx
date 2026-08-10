'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { Upload, FileText, Sparkles } from 'lucide-react'
import ContentPicker from '@/components/ContentPicker'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { ContentItem } from '@/types'

const COLOR = '#1F4D3F'

export default function AnnalesNewPage() {
  const t = useTranslations('dashboard.annales')
  const [examText, setExamText] = useState('')
  const [examFile, setExamFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [courseContent, setCourseContent] = useState<ContentItem | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleFileUpload(file: File) {
    if (file.type !== 'application/pdf') {
      toast.error(t('toast.pdfOnly'))
      return
    }
    setExamFile(file)
    setExtracting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract/pdf', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? t('toast.extractError')); return }
      setExamText(json.text)
      toast.success(t('toast.pdfSuccess', {pages: json.pages}))
    } catch {
      toast.error(t('toast.readError'))
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
      if (!res.ok) { toast.error(json.error ?? t('toast.generationError')); return }
      toast.success(t('toast.success'))
      router.push(`/annales/${json.examId}`)
    } catch {
      toast.error(t('toast.unexpected'))
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = examText.length >= 100 && courseContent && title.trim()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <Eyebrow className="mb-2">{t('eyebrow')}</Eyebrow>
        <h1 className="section-h">{t('newPage.title')}</h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--ink-500)' }}>
          {t('newPage.description')}
        </p>
      </div>

      {/* Step 1: annale upload */}
      <div
        className="rounded-2xl p-6 mb-4 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '60ms' }}
      >
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
          {t('newPage.stepExam')}
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--ink-500)' }}>
          {t('newPage.stepExamDescription')}
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
            <p className="text-sm" style={{ color: 'var(--ink-500)' }}>{t('newPage.extracting')}</p>
          ) : examFile ? (
            <div className="flex items-center gap-2">
              <FileText size={16} style={{ color: COLOR }} />
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{examFile.name}</p>
            </div>
          ) : (
            <>
              <Upload size={20} style={{ color: 'var(--ink-400)' }} />
              <p className="text-sm" style={{ color: 'var(--ink-500)' }}>
                {t('newPage.dropPdf')}
              </p>
            </>
          )}
        </label>

        <p className="mono text-xs text-center mb-2" style={{ color: 'var(--ink-400)' }}>{t('newPage.or')}</p>

        <textarea
          value={examText}
          onChange={(e) => setExamText(e.target.value)}
          placeholder={t('newPage.examPlaceholder')}
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
            {t('newPage.characters', {count: examText.length})}
          </p>
        )}
      </div>

      {/* Step 2: course content */}
      <div
        className="rounded-2xl p-6 mb-4 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '90ms' }}
      >
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
          {t('newPage.stepCourse')}
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--ink-500)' }}>
          {t('newPage.stepCourseDescription')}
        </p>
        <ContentPicker selected={courseContent} onSelect={setCourseContent} />
      </div>

      {/* Step 3: title */}
      <div
        className="rounded-2xl p-5 mb-4 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '120ms' }}
      >
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>
          {t('newPage.stepTitle')}
        </h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('newPage.titlePlaceholder')}
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
        {loading ? t('newPage.generating') : t('newPage.generate')}
      </button>

      <p className="mono text-xs text-center mt-3" style={{ color: 'var(--ink-400)' }}>
        {t('newPage.quota')}
      </p>
    </div>
  )
}
