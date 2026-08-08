import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import { redirect } from 'next/navigation'

export default async function SocrateIndexPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
  redirect('/socrate/new')
}
