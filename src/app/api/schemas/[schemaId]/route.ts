import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SchemaData } from '@/types'

export async function PATCH(request: Request, { params }: { params: Promise<{ schemaId: string }> }) {
  const { schemaId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json().catch(() => null) as { generated_data?: SchemaData } | null
  const generated_data = body?.generated_data

  if (!generated_data || !Array.isArray(generated_data.nodes) || !Array.isArray(generated_data.edges)) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  // Hard cap to prevent abuse
  if (generated_data.nodes.length > 200 || generated_data.edges.length > 500) {
    return NextResponse.json({ error: 'Schéma trop volumineux' }, { status: 400 })
  }

  const { error } = await supabase
    .from('schemas')
    .update({ generated_data, updated_at: new Date().toISOString() })
    .eq('id', schemaId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
