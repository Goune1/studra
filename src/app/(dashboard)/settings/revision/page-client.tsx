'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Brain, CalendarBlank, ChartLineUp, SlidersHorizontal, Stack } from '@phosphor-icons/react'
import styles from '../settings.module.css'

interface FsrsStats {
  dueToday: number
  stateCount: { new: number; learning: number; review: number; relearning: number }
  totalCards: number
  retentionRate30d: number | null
  totalReviews: number
  forecast: { date: string; count: number }[]
}

interface FsrsSettings {
  desired_retention: number
  maximum_interval: number
  last_optimization_at: string | null
  review_count_at_last_optimization: number
  total_reviews: number
}

export default function RevisionSettingsPage() {
  const [stats, setStats] = useState<FsrsStats | null>(null)
  const [settings, setSettings] = useState<FsrsSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [draftRetention, setDraftRetention] = useState(0.9)
  const [draftInterval, setDraftInterval] = useState(36500)

  useEffect(() => {
    Promise.all([
      fetch('/api/fsrs/stats').then((response) => response.json()),
      fetch('/api/fsrs/settings').then((response) => response.json()),
    ]).then(([nextStats, nextSettings]) => {
      setStats(nextStats)
      setSettings(nextSettings)
      setDraftRetention(nextSettings.desired_retention ?? 0.9)
      setDraftInterval(nextSettings.maximum_interval ?? 36500)
    })
  }, [])

  async function saveSettings() {
    setSaving(true)
    await fetch('/api/fsrs/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desired_retention: draftRetention, maximum_interval: draftInterval }),
    })
    setSettings((current) => current ? { ...current, desired_retention: draftRetention, maximum_interval: draftInterval } : current)
    setSaving(false)
  }

  const maxForecast = stats ? Math.max(...stats.forecast.map((item) => item.count), 1) : 1

  return (
    <div className={styles.revisionPage}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderRow}>
          <Link href="/settings" className={styles.backLink} aria-label="Retour aux paramètres">
            <ArrowLeft size={17} weight="regular" />
          </Link>
          <div>
            <p className={styles.eyebrow}>Paramètres</p>
            <h1>Répétition espacée</h1>
            <p className={styles.pageSummary}>FSRS planifie tes révisions pour soutenir ta rétention, sans les multiplier inutilement.</p>
          </div>
        </div>
      </header>

      <div className={styles.metricsGrid}>
        {[
          { icon: Stack, label: 'À réviser', value: stats ? String(stats.dueToday) : '…' },
          { icon: ChartLineUp, label: 'Rétention · 30 j', value: stats?.retentionRate30d != null ? `${stats.retentionRate30d}%` : '—' },
          { icon: Brain, label: 'Révisions', value: stats ? String(stats.totalReviews) : '…' },
          { icon: SlidersHorizontal, label: 'Cartes', value: stats ? String(stats.totalCards) : '…' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className={styles.metric}>
            <span className={styles.metricLabel}><Icon size={14} weight="regular" />{label}</span>
            <p className={styles.metricValue}>{value}</p>
          </div>
        ))}
      </div>

      <div className={styles.revisionLayout}>
        {stats && (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div><h2>État des cartes</h2><p>La répartition actuelle de tes cartes.</p></div>
            </div>
            <div className={styles.stateGrid}>
              {[
                { label: 'Nouvelles', value: stats.stateCount.new },
                { label: 'Apprentissage', value: stats.stateCount.learning },
                { label: 'Révision', value: stats.stateCount.review },
                { label: 'Rapprentissage', value: stats.stateCount.relearning },
              ].map((item) => <div key={item.label} className={styles.stateItem}><strong className={styles.stateValue}>{item.value}</strong><span className={styles.stateLabel}>{item.label}</span></div>)}
            </div>
          </section>
        )}

        {stats && stats.forecast.length > 0 && (
          <section className={styles.forecastPanel}>
            <p className={styles.panelKicker}><CalendarBlank size={14} weight="regular" />Prévision · 30 jours</p>
            <div className={styles.forecastBars}>
              {stats.forecast.map(({ date, count }) => {
                const height = maxForecast > 0 ? Math.max((count / maxForecast) * 100, count > 0 ? 8 : 0) : 0
                const isToday = date === new Date().toISOString().slice(0, 10)
                return <div key={date} className={styles.forecastDay} title={`${date} : ${count} ${count === 1 ? 'carte' : 'cartes'}`}><span className={`${styles.forecastBar} ${isToday ? styles.forecastBarToday : ''}`} style={{ height: `${height}%` }} /></div>
              })}
            </div>
            <div className={styles.forecastScale}><span>Aujourd’hui</span><span>J+30</span></div>
          </section>
        )}

        <section className={styles.settingPanel}>
          <p className={styles.panelKicker}><SlidersHorizontal size={14} weight="regular" />Réglages</p>
          <div className={styles.controlBlock}>
            <div className={styles.controlHeader}><label htmlFor="retention">Rétention cible</label><span className={styles.controlValue}>{Math.round(draftRetention * 100)}%</span></div>
            <input id="retention" type="range" min={70} max={98} step={1} value={Math.round(draftRetention * 100)} onChange={(event) => setDraftRetention(parseInt(event.target.value, 10) / 100)} className={styles.range} />
            <div className={styles.rangeScale}><span>70% · moins de révisions</span><span>98% · plus de révisions</span></div>
            <p className={styles.controlHelp}>Probabilité de rappel souhaitée lors de chaque révision. 90% est le réglage recommandé.</p>
          </div>
          <div className={styles.controlBlock}>
            <div className={styles.controlHeader}><label htmlFor="maximum-interval">Intervalle maximum</label><span className={styles.controlValue}>{draftInterval >= 365 ? `${Math.round(draftInterval / 365)} ${Math.round(draftInterval / 365) === 1 ? 'an' : 'ans'}` : `${draftInterval} j`}</span></div>
            <input id="maximum-interval" type="number" min={30} max={36500} value={draftInterval} onChange={(event) => setDraftInterval(Math.max(30, Math.min(36500, parseInt(event.target.value, 10) || 36500)))} className={styles.numberInput} />
            <p className={styles.controlHelp}>Intervalle maximal entre deux révisions, en jours (défaut : 36 500 j, soit environ 100 ans).</p>
          </div>
          <button onClick={saveSettings} disabled={saving || !settings || (draftRetention === settings.desired_retention && draftInterval === settings.maximum_interval)} className={styles.primaryButton}>{saving ? 'Sauvegarde…' : 'Enregistrer les paramètres'}</button>
        </section>

        <section className={styles.algorithmPanel}>
          <p className={styles.panelKicker}><Brain size={14} weight="regular" />Algorithme</p>
          <div className={styles.algorithmRow}><span className={styles.rowLabel}>Paramètres</span><span className={styles.versionBadge}>Standards FSRS v5</span></div>
          <p className={styles.algorithmText}>Studra utilise les paramètres FSRS v5 par défaut, validés sur des millions de révisions. La personnalisation algorithmique basée sur ton historique sera disponible dans une prochaine mise à jour.</p>
          {settings && settings.total_reviews > 0 && <p className={styles.algorithmCount}>{`${settings.total_reviews} ${settings.total_reviews === 1 ? 'révision enregistrée' : 'révisions enregistrées'}`}</p>}
        </section>
      </div>
    </div>
  )
}
