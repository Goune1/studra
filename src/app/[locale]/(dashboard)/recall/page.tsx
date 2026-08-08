import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import { redirect } from 'next/navigation'

export default async function RecallIndexPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
  redirect('/recall/new')
}
