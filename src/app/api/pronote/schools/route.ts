import { NextResponse } from 'next/server'
import { geolocation } from 'pawnote'

export const runtime = 'nodejs'

interface PronoteSchool {
  name: string
  url: string
  distance: number
}

export async function POST(request: Request) {
  const body = await request.json() as { latitude?: unknown; longitude?: unknown }
  const { latitude, longitude } = body

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return NextResponse.json(
      { error: 'Coordonnees invalides' },
      { status: 400 },
    )
  }

  try {
    const schools = await geolocation({ latitude, longitude }) as PronoteSchool[]
    return NextResponse.json(
      schools.map((s) => ({ name: s.name, url: s.url, distance: s.distance })),
    )
  } catch {
    return NextResponse.json(
      { error: 'Impossible de rechercher les etablissements. Verifiez votre connexion.' },
      { status: 500 },
    )
  }
}
