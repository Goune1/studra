import { Supadata, SupadataError } from '@supadata/js'

// ── Client singleton ──────────────────────────────────────────────

const supadataClient = process.env.SUPADATA_API_KEY
  ? new Supadata({ apiKey: process.env.SUPADATA_API_KEY })
  : null

// ── URL helpers ───────────────────────────────────────────────────

export function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return match[1]
  }
  return null
}

// ── Supadata (production) ─────────────────────────────────────────

async function extractViaSupadata(videoId: string): Promise<string> {
  if (!supadataClient) throw new Error('SUPADATA_NOT_CONFIGURED')

  let result
  try {
    result = await supadataClient.youtube.transcript({ videoId, text: true })
  } catch (err) {
    if (err instanceof SupadataError) {
      switch (err.error) {
        case 'unauthorized':
          throw new Error('SUPADATA_INVALID_KEY')
        case 'upgrade-required':
        case 'limit-exceeded':
          throw new Error('SUPADATA_QUOTA_EXCEEDED')
        case 'transcript-unavailable':
        case 'not-found':
          throw new Error('NO_TRANSCRIPT_AVAILABLE')
        case 'internal-error':
          throw new Error('SUPADATA_SERVER_ERROR')
        default:
          throw new Error('SUPADATA_UNKNOWN_ERROR')
      }
    }
    throw new Error('SUPADATA_UNKNOWN_ERROR')
  }

  const text = typeof result.content === 'string'
    ? result.content
    : result.content.map(c => c.text).join(' ')

  return text.replace(/\s+/g, ' ').trim()
}

// ── Innertube Android (dev fallback) ─────────────────────────────

const ANDROID_USER_AGENT = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)'
const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false'
const INNERTUBE_CONTEXT = {
  client: { clientName: 'ANDROID', clientVersion: '20.10.38' },
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
}

function parseTranscriptXml(xml: string): string {
  const segments: string[] = []

  const pMatches = [...xml.matchAll(/<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g)]
  if (pMatches.length > 0) {
    for (const m of pMatches) {
      const inner = m[3]
      const sTags = [...inner.matchAll(/<s[^>]*>([^<]*)<\/s>/g)]
      const text = sTags.length > 0
        ? sTags.map(s => s[1]).join('')
        : inner.replace(/<[^>]+>/g, '')
      const decoded = decodeEntities(text).trim()
      if (decoded) segments.push(decoded)
    }
    return segments.join(' ').replace(/\s+/g, ' ').trim()
  }

  return [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
    .map(m => decodeEntities(m[1].replace(/<[^>]+>/g, '').trim()))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function extractViaInnertube(videoId: string): Promise<string> {
  const res = await fetch(INNERTUBE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': ANDROID_USER_AGENT },
    body: JSON.stringify({ context: INNERTUBE_CONTEXT, videoId }),
  })
  if (!res.ok) throw new Error(`Innertube ${res.status}`)

  const data = await res.json()
  const tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }> =
    data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []

  if (!tracks.length) throw new Error('NO_TRANSCRIPT_AVAILABLE')

  const manual = tracks.filter(t => t.kind !== 'asr')
  const preferred =
    manual.find(t => t.languageCode.startsWith('fr')) ||
    manual.find(t => t.languageCode.startsWith('en')) ||
    manual[0] ||
    tracks.find(t => t.languageCode.startsWith('fr')) ||
    tracks.find(t => t.languageCode.startsWith('en')) ||
    tracks[0]

  const xmlRes = await fetch(preferred!.baseUrl, { headers: { 'User-Agent': ANDROID_USER_AGENT } })
  if (!xmlRes.ok) throw new Error(`Innertube XML ${xmlRes.status}`)

  const text = parseTranscriptXml(await xmlRes.text())
  if (!text) throw new Error('NO_TRANSCRIPT_AVAILABLE')
  return text
}

// ── Public API ────────────────────────────────────────────────────

export async function getYouTubeTranscript(url: string): Promise<string> {
  const videoId = extractVideoId(url)
  const isDev = process.env.NODE_ENV !== 'production'
  const start = Date.now()

  if (isDev) {
    try {
      console.log(`[YouTube] dev — Innertube — ${videoId}`)
      const text = await extractViaInnertube(videoId!)
      console.log(`[YouTube] Innertube OK — ${Date.now() - start}ms — ${text.length} chars`)
      return text
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[YouTube] Innertube failed (${msg}), falling back to Supadata`)
    }
  }

  console.log(`[YouTube] Supadata — ${videoId}`)
  const text = await extractViaSupadata(videoId!)
  console.log(`[YouTube] Supadata OK — ${Date.now() - start}ms — ${text.length} chars`)
  return text
}
