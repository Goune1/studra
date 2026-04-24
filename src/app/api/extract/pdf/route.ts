import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const allowed = await checkRateLimit(user.id, 'extract:pdf', 20, 3600)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de fichiers. Réessayez dans une heure.' },
      { status: 429 },
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Le fichier doit être un PDF' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Le fichier ne doit pas dépasser 10 Mo' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  // Dynamic import to avoid Next.js bundling issues
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)

  const text = data.text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100000)

  if (text.length < 50) {
    return NextResponse.json({ error: 'Le PDF ne contient pas assez de texte extractible' }, { status: 400 })
  }

  return NextResponse.json({ text, pages: data.numpages })
}
