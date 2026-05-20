import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSessionHandle, loginQrCode } from 'pawnote'
import type { Fetcher } from '@literate.ink/utilities'
import jsQR from 'jsqr'

export const runtime = 'nodejs'

interface QrPayload {
  jeton: string
  login: string
  url: string
}

interface QrRefresh {
  url: string
  username: string
  kind: string
  token: string
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

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

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  // Parse FormData
  const formData = await request.formData()
  const imageFile = formData.get('image')
  const pin = formData.get('pin')

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return NextResponse.json({ error: 'Image du QR code manquante' }, { status: 400 })
  }

  if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
    return NextResponse.json(
      { error: 'Format d\'image non supporte. Utilise PNG, JPEG ou WEBP.' },
      { status: 400 },
    )
  }

  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { error: 'Le code PIN doit contenir exactement 4 chiffres' },
      { status: 400 },
    )
  }

  // Decode QR code from image
  let parsed: QrPayload
  try {
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { createCanvas, loadImage } = await import('canvas')
    const img = await loadImage(buffer)
    const canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, img.width, img.height)

    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (!code) {
      return NextResponse.json(
        {
          error:
            'Aucun QR code detecte dans l\'image. Assure-toi que le QR code est bien visible et centre.',
        },
        { status: 400 },
      )
    }

    let raw: Record<string, unknown>
    try {
      raw = JSON.parse(code.data) as Record<string, unknown>
    } catch {
      return NextResponse.json(
        { error: 'Le QR code detecte n\'est pas un QR code Pronote valide.' },
        { status: 400 },
      )
    }

    if (
      typeof raw.jeton !== 'string' || !raw.jeton ||
      typeof raw.login !== 'string' || !raw.login ||
      typeof raw.url !== 'string' || !raw.url
    ) {
      return NextResponse.json(
        { error: 'Le QR code detecte n\'est pas un QR code Pronote valide.' },
        { status: 400 },
      )
    }

    parsed = { jeton: raw.jeton, login: raw.login, url: raw.url }
  } catch {
    return NextResponse.json(
      { error: 'Impossible de lire l\'image. Verifie que le fichier n\'est pas corrompu.' },
      { status: 400 },
    )
  }

  const deviceUUID = crypto.randomUUID()

  let refresh: QrRefresh
  try {
    const session = createSessionHandle(pronoteNodeFetcher)
    refresh = (await loginQrCode(session, {
      qr: {
        jeton: parsed.jeton,
        login: parsed.login,
        url: parsed.url,
      },
      pin,
      deviceUUID,
    })) as unknown as QrRefresh
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : ''
    if (message.includes('pin') || message.includes('code')) {
      return NextResponse.json(
        {
          error:
            'Code PIN incorrect. Verifie le code saisi lors de la generation du QR code.',
        },
        { status: 400 },
      )
    }
    if (message.includes('expir') || message.includes('expired')) {
      return NextResponse.json(
        {
          error:
            'Ce QR code a expire. Genere-en un nouveau depuis ton espace Pronote.',
        },
        { status: 400 },
      )
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connect')) {
      return NextResponse.json(
        {
          error:
            'Impossible de contacter le serveur Pronote. Verifie l\'URL de ton etablissement.',
        },
        { status: 500 },
      )
    }
    return NextResponse.json(
      {
        error:
          'Erreur lors de la connexion. Reessaie ou utilise la methode login/mot de passe.',
      },
      { status: 500 },
    )
  }

  const { error: dbError } = await supabase.from('pronote_connections').upsert(
    {
      user_id: user.id,
      instance_url: refresh.url,
      username: refresh.username,
      account_kind: String(refresh.kind),
      refresh_token: refresh.token,
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

  return NextResponse.json({ success: true, instanceUrl: refresh.url, username: refresh.username })
}
