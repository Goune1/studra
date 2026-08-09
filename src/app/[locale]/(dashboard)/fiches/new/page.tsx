import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import PageClient from './page-client'
import { getGenerationQuota } from '@/lib/generation-quota'
import { getProPriceDisplay } from '@/lib/stripe'

type Props = {
  params: Promise<{locale: string}>
}

export default async function Page({params}: Props) {
  const {locale} = await params
  setRequestLocale(locale as Locale)

  const quota = await getGenerationQuota()
  const showPaywall = !!quota && !quota.isPro && quota.remaining !== null && quota.remaining <= 0

  let price: string | null = null
  if (showPaywall) {
    try {
      price = await getProPriceDisplay()
    } catch (err) {
      console.error('Failed to fetch Stripe price for paywall:', err)
    }
  }

  return <PageClient showPaywall={showPaywall} price={price} />
}
