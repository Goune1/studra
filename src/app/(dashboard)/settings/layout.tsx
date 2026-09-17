import { SettingsNav } from './settings-nav'
import styles from './settings-layout.module.css'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <SettingsNav />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
