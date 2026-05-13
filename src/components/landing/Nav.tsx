import { getUser } from '@/lib/supabase/get-user'
import { NavClient } from './NavClient'

export async function Nav() {
  const user = await getUser()
  return <NavClient isLoggedIn={!!user} />
}
