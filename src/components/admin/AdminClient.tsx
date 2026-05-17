'use client'

import { useState } from 'react'
import { KpiStrip }     from './KpiStrip'
import { NewUsersChart } from './NewUsersChart'
import { MembresTable } from './MembresTable'
import { MemberPanel }  from './MemberPanel'
import type { AdminUser } from '@/lib/admin/mock-data'

interface Props {
  users: AdminUser[]
}

export function AdminClient({ users }: Props) {
  const [selectedMember, setSelectedMember] = useState<AdminUser | null>(null)

  return (
    <>
      <KpiStrip users={users} />
      <NewUsersChart users={users} />
      <MembresTable
        users={users}
        onSelectMember={setSelectedMember}
        selectedMemberId={selectedMember?.id ?? null}
      />
      <MemberPanel
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </>
  )
}
