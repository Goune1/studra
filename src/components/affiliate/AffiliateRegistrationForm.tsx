'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Percent } from '@phosphor-icons/react'
import { registerAffiliate } from '@/app/(dashboard)/affiliate/actions'
import Link from 'next/link'
import styles from './affiliate.module.css'

export function AffiliateRegistrationForm({
  userEmail,
  termsVersion,
}: {
  userEmail: string
  termsVersion: string
}) {
  const [method, setMethod] = useState<'paypal' | 'bank_transfer'>('paypal')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await registerAffiliate(formData)
      if (result.ok) {
        toast.success("Bienvenue dans le programme d'affiliation !")
      } else {
        toast.error(result.error ?? "Une erreur est survenue.")
      }
    })
  }

  return (
    <div className={`${styles.panel} ${styles.section}`}>
      <div className={styles.notice}>
        <Percent size={16} weight="regular" />
        <div>
          <strong>{"20% sur les paiements éligibles"}</strong>
          <p>
            {"Les commissions sont calculées sur les montants effectivement encaissés, puis deviennent payables après le délai de validation. Les remboursements et litiges sont déduits."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input type="hidden" name="terms_version" value={termsVersion} />

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="first_name">{"Prénom"} *</label>
            <input
              id="first_name"
              name="first_name"
              required
              maxLength={100}
              className={styles.input}
              placeholder="Jean"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="last_name">{"Nom"} *</label>
            <input
              id="last_name"
              name="last_name"
              required
              maxLength={100}
              className={styles.input}
              placeholder="Dupont"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact_email">{"Email de contact"} *</label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            required
            defaultValue={userEmail}
            maxLength={254}
            className={styles.input}
            placeholder="jean@example.com"
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>{"Moyen de paiement"} *</span>
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
        </div>

        {method === 'paypal' ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="paypal_email">{"Email PayPal"} *</label>
            <input
              id="paypal_email"
              name="paypal_email"
              type="email"
              required
              maxLength={254}
              className={styles.input}
              placeholder="jean@paypal.com"
            />
          </div>
        ) : (
          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="account_holder_name">{"Titulaire du compte"} *</label>
              <input
                id="account_holder_name"
                name="account_holder_name"
                required
                maxLength={200}
                className={styles.input}
                placeholder="Jean Dupont"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="iban">{"IBAN"} *</label>
              <input
                id="iban"
                name="iban"
                required
                maxLength={34}
                className={`${styles.input} ${styles.mono}`}
                placeholder="FR76 3000 6000 0112 3456 7890 189"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="bic">{"BIC / SWIFT (optionnel)"}</label>
              <input
                id="bic"
                name="bic"
                maxLength={11}
                className={`${styles.input} ${styles.mono}`}
                placeholder="BNPAFRPP"
              />
            </div>
          </div>
        )}

        <label className={styles.terms}>
          <input
            type="checkbox"
            name="accept_terms"
            required
            className={styles.checkbox}
          />
          <span>
            {"J'accepte les conditions du programme d'affiliation, notamment le délai de validation, les déductions en cas de remboursement ou litige et le seuil de paiement."}{' '}
            <Link href="/cgu#affiliation" className={styles.link}>
              {"Lire les conditions détaillées"}
            </Link>
          </span>
        </label>

        <button type="submit" disabled={isPending} className={styles.button}>
          {isPending ? "Inscription..." : "Rejoindre le programme d'affiliation"}
        </button>
      </form>
    </div>
  )
}
