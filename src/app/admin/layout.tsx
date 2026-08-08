import {RootDocument} from '@/components/root-document'
import '@/app/globals.css'

export default function AdminRootLayout({children}: {children: React.ReactNode}) {
  return <RootDocument lang="fr">{children}</RootDocument>
}
