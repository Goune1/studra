'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, Gift, UserRound } from 'lucide-react'
import styles from './settings-layout.module.css'

const ITEMS = [
  { href: '/settings', label: 'Compte', Icon: UserRound },
  { href: '/settings/revision', label: 'Révision', Icon: Brain },
  { href: '/settings/parrainage', label: 'Parrainage', Icon: Gift },
] as const

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Paramètres" className={styles.nav}>
      <p className={styles.navTitle}>Paramètres</p>
      <ul className={styles.navList}>
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <li key={href}>
              <Link href={href} className={styles.navLink} aria-current={active ? 'page' : undefined}>
                <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
