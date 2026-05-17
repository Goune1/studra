import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CampaignComposer } from '@/components/admin/emails/CampaignComposer'
import { Sidebar } from '@/components/admin/Sidebar'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = { title: 'Nouvelle campagne — Admin Studra' }

export default async function NewCampaignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) redirect('/')

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex">
      <Sidebar />
      <main className="flex-1 ml-12 xl:ml-[220px] min-h-screen flex flex-col">
        <div className="flex items-center gap-3 px-5 pt-5 pb-0">
          <Link
            href="/admin/emails"
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Campagnes
          </Link>
          <span className="text-[#333] text-xs">/</span>
          <h1 className="text-sm font-semibold text-white">Nouvelle campagne</h1>
        </div>
        <div className="flex-1 p-5">
          <CampaignComposer />
        </div>
      </main>
    </div>
  )
}
