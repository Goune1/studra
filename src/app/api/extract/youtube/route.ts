import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getYouTubeTranscript, extractVideoId } from '@/lib/youtube'
import { checkRateLimit } from '@/lib/rate-limit'

function userMessage(code: string): { message: string; status: number } {
  switch (code) {
    case 'NO_TRANSCRIPT_AVAILABLE':
      return { message: "Cette vidéo n'a pas de sous-titres disponibles.", status: 404 }
    case 'SUPADATA_QUOTA_EXCEEDED':
      return { message: 'Service temporairement indisponible, réessaie plus tard.', status: 503 }
    case 'SUPADATA_SERVER_ERROR':
      return { message: 'Erreur temporaire, réessaie dans quelques minutes.', status: 503 }
    case 'SUPADATA_INVALID_KEY':
    case 'SUPADATA_NOT_CONFIGURED':
      console.error(`[YouTube] Erreur de configuration Supadata : ${code}`)
      return { message: 'Erreur de configuration, contacte le support.', status: 500 }
    default:
      return { message: "Impossible d'extraire le texte de cette vidéo.", status: 400 }
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const allowed = await checkRateLimit(user.id, 'extract:youtube', 30, 3600)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans une heure.' },
      { status: 429 },
    )
  }

  const body = await request.json()
  const { url } = body as { url: string }

  if (!url) return NextResponse.json({ error: 'URL requise' }, { status: 400 })
  if (!extractVideoId(url)) return NextResponse.json({ error: 'URL YouTube invalide' }, { status: 400 })

  try {
    const text = (await getYouTubeTranscript(url)).slice(0, 100000)

    if (text.length < 50) {
      return NextResponse.json({ error: 'La transcription est trop courte ou vide' }, { status: 400 })
    }

    return NextResponse.json({ text })
  } catch (err) {
    const code = err instanceof Error ? err.message : ''
    const { message, status } = userMessage(code)
    return NextResponse.json({ error: message }, { status })
  }
}
