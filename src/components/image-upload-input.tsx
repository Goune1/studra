'use client'

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useImageCompressor } from '@/hooks/use-image-compressor'
import { ImageIcon, CheckCircle, XCircle, Loader2, X } from 'lucide-react'

export interface ImageUploadInputProps {
  onTextExtracted: (text: string) => void
  onError?: () => void
  disabled?: boolean
}

type FileStatus = 'compressing' | 'extracting' | 'done' | 'error'

interface FileEntry {
  id: string
  name: string
  previewUrl: string
  status: FileStatus
}

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
const ACCEPTED_EXT = /\.(jpe?g|png|webp|heic)$/i
const MAX_FILES = 5

function isAccepted(file: File) {
  return ACCEPTED_TYPES.has(file.type) || ACCEPTED_EXT.test(file.name)
}

const STATUS_ICON: Record<FileStatus, React.ReactNode> = {
  compressing: <Loader2 size={12} className="animate-spin text-gray-400" />,
  extracting: <Loader2 size={12} className="animate-spin text-violet-400" />,
  done: <CheckCircle size={12} className="text-emerald-400" />,
  error: <XCircle size={12} className="text-red-400" />,
}

const STATUS_LABEL: Record<FileStatus, string> = {
  compressing: 'Compression…',
  extracting: 'Extraction…',
  done: 'Extrait',
  error: 'Erreur',
}

export function ImageUploadInput({ onTextExtracted, onError, disabled }: ImageUploadInputProps) {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { compress } = useImageCompressor()

  const updateEntry = useCallback((id: string, patch: Partial<FileEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }, [])

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id)
      if (entry) URL.revokeObjectURL(entry.previewUrl)
      return prev.filter((e) => e.id !== id)
    })
  }, [])

  const processFile = useCallback(
    async (file: File): Promise<string | null> => {
      const id = crypto.randomUUID()
      const previewUrl = URL.createObjectURL(file)

      // HEIC: test native support via createImageBitmap before adding to list
      const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.heic$/i.test(file.name)
      if (isHeic) {
        try {
          const bm = await createImageBitmap(file)
          bm.close()
        } catch {
          toast.error('Format HEIC non supporté sur ce navigateur, convertis en JPG avant d\'importer.')
          URL.revokeObjectURL(previewUrl)
          return null
        }
      }

      setEntries((prev) => [...prev, { id, name: file.name, previewUrl, status: 'compressing' }])

      try {
        const { blob } = await compress(file)

        updateEntry(id, { status: 'extracting' })

        const fd = new FormData()
        fd.append('image', blob, 'image.jpg')
        const res = await fetch('/api/extract-image-text', { method: 'POST', body: fd })
        const json = await res.json()

        if (!res.ok || json.error === 'EXTRACTION_FAILED') {
          updateEntry(id, { status: 'error' })
          toast.error(
            'Désolé, nous n\'avons pas réussi à lire cette image. Essaie avec une photo mieux éclairée ou un meilleur contraste.',
          )
          return null
        }

        updateEntry(id, { status: 'done' })
        return json.text as string
      } catch {
        updateEntry(id, { status: 'error' })
        toast.error('Une erreur est survenue, réessaie.')
        onError?.()
        return null
      }
    },
    [compress, updateEntry, onError],
  )

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      if (disabled) return
      const valid = Array.from(incoming).filter(isAccepted)
      const slots = MAX_FILES - entries.filter((e) => e.status !== 'error').length
      const toProcess = valid.slice(0, slots)

      if (toProcess.length === 0) return
      if (valid.length > slots) toast.error(`Maximum ${MAX_FILES} images à la fois`)

      const results = await Promise.all(toProcess.map(processFile))
      const texts = results.filter(Boolean) as string[]

      if (texts.length > 0) {
        onTextExtracted(texts.join('\n\n---\n\n'))
        toast.success('Texte extrait avec succès — il a été ajouté à ton cours.')
      }
    },
    [disabled, entries, processFile, onTextExtracted],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const busy = entries.some((e) => e.status === 'compressing' || e.status === 'extracting')

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !disabled && !busy && inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-5 px-4 text-center transition-colors"
        style={{
          borderColor: dragging ? '#6366f1' : 'rgba(255,255,255,0.12)',
          background: dragging ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
          cursor: disabled || busy ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.heic"
          multiple
          className="hidden"
          disabled={disabled || busy}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {busy ? (
          <Loader2 size={20} className="animate-spin text-violet-400" />
        ) : (
          <ImageIcon size={20} className="text-gray-500" />
        )}
        <div>
          <p className="text-sm font-medium text-gray-300">
            {busy ? 'Extraction en cours…' : 'Importer une photo de cours'}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            JPG, PNG, WEBP, HEIC · Max {MAX_FILES} photos
          </p>
        </div>
      </div>

      {/* Thumbnails */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.previewUrl}
                alt={entry.name}
                className="w-full h-full object-cover"
              />
              {/* Status overlay */}
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-0.5">
                {STATUS_ICON[entry.status]}
                <span className="text-[9px] text-white/80 leading-tight">{STATUS_LABEL[entry.status]}</span>
              </div>
              {/* Remove button — only when not in progress */}
              {(entry.status === 'done' || entry.status === 'error') && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeEntry(entry.id) }}
                  className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5 hover:bg-black/90 transition-colors"
                >
                  <X size={10} className="text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
