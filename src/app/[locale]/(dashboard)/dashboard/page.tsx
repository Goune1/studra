import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import { getDashboardData } from '@/lib/dashboard/queries'
import { DashboardTracker } from '@/components/dashboard/DashboardTracker'
import { DashboardEmpty } from '@/components/dashboard/DashboardEmpty'
import { DashboardActive } from '@/components/dashboard/DashboardActive'

const WEEKDAYS = ['DIM.', 'LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.']
const MONTHS = ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE']

function formatDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export default async function DashboardPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
  const data = await getDashboardData()
  const dateLabel = formatDate(new Date())
  const isNewUser = data.dueCards === 0 && data.recentItems.length === 0 && data.todayTasks.length === 0

  return (
    <>
      <DashboardTracker />
      {isNewUser ? (
        <DashboardEmpty user={data.user} dateLabel={dateLabel} upcomingExams={data.upcomingExams} />
      ) : (
        <DashboardActive data={data} dateLabel={dateLabel} />
      )}
    </>
  )
}
