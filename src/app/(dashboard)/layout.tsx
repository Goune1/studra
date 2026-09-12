import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import { Suspense } from 'react'
import { DashboardLayoutContent } from './dashboard-layout-content'
import { DashboardShellSkeleton } from '@/components/dashboard-shell-skeleton'
import styles from './dashboard-font.module.css'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-manrope',
  display: 'swap',
})

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${manrope.variable} ${manrope.className} ${styles.scope}`}>
      <Suspense fallback={<DashboardShellSkeleton />}>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </Suspense>
    </div>
  )
}
