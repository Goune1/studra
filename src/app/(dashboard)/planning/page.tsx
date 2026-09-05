import type {Metadata} from 'next'
import PageClient from './page-client'

export default function Page() {
  return <PageClient />
}

export const metadata: Metadata = {title: 'Mes plannings'}
