import {Analytics} from '@vercel/analytics/next'
import {SpeedInsights} from '@vercel/speed-insights/next'
import {Geist, Geist_Mono} from 'next/font/google'
import {Suspense, type ReactNode} from 'react'
import {Toaster} from 'sonner'
import {AffiliateTracker} from '@/components/affiliate/AffiliateTracker'
import {ThemeProvider} from '@/contexts/ThemeContext'
import {PostHogProvider} from '@/app/providers'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})
type Props = {
  children: ReactNode
  lang: string
}

export function RootDocument({children, lang}: Props) {
  return (
    <html lang={lang} className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geist.className} ${geist.variable} ${geistMono.variable} min-h-screen`}
        style={{background: 'var(--app-bg)', color: 'var(--text-1)', transition: 'background 0.2s, color 0.2s'}}
      >
        <PostHogProvider>
          <ThemeProvider>
            <Suspense fallback={null}>
              <AffiliateTracker />
            </Suspense>
            {children}
          </ThemeProvider>
        </PostHogProvider>
        <Toaster position="top-right" />
        {process.env.VERCEL && <Analytics />}
        {process.env.VERCEL && <SpeedInsights />}
      </body>
    </html>
  )
}
