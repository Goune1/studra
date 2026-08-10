import type {Locale} from 'next-intl'
import {getTranslations, setRequestLocale} from 'next-intl/server'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LandingTracker } from '@/components/landing/LandingTracker'
import { LandingJsonLd }  from '@/components/landing/LandingJsonLd'
import Nav      from '@/components/landing/nav/Nav'
import Hero     from '@/components/landing/hero/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Features from '@/components/landing/features/Features'
import Method   from '@/components/landing/Method'
import Pricing  from '@/components/landing/Pricing'
import FAQ      from '@/components/landing/FAQ'
import { SeoLinks } from '@/components/landing/SeoLinks'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer   from '@/components/landing/Footer'
import {localizedMetadata} from '@/lib/seo-i18n'

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale: locale as Locale, namespace: 'landing.metadata'})

  return localizedMetadata({
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      siteName: 'Studra',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  }, '/', locale)
}

export default async function LandingPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
  return (
    <div className="landing-v2">
      <LandingJsonLd />
      <Suspense fallback={null}>
        <LandingTracker />
      </Suspense>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Method />
        <Pricing />
        <FAQ />
        <SeoLinks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
