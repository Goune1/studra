import styles from './dashboard-shell-skeleton.module.css'

function SkeletonLine({ width }: { width: string }) {
  return <span className={styles.line} style={{ width }} />
}

export function DashboardContentSkeleton() {
  return (
    <div className={styles.contentSkeleton} role="status" aria-label="Chargement du contenu">
      <SkeletonLine width="92px" />
      <span className={`${styles.line} ${styles.title}`} />
      <SkeletonLine width="220px" />
      <div className={styles.controls} />
      <div className={styles.grid}>
        {[1, 2, 3].map((item) => <div key={item} className={styles.card} />)}
      </div>
      <span className={styles.srOnly}>Chargement…</span>
    </div>
  )
}

export function DashboardShellSkeleton() {
  return (
    <div className={`app-v2 ${styles.shell}`} role="status" aria-label="Chargement de l’application">
      <aside className={styles.sidebar} aria-hidden="true">
        <div className={styles.brand}><SkeletonLine width="78px" /></div>
        <div className={styles.navigation}>
          {[72, 88, 76, 94, 82, 70, 90].map((width, index) => (
            <div key={`${width}-${index}`} className={styles.navItem}>
              <span className={styles.navIcon} />
              <SkeletonLine width={`${width}px`} />
            </div>
          ))}
        </div>
        <div className={styles.profile}>
          <span className={styles.avatar} />
          <div><SkeletonLine width="96px" /><SkeletonLine width="128px" /></div>
        </div>
      </aside>
      <div className={styles.mainColumn}>
        <header className={styles.mobileBar} aria-hidden="true">
          <span className={styles.mobileMenu} />
          <SkeletonLine width="68px" />
        </header>
        <main className={styles.main}><DashboardContentSkeleton /></main>
      </div>
      <span className={styles.srOnly}>Chargement de Studra…</span>
    </div>
  )
}
