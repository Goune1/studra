import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSessionHandle, loginCredentials, AccountKind } from 'pawnote'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const body = await request.json() as {
    instanceUrl?: unknown
    username?: unknown
    password?: unknown
  }

  const { instanceUrl, username, password } = body

  if (
    typeof instanceUrl !== 'string' || !instanceUrl ||
    typeof username !== 'string' || !username ||
    typeof password !== 'string' || !password
  ) {
    return NextResponse.json(
      { error: 'Donnees de connexion invalides' },
      { status: 400 },
    )
  }

  const deviceUUID = crypto.randomUUID()

  let refreshToken: string
  try {
    const handle = createSessionHandle()
    const session = await loginCredentials(handle, {
      url: instanceUrl,
      kind: AccountKind.STUDENT,
      username,
      password,
      deviceUUID,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    refreshToken = (session as any).token as string
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.toLowerCase().includes('password') || message.toLowerCase().includes('mot de passe')) {
      return NextResponse.json(
        { error: 'Identifiant ou mot de passe incorrect' },
        { status: 400 },
      )
    }
    if (message.toLowerCase().includes('url') || message.toLowerCase().includes('etablissement')) {
      return NextResponse.json(
        { error: 'URL de l\'etablissement invalide ou inaccessible' },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { error: 'Impossible de se connecter a Pronote. Verifiez vos identifiants.' },
      { status: 500 },
    )
  }

  const { error: dbError } = await supabase
    .from('pronote_connections')
    .upsert(
      {
        user_id: user.id,
        instance_url: instanceUrl,
        username,
        account_kind: 'student',
        refresh_token: refreshToken,
        device_uuid: deviceUUID,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (dbError) {
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde de la connexion' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
