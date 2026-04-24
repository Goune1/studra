export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100]" style={{ background: 'var(--app-bg)' }}>
      {children}
    </div>
  )
}
