import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_CONTENT = 100_000

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ficheId: string }> }
) {
  const { ficheId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const raw = (body as { generated_content?: unknown }).generated_content

  if (typeof raw !== 'string' || !raw) {
    return NextResponse.json({ error: 'Contenu invalide' }, { status: 400 })
  }
  if (raw.length > MAX_CONTENT) {
    return NextResponse.json(
      { error: `Contenu trop long (max ${MAX_CONTENT} caractères).` },
      { status: 400 },
    )
  }

  const { error } = await supabase
    .from('fiches')
    .update({ generated_content: raw })
    .eq('id', ficheId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
