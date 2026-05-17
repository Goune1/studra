export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div
        className="mb-8 h-8 w-2/5 rounded-lg"
        style={{ background: 'var(--surface-2)' }}
      />
      <div className="flex flex-col gap-4">
        <div className="h-24 rounded-xl" style={{ background: 'var(--surface-2)' }} />
        <div className="h-24 rounded-xl" style={{ background: 'var(--surface-2)' }} />
        <div className="h-24 rounded-xl" style={{ background: 'var(--surface-2)' }} />
        <div className="h-24 rounded-xl" style={{ background: 'var(--surface-2)' }} />
      </div>
    </div>
  )
}
