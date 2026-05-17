'use client'

interface EmailPreviewProps {
  subject: string
  html: string
  height?: number
}

export function EmailPreview({ subject, html, height = 560 }: EmailPreviewProps) {
  if (!html) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2a2a2a] bg-[#111]"
        style={{ height }}
      >
        <div className="text-2xl mb-2 opacity-20">✉</div>
        <p className="text-xs text-gray-600">La preview apparaîtra ici après génération</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {subject && (
        <div className="flex items-center gap-2 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2">
          <span className="font-mono text-[10px] text-gray-600 uppercase tracking-wide shrink-0">Objet</span>
          <span className="text-xs text-gray-300 truncate">{subject}</span>
        </div>
      )}
      <iframe
        srcDoc={html}
        sandbox="allow-same-origin"
        className="w-full rounded-lg border border-[#2a2a2a]"
        style={{ height }}
        title="Prévisualisation email"
      />
    </div>
  )
}
