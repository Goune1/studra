import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="border-b border-white/10 px-4 sm:px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">
          Studra
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-medium transition-colors">
              Tableau de bord
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                Connexion
              </Link>
              <Link href="/register" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-medium transition-colors">
                Commencer
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
