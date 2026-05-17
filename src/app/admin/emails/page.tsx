import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CampaignList } from '@/components/admin/emails/CampaignList'
import { Sidebar } from '@/components/admin/Sidebar'

export const metadata = { title: 'Campagnes email — Admin Studra' }

export default async function AdminEmailsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) redirect('/')

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex">
      <Sidebar />
      <main className="flex-1 ml-12 xl:ml-[220px] min-h-screen">
        <div className="p-5 max-w-[900px]">
          <CampaignList />
        </div>
      </main>
    </div>
  )
}
