import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar }     from '@/components/admin/Sidebar'
import { AdminClient } from '@/components/admin/AdminClient'
import { fetchAdminUsers } from '@/lib/admin/queries'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) redirect('/')

  const users = await fetchAdminUsers()

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex">
      <Sidebar />
      <main className="flex-1 ml-12 xl:ml-[220px] min-h-screen transition-all duration-300">
        <div className="p-5 max-w-[1400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-base font-semibold text-white">Membres</h1>
              <p className="font-mono text-xs text-gray-600 mt-0.5">
                {users.length} compte{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
              </p>
            </div>
            <span className="font-mono text-[10px] text-gray-600 border border-[#222] rounded px-2 py-1">
              {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <AdminClient users={users} />
        </div>
      </main>
    </div>
  )
}
