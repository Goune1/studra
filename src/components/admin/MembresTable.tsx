'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Eye, RotateCcw, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AdminUser, Plan, StripeStatus } from '@/lib/admin/mock-data'

// ─── types ───────────────────────────────────────────────────────────────────
type SortKey = 'date_desc' | 'date_asc' | 'gen_desc' | 'name_asc'

interface Props {
  users:            AdminUser[]
  onSelectMember:   (user: AdminUser) => void
  selectedMemberId: string | null
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-indigo-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-blue-600',   'bg-rose-600',   'bg-amber-600',
  'bg-cyan-600',   'bg-pink-600',
]

function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── sub-components ──────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: Plan }) {
  return plan === 'pro'
    ? <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/30">PRO</span>
    : <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-500">FREE</span>
}

function StatusBadge({ status }: { status: StripeStatus }) {
  const map: Record<StripeStatus, { cls: string; label: string }> = {
    active:   { cls: 'bg-green-500/15 text-green-400 border-green-500/30',   label: 'active'    },
    trialing: { cls: 'bg-blue-500/15  text-blue-400  border-blue-500/30',    label: 'trialing'  },
    canceled: { cls: 'bg-red-500/15   text-red-400   border-red-500/30',     label: 'canceled'  },
    past_due: { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',   label: 'past_due'  },
    none:     { cls: 'bg-[#222]       text-gray-500  border-[#333]',         label: 'none'      },
  }
  const { cls, label } = map[status]
  return (
    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${cls} flex items-center gap-1 w-fit`}>
      {status === 'past_due' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
      {label}
    </span>
  )
}

function QuotaCell({ user }: { user: AdminUser }) {
  if (!isFinite(user.generationsQuota)) {
    return <span className="font-mono text-gray-500 text-sm">∞</span>
  }
  const pct       = Math.min((user.generationsUsed / user.generationsQuota) * 100, 100)
  const remaining = Math.max(user.generationsQuota - user.generationsUsed, 0)
  const barColor  = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs text-gray-400">{remaining}</span>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export function MembresTable({ users, onSelectMember, selectedMemberId }: Props) {
  const [search,       setSearch]       = useState('')
  const [planFilter,   setPlanFilter]   = useState<'all' | Plan>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | StripeStatus>('all')
  const [sortBy,       setSortBy]       = useState<SortKey>('date_desc')
  const [page,         setPage]         = useState(1)
  const [rowsPerPage,  setRowsPerPage]  = useState(10)
  const [copiedId,     setCopiedId]     = useState<string | null>(null)

  // reset page when filters change
  useEffect(() => { setPage(1) }, [search, planFilter, statusFilter, sortBy])

  const filtered = useMemo(() => {
    return users
      .filter(u => {
        if (search) {
          const q = search.toLowerCase()
          if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.id.includes(q)) return false
        }
        if (planFilter   !== 'all' && u.plan         !== planFilter)   return false
        if (statusFilter !== 'all' && u.stripeStatus !== statusFilter) return false
        return true
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date_asc':  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          case 'date_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case 'gen_desc':  return b.generationsUsed - a.generationsUsed
          case 'name_asc':  return a.name.localeCompare(b.name, 'fr')
          default:          return 0
        }
      })
  }, [search, planFilter, statusFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const safePage   = Math.min(page, totalPages)
  const paginated  = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [filtered, safePage, rowsPerPage])

  const copy = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(key)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const resetFilters = () => {
    setSearch('')
    setPlanFilter('all')
    setStatusFilter('all')
    setSortBy('date_desc')
  }

  const start = (safePage - 1) * rowsPerPage + 1
  const end   = Math.min(safePage * rowsPerPage, filtered.length)

  return (
    <div className="bg-[#161616] border border-[#222222] rounded-lg flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">Membres</h2>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#222] text-gray-400 border border-[#333]">
            {filtered.length}
          </span>
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-[#222222]">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Nom, email ou ID…"
          className="font-mono text-xs bg-[#111] border border-[#2a2a2a] text-gray-300 placeholder-gray-600 rounded px-3 h-8 w-56 focus:outline-none focus:border-[#444] transition-colors"
        />

        {/* Plan filter */}
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value as 'all' | Plan)}
          className="font-mono text-xs bg-[#111] border border-[#2a2a2a] text-gray-400 rounded px-2 h-8 focus:outline-none focus:border-[#444] cursor-pointer"
        >
          <option value="all">Plan : Tous</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | StripeStatus)}
          className="font-mono text-xs bg-[#111] border border-[#2a2a2a] text-gray-400 rounded px-2 h-8 focus:outline-none focus:border-[#444] cursor-pointer"
        >
          <option value="all">Stripe : Tous</option>
          <option value="active">active</option>
          <option value="trialing">trialing</option>
          <option value="canceled">canceled</option>
          <option value="past_due">past_due</option>
          <option value="none">none</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          className="font-mono text-xs bg-[#111] border border-[#2a2a2a] text-gray-400 rounded px-2 h-8 focus:outline-none focus:border-[#444] cursor-pointer"
        >
          <option value="date_desc">Inscription ↓</option>
          <option value="date_asc">Inscription ↑</option>
          <option value="gen_desc">Générations ↓</option>
          <option value="name_asc">Nom A→Z</option>
        </select>

        {/* Reset */}
        {(search || planFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'date_desc') && (
          <button
            onClick={resetFilters}
            className="font-mono text-xs text-gray-500 hover:text-gray-300 border border-[#2a2a2a] hover:border-[#444] rounded px-3 h-8 transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full min-w-[900px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#222222]">
              {['#', 'Utilisateur', 'Email', 'Plan', 'Stripe', 'Générations', 'Quota', 'Inscrit le', ''].map(h => (
                <th key={h} className="font-mono text-[10px] text-gray-600 uppercase tracking-wider text-left px-3 py-2 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((user, idx) => {
              const rowNum    = start + idx
              const genLabel  = isFinite(user.generationsQuota)
                ? `${user.generationsUsed} / ${user.generationsQuota}`
                : String(user.generationsUsed)
              const isActive  = selectedMemberId === user.id
              const copyKey   = `row-${user.id}`

              return (
                <tr
                  key={user.id}
                  className={`border-b border-[#1e1e1e] transition-colors cursor-pointer h-10 ${
                    isActive ? 'bg-[#1a1a2e]' : 'hover:bg-[#1a1a1a]'
                  }`}
                  onClick={() => onSelectMember(user)}
                >
                  {/* # */}
                  <td className="px-3 py-0">
                    <span className="font-mono text-xs text-gray-600">{rowNum}</span>
                  </td>

                  {/* Utilisateur */}
                  <td className="px-3 py-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${avatarColor(user.name)} flex items-center justify-center shrink-0`}>
                        <span className="font-mono text-[10px] font-bold text-white">{initials(user.name)}</span>
                      </div>
                      <span className="text-gray-200 text-xs whitespace-nowrap">{user.name}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-3 py-0 max-w-[180px]">
                    <span className="font-mono text-xs text-gray-400 truncate block">{user.email}</span>
                  </td>

                  {/* Plan */}
                  <td className="px-3 py-0">
                    <PlanBadge plan={user.plan} />
                  </td>

                  {/* Stripe */}
                  <td className="px-3 py-0">
                    <StatusBadge status={user.stripeStatus} />
                  </td>

                  {/* Générations */}
                  <td className="px-3 py-0">
                    <span className="font-mono text-xs text-gray-300 tabular-nums">{genLabel}</span>
                  </td>

                  {/* Quota */}
                  <td className="px-3 py-0">
                    <QuotaCell user={user} />
                  </td>

                  {/* Inscrit le */}
                  <td className="px-3 py-0">
                    <span className="font-mono text-xs text-gray-500">{fmtDate(user.createdAt)}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-0" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {/* View */}
                      <button
                        onClick={() => onSelectMember(user)}
                        className="p-1.5 rounded text-gray-600 hover:text-gray-200 hover:bg-[#252525] transition-colors"
                        title="Voir le profil"
                      >
                        <Eye size={13} />
                      </button>

                      {/* Reset quota */}
                      <button
                        disabled={user.plan !== 'free'}
                        className={`p-1.5 rounded transition-colors ${
                          user.plan === 'free'
                            ? 'text-gray-600 hover:text-amber-400 hover:bg-[#252525]'
                            : 'text-[#2a2a2a] cursor-not-allowed'
                        }`}
                        title={user.plan === 'free' ? 'Réinitialiser le quota' : 'Non applicable (Pro)'}
                      >
                        <RotateCcw size={13} />
                      </button>

                      {/* Copy ID */}
                      <button
                        onClick={() => copy(user.id, copyKey)}
                        className="p-1.5 rounded text-gray-600 hover:text-gray-200 hover:bg-[#252525] transition-colors relative"
                        title="Copier l'ID"
                      >
                        {copiedId === copyKey ? (
                          <Check size={13} className="text-green-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {paginated.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center font-mono text-xs text-gray-600">
                  Aucun membre ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#222222]">
        <span className="font-mono text-xs text-gray-600">
          {filtered.length > 0 ? `${start}–${end} sur ${filtered.length} membres` : '0 membres'}
        </span>

        <div className="flex items-center gap-3">
          {/* Rows per page */}
          <select
            value={rowsPerPage}
            onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
            className="font-mono text-xs bg-[#111] border border-[#2a2a2a] text-gray-400 rounded px-2 h-7 focus:outline-none cursor-pointer"
          >
            {[10, 25, 50].map(n => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>

          {/* Prev / Next */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1 rounded text-gray-600 hover:text-gray-200 hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-mono text-xs text-gray-500 min-w-[80px] text-center">
              Page {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1 rounded text-gray-600 hover:text-gray-200 hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
