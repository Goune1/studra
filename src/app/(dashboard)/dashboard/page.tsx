import { getDashboardData } from '@/lib/dashboard/queries'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardTracker } from '@/components/dashboard/DashboardTracker'
import { FocusBlock } from '@/components/dashboard/FocusBlock'
import { TodayList } from '@/components/dashboard/TodayList'
import { WeekProgress } from '@/components/dashboard/WeekProgress'
import { UpcomingExams } from '@/components/dashboard/UpcomingExams'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { CreateBar } from '@/components/dashboard/CreateBar'

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="max-w-5xl mx-auto">
      <DashboardTracker />
      <DashboardHeader user={data.user} />

      <FocusBlock
        user={data.user}
        dueCards={data.dueCards}
        dueDecks={data.dueDecks}
        reviewEstimateMin={data.reviewEstimateMin}
        todayTasks={data.todayTasks}
      />

      <TodayList tasks={data.todayTasks} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-6 mb-12">
        <WeekProgress week={data.week} />
        <UpcomingExams exams={data.upcomingExams} />
      </div>

      <div className="mb-12">
        <CreateBar />
      </div>

      <RecentActivity items={data.recentItems} />
    </div>
  )
}
