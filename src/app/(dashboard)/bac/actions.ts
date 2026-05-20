'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash } from 'crypto'

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex')
}

export async function unlockBac(_prevState: string | null, formData: FormData): Promise<string | null> {
  const password = formData.get('password') as string
  const expected = process.env.BAC_BETA_PASSWORD

  if (!expected || password !== expected) {
    return 'Mot de passe incorrect.'
  }

  const cookieStore = await cookies()
  cookieStore.set('bac_beta_access', hashPassword(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    path: '/',
  })

  redirect('/bac')
}
