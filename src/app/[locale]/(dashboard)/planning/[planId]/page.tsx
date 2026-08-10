import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import PageClient from './page-client'

type Props = {
  params: Promise<{locale: string}>
}

export default async function Page({params}: Props) {
  const {locale} = await params
  setRequestLocale(locale as Locale)

  return <PageClient />
}
