'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Copy, CursorClick, TrendUp, Users, Wallet } from '@phosphor-icons/react'
import { updatePaymentMethod } from '@/app/(dashboard)/affiliate/actions'
import type { Affiliate, AffiliateCommission, AffiliatePayout, AffiliateStats } from '@/types'
import styles from './affiliate.module.css'

const STATUS_TEXT: Record<string, string> = {
  pending: 'En attente',
  approved: 'Validées',
  payable: 'Payables',
  paid: 'Payées',
  cancelled: 'Annulées',
  refunded: 'Remboursées',
}

const STATUS_CLASS: Record<string, string> = {
  pending: styles.statusPending,
  approved: styles.statusApproved,
  payable: styles.statusPayable,
  paid: styles.statusPaid,
  cancelled: styles.statusCancelled,
  refunded: styles.statusRefunded,
}

const PAYOUT_STATUS_CLASS: Record<string, string> = {
  paid: styles.statusPayable,
  failed: styles.statusCancelled,
}

function fmt(v: number) {
  return v.toFixed(2).replace('.', ',') + ' €'
}
interface Props {
  affiliate: Affiliate
  stats: AffiliateStats
  commissions: AffiliateCommission[]
  payouts: AffiliatePayout[]
  appUrl: string
  minimumPayoutThreshold: number
}

export function AffiliateDashboard({ affiliate, stats, commissions, payouts, appUrl, minimumPayoutThreshold }: Props) {
  const format = ({number: (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat('fr-FR', options).format(value), dateTime: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', options).format(new Date(value)), relativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => new Intl.RelativeTimeFormat('fr-FR', {numeric: 'auto'}).format(value, unit)})
  const [copied, setCopied] = useState(false)
  const [editPayment, setEditPayment] = useState(false)
  const [method, setMethod] = useState<'paypal' | 'bank_transfer'>(affiliate.payment_method ?? 'paypal')
  const [isPending, startTransition] = useTransition()

  const link = `${appUrl}/api/affiliate/track?ref=${affiliate.referral_code}`

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handlePaymentUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updatePaymentMethod(formData)
      if (result.ok) {
        toast.success("Moyen de paiement mis à jour.")
        setEditPayment(false)
      } else {
        toast.error(result.error ?? "Erreur.")
      }
    })
  }

  const kpis = [
    { label: 'Clics', value: stats.total_clicks, icon: CursorClick },
    { label: 'Inscriptions', value: stats.total_referrals, icon: Users },
    { label: 'Abonnés actifs', value: stats.active_subscribers, icon: TrendUp },
    { label: 'Commissions dues', value: fmt(stats.commission_pending + stats.commission_approved + stats.commission_payable), icon: Wallet },
  ]

  const suspended = affiliate.status === 'suspended'

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>{"Programme d'affiliation"}</h1>
        <p className={suspended ? styles.suspended : undefined}>
          {suspended
            ? 'Votre compte est suspendu. Contacte le support.'
            : `Bonjour ${affiliate.first_name} ! Voici votre tableau de bord.`}
        </p>
      </header>

      {/* Lien de parrainage */}
      <section className={`${styles.panel} ${styles.section}`}>
        <p className={styles.eyebrow}>{"Votre lien de parrainage"}</p>
        <div className={styles.referralRow}>
          <code className={styles.referralCode}>{link}</code>
          <button onClick={copyLink} className={styles.copyButton}>
            {copied ? <Check size={14} weight="regular" /> : <Copy size={14} weight="regular" />}
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
        <p className={styles.reference}>{"Code :"} <span>{affiliate.referral_code}</span></p>
      </section>

      {/* KPIs */}
      <section className={styles.kpis}>
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className={styles.kpi}>
            <div className={styles.kpiLabel}>
              <span className={styles.iconBox}><Icon size={14} weight="regular" /></span>
              {label}
            </div>
            <p className={styles.kpiValue}>{value}</p>
          </div>
        ))}
      </section>

      {/* Solde détaillé */}
      <section className={`${styles.panel} ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Solde des commissions</h2>
        <div className={styles.balances}>
          {[
            { label: 'En attente',    value: stats.commission_pending,  note: 'En cours de validation' },
            { label: 'Validées',      value: stats.commission_approved, note: 'Prêtes à verser' },
            { label: 'Payables',      value: stats.commission_payable,  note: `Seuil : ${minimumPayoutThreshold} €` },
            { label: 'Payées',        value: stats.commission_paid,     note: 'Total versé' },
          ].map(({ label, value, note }) => (
            <div key={label} className={styles.balance}>
              <p className={styles.balanceLabel}>{label}</p>
              <p className={styles.balanceValue}>{fmt(value)}</p>
              <p className={styles.balanceNote}>{note}</p>
            </div>
          ))}
        </div>
        {stats.commission_payable < minimumPayoutThreshold && stats.commission_payable > 0 && (
          <p className={styles.threshold}>
            Il vous manque {fmt(minimumPayoutThreshold - stats.commission_payable)} pour atteindre le seuil de paiement.
          </p>
        )}
      </section>

      {/* Historique commissions */}
      <section className={`${styles.panel} ${styles.tablePanel}`}>
        <div className={styles.tableHeader}>
          <h2 className={styles.sectionTitle}>Historique des commissions</h2>
        </div>
        {commissions.length === 0 ? (
          <p className={styles.empty}>Aucune commission pour le moment.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {['Date', 'Revenu', 'Commission', 'Statut'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id}>
                    <td className={styles.muted}>{format.dateTime(new Date(c.created_at), {day: '2-digit', month: 'short', year: 'numeric'})}</td>
                    <td>{fmt(c.amount_revenue)}</td>
                    <td className={styles.amount}>{fmt(c.amount_commission)}</td>
                    <td>
                      <span className={`${styles.status} ${STATUS_CLASS[c.status] ?? styles.statusPaid}`}>
                        {STATUS_TEXT[c.status] ?? c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Historique paiements */}
      {payouts.length > 0 && (
        <section className={`${styles.panel} ${styles.tablePanel}`}>
          <div className={styles.tableHeader}>
            <h2 className={styles.sectionTitle}>Historique des paiements</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {['Date', 'Montant', 'Méthode', 'Référence', 'Statut'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.muted}>{format.dateTime(new Date(p.created_at), {day: '2-digit', month: 'short', year: 'numeric'})}</td>
                    <td className={styles.amount}>{fmt(p.amount)}</td>
                    <td className={styles.muted}>{p.payment_method === 'paypal' ? 'PayPal' : 'Virement'}</td>
                    <td className={styles.muted}>{p.payment_reference ?? '—'}</td>
                    <td>
                      <span className={`${styles.status} ${PAYOUT_STATUS_CLASS[p.status] ?? styles.statusPending}`}>
                        {p.status === 'paid' ? 'Payé' : p.status === 'failed' ? 'Échoué' : 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Méthode de paiement */}
      <section className={`${styles.panel} ${styles.section}`}>
        <div className={styles.paymentHeader}>
          <h2 className={styles.sectionTitle}>Méthode de paiement</h2>
          {!editPayment && (
            <button onClick={() => setEditPayment(true)} className={styles.editButton}>
              Modifier
            </button>
          )}
        </div>

        {!editPayment ? (
          <div className={styles.paymentDetails}>
            {affiliate.payment_method === 'paypal' ? (
              <p>PayPal · <strong>{affiliate.paypal_email}</strong></p>
            ) : affiliate.payment_method === 'bank_transfer' ? (
              <>
                <p>Virement · <strong>{affiliate.iban}</strong></p>
                {affiliate.bic && <p>BIC : {affiliate.bic}</p>}
                <p>Titulaire : {affiliate.account_holder_name}</p>
              </>
            ) : (
              <p>{"Non renseigné"}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handlePaymentUpdate} className={styles.form}>
            <div className={styles.choiceGrid}>
              {(['paypal', 'bank_transfer'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  aria-pressed={method === m}
                  className={`${styles.choice} ${method === m ? styles.choiceActive : ''}`}
                >
                  {m === 'paypal' ? 'PayPal' : 'Virement bancaire'}
                </button>
              ))}
            </div>
            <input type="hidden" name="payment_method" value={method} />

            {method === 'paypal' ? (
              <input
                name="paypal_email"
                type="email"
                required
                defaultValue={affiliate.paypal_email ?? ''}
                className={styles.input}
                placeholder="Email PayPal"
                aria-label="Email PayPal"
              />
            ) : (
              <div className={styles.form}>
                <input
                  name="account_holder_name"
                  required
                  defaultValue={affiliate.account_holder_name ?? ''}
                  className={styles.input}
                  placeholder="Titulaire du compte"
                  aria-label="Titulaire du compte"
                />
                <input
                  name="iban"
                  required
                  defaultValue={affiliate.iban ?? ''}
                  className={`${styles.input} ${styles.mono}`}
                  placeholder="IBAN"
                  aria-label="IBAN"
                />
                <input
                  name="bic"
                  defaultValue={affiliate.bic ?? ''}
                  className={`${styles.input} ${styles.mono}`}
                  placeholder="BIC / SWIFT (optionnel)"
                  aria-label="BIC / SWIFT"
                />
              </div>
            )}

            <div className={styles.actions}>
              <button type="submit" disabled={isPending} className={styles.button}>
                {isPending ? 'Mise à jour...' : 'Enregistrer'}
              </button>
              <button type="button" onClick={() => setEditPayment(false)} className={styles.secondaryButton}>
                Annuler
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
