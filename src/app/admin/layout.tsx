import type {Metadata} from 'next'
import {RootDocument} from '@/components/root-document'
import '@/app/globals.css'

export const metadata: Metadata = {
  robots: {index: false, follow: false},
  alternates: {canonical: null},
}

export default function AdminRootLayout({children}: {children: React.ReactNode}) {
  return <RootDocument lang="fr">{children}</RootDocument>
}
