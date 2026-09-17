'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { trackReferralLinkCreated, type ReferralLinkSource } from '@/lib/analytics'
import styles from './copy-referral-link-button.module.css'

export function CopyReferralLinkButton({ link, source }: { link: string; source: ReferralLinkSource }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      trackReferralLinkCreated(source)
    } catch {
      toast.error('Impossible de copier le lien. Sélectionne-le puis copie-le manuellement.')
    }
  }

  return (
    <button type="button" onClick={handleCopy} className={styles.copyButton}>
      {copied
        ? <Check size={16} strokeWidth={1.5} aria-hidden="true" />
        : <Copy size={16} strokeWidth={1.5} aria-hidden="true" />}
      {copied ? 'Lien copié' : 'Copier le lien'}
    </button>
  )
}
