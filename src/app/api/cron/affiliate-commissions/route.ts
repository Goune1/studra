import { NextResponse } from 'next/server'
import { releaseMatureCommissions } from '@/lib/affiliate'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const matured = await releaseMatureCommissions()
    return NextResponse.json({ ok: true, matured })
  } catch (error) {
    console.error('Affiliate maturity cron failed:', error)
    return NextResponse.json({ error: 'Échec du traitement' }, { status: 500 })
  }
}
