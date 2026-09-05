import PageClient from './page-client'
import { getGenerationQuota } from '@/lib/generation-quota'
import { getProPriceDisplay } from '@/lib/stripe'

export default async function Page() {
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
