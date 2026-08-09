'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, Brain, TrendingUp, Calendar, Layers, Settings2 } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { useTranslations } from 'next-intl'

const COLOR = '#1F4D3F'

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
  const t = useTranslations('dashboard.settings.fsrs')
  const [stats, setStats] = useState<FsrsStats | null>(null)
  const [settings, setSettings] = useState<FsrsSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [draftRetention, setDraftRetention] = useState<number>(0.9)
  const [draftInterval, setDraftInterval] = useState<number>(36500)

  useEffect(() => {
    Promise.all([
      fetch('/api/fsrs/stats').then((r) => r.json()),
      fetch('/api/fsrs/settings').then((r) => r.json()),
    ]).then(([s, cfg]) => {
      setStats(s)
      setSettings(cfg)
      setDraftRetention(cfg.desired_retention ?? 0.9)
      setDraftInterval(cfg.maximum_interval ?? 36500)
    })
  }, [])

  async function saveSettings() {
    setSaving(true)
    await fetch('/api/fsrs/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desired_retention: draftRetention, maximum_interval: draftInterval }),
    })
    setSettings((s) => s ? { ...s, desired_retention: draftRetention, maximum_interval: draftInterval } : s)
    setSaving(false)
  }

  const maxForecast = stats ? Math.max(...stats.forecast.map((f) => f.count), 1) : 1

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-up">
        <Link
          href="/settings"
          className="p-2 rounded-lg transition-colors hover:bg-black/5"
          style={{ color: 'var(--ink-500)' }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <Eyebrow className="mb-1">{t('eyebrow')}</Eyebrow>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>
            {t('spacedRepetition')}
          </h1>
          <p className="mono text-xs mt-0.5" style={{ color: 'var(--ink-400)' }}>
              {t('algorithmSubtitle')}
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {[
          {
            icon: Layers,
            label: 'À réviser aujourd\'hui',
            value: stats ? String(stats.dueToday) : '…',
            color: stats?.dueToday ? '#F59E0B' : '#10B981',
          },
          {
            icon: TrendingUp,
            label: 'Rétention (30 j)',
            value: stats?.retentionRate30d != null ? `${stats.retentionRate30d}%` : '—',
            color: '#3B82F6',
          },
          {
            icon: Brain,
            label: 'Révisions totales',
            value: stats ? String(stats.totalReviews) : '…',
            color: COLOR,
          },
          {
            icon: Settings2,
            label: 'Cartes totales',
            value: stats ? String(stats.totalCards) : '…',
            color: 'var(--ink-500)',
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon size={14} style={{ color }} />
              <span className="mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>
                {label}
              </span>
            </div>
            <p className="text-3xl font-bold tracking-tight" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Card state breakdown */}
      {stats && (
        <div
          className="rounded-2xl p-5 space-y-3 animate-fade-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '90ms' }}
        >
          <p className="mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>
            État des cartes
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Nouvelles',      value: stats.stateCount.new,        color: 'var(--ink-500)' },
              { label: 'Apprentissage',  value: stats.stateCount.learning,   color: '#F59E0B' },
              { label: 'Révision',       value: stats.stateCount.review,     color: '#10B981' },
              { label: 'Rapprentissage', value: stats.stateCount.relearning, color: '#EF4444' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl p-3 text-center"
                style={{ background: `${color}10`, border: `1px solid ${color}20` }}
              >
                <div className="text-xl font-bold tabular-nums" style={{ color }}>{value}</div>
                <div className="mono text-[9px] mt-0.5 leading-tight" style={{ color: 'var(--ink-400)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 30-day forecast */}
      {stats && stats.forecast.length > 0 && (
        <div
          className="rounded-2xl p-5 animate-fade-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '120ms' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} style={{ color: COLOR }} />
            <p className="mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>
              {t('forecast')}
            </p>
          </div>
          <div className="flex items-end gap-0.5 h-16">
            {stats.forecast.map(({ date, count }) => {
              const height = maxForecast > 0 ? Math.max((count / maxForecast) * 100, count > 0 ? 8 : 0) : 0
              const isToday = date === new Date().toISOString().slice(0, 10)
              return (
                <div key={date} className="flex-1 flex flex-col items-center justify-end" title={t('forecastCardTitle', {date, count})}>
                  <div
                    className="w-full rounded-sm transition-all"
                    style={{
                      height: `${height}%`,
                      minHeight: count > 0 ? 2 : 0,
                      background: isToday ? '#F59E0B' : COLOR + '30',
                      border: isToday ? '1px solid #F59E0B60' : 'none',
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="mono text-[9px]" style={{ color: 'var(--ink-400)' }}>{t('todayLabel')}</span>
            <span className="mono text-[9px]" style={{ color: 'var(--ink-400)' }}>{t('dayThirty')}</span>
          </div>
        </div>
      )}

      {/* Settings */}
      <div
        className="rounded-2xl p-5 space-y-5 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '150ms' }}
      >
        <p className="mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>
          {t('parameters')}
        </p>

        {/* Retention slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
              {t('targetRetention')}
            </label>
            <span className="mono text-sm font-semibold" style={{ color: COLOR }}>
              {Math.round(draftRetention * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={70} max={98} step={1}
            value={Math.round(draftRetention * 100)}
            onChange={(e) => setDraftRetention(parseInt(e.target.value) / 100)}
            className="w-full"
            style={{ accentColor: COLOR }}
          />
          <div className="flex justify-between mt-1">
            <span className="mono text-[9px]" style={{ color: 'var(--ink-400)' }}>{t('retentionLow')}</span>
            <span className="mono text-[9px]" style={{ color: 'var(--ink-400)' }}>{t('retentionHigh')}</span>
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--ink-400)' }}>
            {t('retentionHelp')}
          </p>
        </div>

        {/* Max interval */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
              {t('maximumInterval')}
            </label>
            <span className="mono text-sm" style={{ color: 'var(--ink-700)' }}>
              {draftInterval >= 365
                ? t('intervalValue', {count: Math.round(draftInterval / 365)})
                : t('daysValue', {count: draftInterval})}
            </span>
          </div>
          <input
            type="number"
            min={30} max={36500}
            value={draftInterval}
            onChange={(e) => setDraftInterval(Math.max(30, Math.min(36500, parseInt(e.target.value) || 36500)))}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--ink-400)' }}>
            {t('intervalHelp')}
          </p>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving || !settings || (draftRetention === settings.desired_retention && draftInterval === settings.maximum_interval)}
          className="btn btn-primary w-full"
        >
          {saving ? t('saveSettingsLoading') : t('saveSettings')}
        </button>
      </div>

      {/* Algorithm info */}
      <div
        className="rounded-2xl p-5 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '180ms' }}
      >
        <p className="mono text-[10px] uppercase tracking-wider mb-3" style={{ color: 'var(--ink-400)' }}>
          {t('algorithm')}
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--ink)' }}>{t('parameters')}</span>
            <span
              className="mono text-xs px-2 py-0.5 rounded"
              style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}20` }}
            >
              {t('standards')}
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-400)' }}>
            {t('algorithmHelp')}
          </p>
          {settings && settings.total_reviews > 0 && (
            <p className="mono text-[10px]" style={{ color: 'var(--ink-400)' }}>
              {t('reviewsRecorded', {count: settings.total_reviews})}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
