import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSessionHandle, loginToken, gradesOverview, TabLocation, AccountKind } from 'pawnote'
import type { Fetcher } from '@literate.ink/utilities'

export const runtime = 'nodejs'

interface PronoteConnection {
  instance_url: string
  username: string
  account_kind: string
  refresh_token: string
  device_uuid: string
}

function toAccountKind(kind: string): AccountKind {
  if (kind === 'student') return AccountKind.STUDENT
  return AccountKind.STUDENT
}

// Fix 1 : User-Agent mobile obligatoire, Pronote bloque les autres
const pronoteNodeFetcher: Fetcher = async (options) => {
  const response = await fetch(options.url, {
    method: options.method,
    headers: {
      ...options.headers,
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 PRONOTE Mobile APP Version/2.0.11',
    },
    body: options.method !== 'GET' ? options.content : undefined,
    redirect: options.redirect,
  })
  const content = await response.text()
  return {
    content,
    status: response.status,
    get headers() {
      return response.headers
    },
  }
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const { data: connection } = await supabase
    .from('pronote_connections')
    .select('instance_url, username, account_kind, refresh_token, device_uuid')
    .eq('user_id', user.id)
    .single() as { data: PronoteConnection | null }

  if (!connection) {
    return NextResponse.json(
      { error: 'Aucune connexion Pronote configuree' },
      { status: 404 },
    )
  }

  let rawData: unknown
  let newRefreshToken: string
  try {
    // Fix 2 : API Pawnote correcte
    const handle = createSessionHandle(pronoteNodeFetcher)
    const refresh = await loginToken(handle, {
      url: connection.instance_url,
      kind: toAccountKind(connection.account_kind),
      username: connection.username,
      token: connection.refresh_token,
      deviceUUID: connection.device_uuid,
    })

    newRefreshToken = refresh.token

    const gradeTab = handle.user.resources[0].tabs.get(TabLocation.Grades)
    const periods = gradeTab?.periods ?? []

    rawData = await Promise.all(
      periods.map(async (period) => {
        const overview = await gradesOverview(handle, period)
        return {
          period: { id: period.id, name: period.name },
          overallAverage: overview.overallAverage,
          classAverage: overview.classAverage,
          subjectsAverages: overview.subjectsAverages,
          grades: overview.grades,
        }
      }),
    )
  } catch (err) {
    // Fix 3 : logger l'erreur reelle pour debug
    console.error('[pronote/sync]', err)
    const message = err instanceof Error ? err.message : ''
    if (message.toLowerCase().includes('token') || message.toLowerCase().includes('expire')) {
      return NextResponse.json(
        { error: 'Session expiree. Veuillez vous reconnecter a Pronote.' },
        { status: 401 },
      )
    }
    return NextResponse.json(
      { error: 'Impossible de synchroniser avec Pronote. Reessayez dans quelques instants.' },
      { status: 500 },
    )
  }

  const now = new Date().toISOString()

  const { error: dbError } = await supabase
    .from('pronote_connections')
    .update({
      refresh_token: newRefreshToken,
      raw_data: rawData,
      last_synced_at: now,
      updated_at: now,
    })
    .eq('user_id', user.id)

  if (dbError) {
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des donnees' },
      { status: 500 },
    )
  }

  return NextResponse.json({ data: rawData, last_synced_at: now })
}
