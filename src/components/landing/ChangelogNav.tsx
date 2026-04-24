import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function ChangelogNav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="sticky top-0 z-50 backdrop-blur-[14px] bg-[rgba(7,7,11,0.72)] border-b border-line">
      <nav className="max-w-[1240px] mx-auto flex items-center justify-between px-7 py-3.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[18px] tracking-[-0.02em] font-semibold text-fg"
        >
          <span className="logo-mark w-[26px] h-[26px] rounded-[7px] bg-accent-gradient relative shadow-[0_0_24px_rgba(99,102,241,0.55)]" />
          <span>Studra</span>
        </Link>

        {user ? (
          <Link href="/dashboard" className="btn btn-primary">
            Accéder à l&apos;application <span className="arrow">→</span>
          </Link>
        ) : (
          <Link href="/login" className="btn btn-ghost">
            Se connecter
          </Link>
        )}
      </nav>
    </div>
  )
}
