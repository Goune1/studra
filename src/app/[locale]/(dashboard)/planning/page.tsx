import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import {getTranslations} from 'next-intl/server'
import type {Metadata} from 'next'
import PageClient from './page-client'

type Props = {
  params: Promise<{locale: string}>
}

export default async function Page({params}: Props) {
  const {locale} = await params
  setRequestLocale(locale as Locale)

  return <PageClient />
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale: locale as Locale, namespace: 'dashboard.planning'})
  return {title: t('listTitle')}
}
