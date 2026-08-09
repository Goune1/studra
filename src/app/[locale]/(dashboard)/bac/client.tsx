'use client'

import { useEffect, useRef, useState } from 'react'
import { GraduationCap, Search, MapPin, School, User, Lock, RefreshCw, Unlink, ChevronRight, QrCode, ImageIcon, X } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { toast } from 'sonner'
import { useFormatter, useTranslations } from 'next-intl'
import { GradesView } from './grades-view'
import { BacSimulator } from './bac-simulator'

const COLOR = '#1F4D3F'

interface PronoteConnection {
  instance_url: string
  username: string
  last_synced_at: string | null
  raw_data: unknown
}

interface Commune {
  label: string
  city: string
  postcode: string
  context: string
  coordinates: [number, number]
}

interface PronoteSchool {
  name: string
  url: string
  distance: number
}

interface BacClientProps {
  initialConnection: PronoteConnection | null
}

export function BacClient({ initialConnection }: BacClientProps) {
  const t = useTranslations('dashboard.bac')
  const format = useFormatter()
  const [connection, setConnection] = useState<PronoteConnection | null>(initialConnection)

  // Méthode de connexion
  const [connectMethod, setConnectMethod] = useState<'credentials' | 'qr'>('credentials')

  // QR code state
  const [qrImageFile, setQrImageFile] = useState<File | null>(null)
  const [qrImagePreview, setQrImagePreview] = useState<string | null>(null)
  const [qrDragging, setQrDragging] = useState(false)
  const [pin, setPin] = useState('')
  const [qrConnecting, setQrConnecting] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const qrInputRef = useRef<HTMLInputElement>(null)

  // Onboarding state
  const [cityQuery, setCityQuery] = useState('')
  const [communes, setCommunes] = useState<Commune[]>([])
  const [communeLoading, setCommuneLoading] = useState(false)
  const [schools, setSchools] = useState<PronoteSchool[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<PronoteSchool | null>(null)
  const [pronoteUsername, setPronoteUsername] = useState('')
  const [pronotePassword, setPronotePassword] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  // Connected state
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [rawData, setRawData] = useState<unknown>(initialConnection?.raw_data ?? null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    initialConnection?.last_synced_at ?? null,
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced city search via IGN geocodage API
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!cityQuery.trim()) {
      setCommunes([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setCommuneLoading(true)
      try {
        const res = await fetch(
          `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(cityQuery)}&type=municipality&limit=6`,
        )
        const json = await res.json() as {
          features?: Array<{
            properties: {
              label: string
              city: string
              postcode: string
              context: string
            }
            geometry: { coordinates: [number, number] }
          }>
        }
        setCommunes(
          (json.features ?? []).map((f) => ({
            label: f.properties.label,
            city: f.properties.city,
            postcode: f.properties.postcode,
            context: f.properties.context,
            coordinates: f.geometry.coordinates,
          })),
        )
      } catch {
        // ignore network errors on search
      } finally {
        setCommuneLoading(false)
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [cityQuery])

  async function handleSelectCommune(commune: Commune) {
    setCommunes([])
    setCityQuery(commune.label)
    setSchools([])
    setSelectedSchool(null)
    setSchoolsLoading(true)
    try {
      const res = await fetch('/api/pronote/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: commune.coordinates[1],
          longitude: commune.coordinates[0],
        }),
      })
      const json = await res.json() as PronoteSchool[] | { error: string }
      if (!res.ok) {
        toast.error('error' in json ? json.error : t('schoolSearchError'))
        return
      }
      setSchools(json as PronoteSchool[])
    } catch {
      toast.error('Impossible de rechercher les établissements')
    } finally {
      setSchoolsLoading(false)
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSchool) return
    setConnecting(true)
    setConnectError(null)
    try {
      const res = await fetch('/api/pronote/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceUrl: selectedSchool.url,
          username: pronoteUsername,
          password: pronotePassword,
        }),
      })
      const json = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) {
        setConnectError(json.error ?? 'Erreur de connexion')
        return
      }
      toast.success(t('connectSuccess'))
      setConnection({
        instance_url: selectedSchool.url,
        username: pronoteUsername,
        last_synced_at: null,
        raw_data: null,
      })
      // reset onboarding state
      setCityQuery('')
      setSchools([])
      setSelectedSchool(null)
      setPronoteUsername('')
      setPronotePassword('')
    } catch {
      setConnectError('Impossible de se connecter. Vérifiez votre connexion internet.')
    } finally {
      setConnecting(false)
    }
  }

  function handleQrFileSelect(file: File) {
    const ALLOWED = ['image/png', 'image/jpeg', 'image/webp']
    if (!ALLOWED.includes(file.type)) {
      toast.error('Format non supporté. Utilise PNG, JPEG ou WEBP.')
      return
    }
    if (qrImagePreview) URL.revokeObjectURL(qrImagePreview)
    setQrImageFile(file)
    setQrImagePreview(URL.createObjectURL(file))
    setQrError(null)
  }

  function handleQrDrop(e: React.DragEvent) {
    e.preventDefault()
    setQrDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleQrFileSelect(file)
  }

  async function handleConnectQr(e: React.FormEvent) {
    e.preventDefault()
    if (!qrImageFile) return
    setQrConnecting(true)
    setQrError(null)
    try {
      const formData = new FormData()
      formData.append('image', qrImageFile)
      formData.append('pin', pin)
      const res = await fetch('/api/pronote/connect-qr', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json() as {
        success?: boolean
        error?: string
        instanceUrl?: string
        username?: string
      }
      if (!res.ok) {
        setQrError(json.error ?? 'Erreur de connexion')
        return
      }
      toast.success(t('connectSuccess'))
      setConnection({
        instance_url: json.instanceUrl ?? '',
        username: json.username ?? '',
        last_synced_at: null,
        raw_data: null,
      })
      if (qrImagePreview) URL.revokeObjectURL(qrImagePreview)
      setQrImageFile(null)
      setQrImagePreview(null)
      setPin('')
    } catch {
      setQrError('Impossible de se connecter. Vérifiez votre connexion internet.')
    } finally {
      setQrConnecting(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/pronote/sync', { method: 'POST' })
      const json = await res.json() as { data?: unknown; last_synced_at?: string; error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'Erreur lors de la synchronisation')
        return
      }
      setRawData(json.data)
      setLastSyncedAt(json.last_synced_at ?? null)
      setConnection((prev) =>
        prev
          ? { ...prev, raw_data: json.data, last_synced_at: json.last_synced_at ?? null }
          : prev,
      )
      toast.success(t('syncSuccess'))
    } catch {
      toast.error(t('syncError'))
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/pronote/disconnect', { method: 'DELETE' })
      const json = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'Erreur lors de la déconnexion')
        return
      }
      toast.success(t('disconnected'))
      setConnection(null)
      setRawData(null)
      setLastSyncedAt(null)
    } catch {
      toast.error(t('disconnectError'))
    } finally {
      setDisconnecting(false)
    }
  }

  if (connection) {
    return (
      <div className="max-w-350">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap size={14} style={{ color: COLOR }} />
              <Eyebrow>{t('grades')}</Eyebrow>
            </div>
            <h1 className="section-h">{t('notesHeader')}</h1>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn btn-outline sm:ml-auto shrink-0"
            style={{ padding: '10px 16px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? t('syncing') : t('sync')}
          </button>
        </div>

        {/* Connection info */}
        <div
          className="rounded-2xl border p-5 mb-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: COLOR + '15' }}
            >
              <School size={18} style={{ color: COLOR }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                {connection.instance_url}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                {t('username')}: {connection.username}
              </p>
            </div>
          </div>
          {lastSyncedAt && (
            <p className="mono text-xs" style={{ color: 'var(--ink-400)' }}>
              {t('lastSync', {date: format.dateTime(new Date(lastSyncedAt), {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})})}
            </p>
          )}
          {!lastSyncedAt && (
            <p className="text-xs" style={{ color: 'var(--ink-400)' }}>
              {t('noSync')}
            </p>
          )}
        </div>

        {rawData !== null && rawData !== undefined && (
          <BacSimulator rawData={rawData} />
        )}

        {/* Notes Pronote */}
        {rawData !== null && rawData !== undefined && (
          <div
            className="rounded-2xl border p-5 mb-6"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <GradesView key={lastSyncedAt ?? 'initial'} rawData={rawData} />
          </div>
        )}

        {/* Disconnect */}
        <div className="flex justify-end">
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: 'var(--text-3)' }}
          >
            <Unlink size={13} />
            {disconnecting ? t('disconnecting') : t('disconnectPronote')}
          </button>
        </div>
      </div>
    )
  }

  // Onboarding : not connected
  return (
    <div className="max-w-350">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap size={14} style={{ color: COLOR }} />
          <Eyebrow>{t('grades')}</Eyebrow>
        </div>
        <h1 className="section-h">{t('connectHeader')}</h1>
        <p className="text-sm mt-3" style={{ color: 'var(--ink-500)' }}>
          {t('notesDescription')}
        </p>
      </div>

      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Onglets masqués quand on est en étape 2 identifiants */}
        {!(connectMethod === 'credentials' && selectedSchool) && (
          <div
            className="flex gap-1 p-1 rounded-xl mb-5"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            {(
              [
                { key: 'credentials', label: t('credentialsTab'), Icon: User },
                { key: 'qr', label: t('qrTab'), Icon: QrCode },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setConnectMethod(key)
                  if (key === 'qr') setSelectedSchool(null)
                  setConnectError(null)
                  setQrError(null)
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                style={
                  connectMethod === key
                    ? { background: 'var(--bg-elev)', color: 'var(--ink)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                    : { color: 'var(--ink-500)' }
                }
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        )}

        {connectMethod === 'qr' ? (
          /* Formulaire QR code */
          <form onSubmit={handleConnectQr}>
            <div
              className="rounded-xl px-4 py-3 mb-5 text-xs space-y-1"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
            >
              <p className="font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
                {t('qrInstructions')}
              </p>
              <p>{t('qrStep1')}</p>
              <p>{t('qrStep2')}</p>
              <p>{t('qrStep3')}</p>
              <p>{t('qrStep4')}</p>
              <p>{t('qrStep5')}</p>
              <p className="pt-1" style={{ color: 'var(--text-4)' }}>
                {t('eduConnectHelp')}
              </p>
            </div>

            <div className="space-y-3 mb-4">
              {/* Zone d'upload image QR */}
              <div>
                <input
                  ref={qrInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleQrFileSelect(file)
                  }}
                />
                {qrImageFile && qrImagePreview ? (
                  <div className="relative flex items-center gap-3 rounded-xl px-4 py-3 border"
                    style={{ background: 'var(--surface-2)', borderColor: COLOR + '40' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrImagePreview}
                      alt="QR code"
                      className="w-14 h-14 rounded-lg object-cover shrink-0 border"
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                        {qrImageFile.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => qrInputRef.current?.click()}
                        className="text-xs mt-0.5 hover:opacity-70 transition-opacity"
                        style={{ color: COLOR }}
                      >
                        {t('changeImage')}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (qrImagePreview) URL.revokeObjectURL(qrImagePreview)
                        setQrImageFile(null)
                        setQrImagePreview(null)
                      }}
                      className="shrink-0 rounded-full p-1 hover:bg-white/8 transition-colors"
                      style={{ color: 'var(--text-3)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleQrDrop}
                    onDragOver={(e) => { e.preventDefault(); setQrDragging(true) }}
                    onDragLeave={() => setQrDragging(false)}
                    onClick={() => qrInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 px-4 text-center transition-colors cursor-pointer"
                    style={{
                      borderColor: qrDragging ? COLOR + '60' : 'var(--ink-200)',
                      background: qrDragging ? COLOR + '08' : 'var(--surface-2)',
                    }}
                  >
                    <ImageIcon size={20} className="text-gray-500" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                        {t('importQr')}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                        {t('qrHelp')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <Lock
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-4)' }}
                />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder={t('pin')}
                  maxLength={4}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            {qrError && (
              <div
                className="rounded-xl px-4 py-3 mb-4 text-sm"
                style={{ background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444' }}
              >
                {qrError}
              </div>
            )}

            <button
              type="submit"
              disabled={qrConnecting || !qrImageFile || pin.length !== 4}
              className="btn btn-primary w-full"
            >
              {qrConnecting ? t('qrConnecting') : t('connectQr')}
            </button>
          </form>
        ) : !selectedSchool ? (
          /* Étape 1 : trouver l'établissement */
          <>
            <p className="text-sm font-semibold text-white mb-4">
              {t('stepOneLabel')}
            </p>

            {/* City search */}
            <div className="relative mb-4">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-4)' }}
              />
              <input
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder={t('city')}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Communes */}
            {communeLoading && (
              <div className="flex items-center gap-2 py-3 px-1">
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: COLOR + '20', borderTopColor: COLOR }}
                />
                <span className="text-xs" style={{ color: 'var(--text-4)' }}>{t('searching')}</span>
              </div>
            )}

            {communes.length > 0 && (
              <div className="mb-4 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                {communes.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectCommune(c)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/4 border-b last:border-b-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <MapPin size={13} style={{ color: COLOR }} className="shrink-0" />
                    <span className="flex-1 text-sm text-white">{c.label}</span>
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-4)' }}>
                      {c.context.split(', ').slice(-1)[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Schools */}
            {schoolsLoading && (
              <div className="flex items-center gap-2 py-3 px-1">
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: COLOR + '20', borderTopColor: COLOR }}
                />
                <span className="text-xs" style={{ color: 'var(--text-4)' }}>{t('searchSchools')}</span>
              </div>
            )}

            {!schoolsLoading && schools.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>
                  {t('schoolsFound')}
                </p>
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                  {schools.map((school, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSchool(school)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/4 border-b last:border-b-0"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <School size={13} style={{ color: COLOR }} className="shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-white truncate">{school.name}</span>
                        <span className="block text-xs truncate" style={{ color: 'var(--text-4)' }}>
                          {school.url}
                        </span>
                      </span>
                      {school.distance !== undefined && (
                        <span className="text-xs shrink-0" style={{ color: 'var(--text-4)' }}>
                          {Math.round(school.distance / 1000)} km
                        </span>
                      )}
                      <ChevronRight size={13} style={{ color: 'var(--text-4)' }} className="shrink-0" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {!schoolsLoading && schools.length === 0 && cityQuery && communes.length === 0 && !communeLoading && (
              <p className="text-xs py-2" style={{ color: 'var(--text-4)' }}>
                {t('startSearch')}
              </p>
            )}
          </>
        ) : /* Étape 2 identifiants */ (
          /* Étape 2 : saisie des identifiants */
          <form onSubmit={handleConnect}>
            <button
              type="button"
              onClick={() => setSelectedSchool(null)}
              className="text-xs mb-5 transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-3)' }}
            >
              {t('changeSchool')}
            </button>

            <p className="text-sm font-semibold text-white mb-4">
              {t('stepTwo')}
            </p>

            {/* School info */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <School size={14} style={{ color: COLOR }} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{selectedSchool.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-4)' }}>{selectedSchool.url}</p>
              </div>
            </div>

            {/* Credentials */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <User
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-4)' }}
                />
                <input
                  type="text"
                  value={pronoteUsername}
                  onChange={(e) => setPronoteUsername(e.target.value)}
                  placeholder={t('username')}
                  required
                  autoComplete="username"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
              <div className="relative">
                <Lock
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-4)' }}
                />
                <input
                  type="password"
                  value={pronotePassword}
                  onChange={(e) => setPronotePassword(e.target.value)}
                  placeholder={t('passwordPronote')}
                  required
                  autoComplete="current-password"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            <p className="text-xs mb-5" style={{ color: 'var(--text-4)' }}>
              {t('credentialsSafe')}
            </p>

            {connectError && (
              <div
                className="rounded-xl px-4 py-3 mb-4 text-sm"
                style={{ background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444' }}
              >
                {connectError}
              </div>
            )}

            <button
              type="submit"
              disabled={connecting || !pronoteUsername || !pronotePassword}
              className="btn btn-primary w-full"
            >
              {connecting ? t('connecting') : t('connect')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
