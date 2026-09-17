import {Resend} from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Studra <noreply@studra.fr>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studra.fr'

type TransactionalEmailTemplate = {
  subject: string
  body: (actionUrl: string) => string
}

type TransactionalEmailTemplateSet = {
  welcome: TransactionalEmailTemplate
  welcomePro: TransactionalEmailTemplate
  subscriptionCancelled: TransactionalEmailTemplate
  passwordReset: TransactionalEmailTemplate
}

const transactionalEmailTemplates: TransactionalEmailTemplateSet = {
    welcome: {
      subject: 'Bienvenue sur Studra 👋',
      body: (dashboardUrl) => `
        <h1 style="margin:0 0 16px;font-size:24px;color:#1a1a2e;">Bienvenue sur Studra 👋</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
          Ton compte est créé, tu peux maintenant réviser plus intelligemment.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
          Importe un cours, une vidéo YouTube ou un PDF et laisse Studra générer
          tes fiches, flashcards, schémas et examens blancs en quelques secondes.
        </p>
        ${emailButton(dashboardUrl, 'Commencer à réviser →')}
        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
          Une question ? Réponds directement à cet email.
        </p>
      `,
    },
    welcomePro: {
      subject: 'Bienvenue dans Studra Pro 🎉',
      body: (dashboardUrl) => `
        <h1 style="margin:0 0 16px;font-size:24px;color:#1a1a2e;">Bienvenue dans Studra Pro 🎉</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
          Ton abonnement Pro est maintenant actif. Tu as accès à toutes les fonctionnalités de Studra sans limite.
        </p>
        <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;color:#374151;line-height:1.8;">
          <li>Génération illimitée de fiches, flashcards et schémas</li>
          <li>Examens blancs personnalisés</li>
          <li>Mode Socrate (questions guidées)</li>
          <li>Timelines interactives</li>
        </ul>
        ${emailButton(dashboardUrl, 'Accéder au tableau de bord →')}
        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
          Une question ? Réponds directement à cet email, on est là pour toi.
        </p>
      `,
    },
    subscriptionCancelled: {
      subject: 'Ton abonnement Studra Pro a été annulé',
      body: (dashboardUrl) => `
        <h1 style="margin:0 0 16px;font-size:24px;color:#1a1a2e;">Ton abonnement a été annulé</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
          Ton abonnement Pro a bien été annulé. Tu conserves l'accès Pro jusqu'à la fin de la période déjà payée.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
          Après cela, ton compte passera automatiquement en formule gratuite.
          Tu pourras te réabonner à tout moment depuis ton tableau de bord.
        </p>
        ${emailButton(dashboardUrl, 'Gérer mon compte')}
        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
          Si c'était une erreur ou si tu as des questions, réponds à cet email.
        </p>
      `,
    },
    passwordReset: {
      subject: 'Réinitialise ton mot de passe Studra',
      body: (resetUrl) => `
        <h1 style="margin:0 0 16px;font-size:24px;color:#1a1a2e;">Réinitialise ton mot de passe</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
          Tu as demandé à réinitialiser le mot de passe de ton compte Studra.
          Clique sur le bouton ci-dessous pour en choisir un nouveau.
        </p>
        ${emailButton(resetUrl, 'Choisir un nouveau mot de passe →')}
        <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
          Ce lien expire dans 1 heure et ne peut être utilisé qu'une seule fois.
        </p>
        <p style="margin:12px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
          Si tu n'es pas à l'origine de cette demande, ignore simplement cet email :
          ton mot de passe actuel reste valable.
        </p>
      `,
    },
}

function emailButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0">
    <tr>
      <td style="background:#1a1a2e;border-radius:8px;">
        <a href="${href}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

function dashboardUrl(): string {
  return new URL('/dashboard', APP_URL).toString()
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Studra</title></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#1a1a2e;padding:28px 40px;"><span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Studra</span></td></tr><tr><td style="padding:40px;">${content}</td></tr><tr><td style="background:#f4f4f5;padding:20px 40px;text-align:center;"><p style="margin:0;font-size:12px;color:#6b7280;">© ${new Date().getFullYear()} Studra · <a href="${APP_URL}" style="color:#6b7280;">studra.fr</a></p></td></tr></table></td></tr></table></body></html>`
}

async function sendTransactionalEmail(to: string, templateName: keyof TransactionalEmailTemplateSet, actionUrl?: string) {
  const template = transactionalEmailTemplates[templateName]
  const url = actionUrl ?? dashboardUrl()
  return resend.emails.send({from: FROM, to, subject: template.subject, html: baseLayout(template.body(url))})
}

// ── Parrainage ───────────────────────────────────────────────────────────────
// Sujets sans emoji, contrairement aux templates historiques (choix assumé).

const REFERRAL_MAX_MONTHS = 3
const REFERRALS_PER_MONTH = 2

export interface ReferralQualifiedEmailData {
  /** Filleuls qualifiés comptant pour le prochain mois (sur 2), null au plafond. */
  progress: number | null
}

export interface ReferralRewardEmailData {
  sequence: number
  proUntil: string
  hasStripeSubscription: boolean
}

function referralPageUrl(): string {
  return new URL('/settings/parrainage', APP_URL).toString()
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">${text}</p>`
}

export function referralQualifiedEmail({progress}: ReferralQualifiedEmailData): {subject: string; html: string} {
  const next = progress === null
    ? `Tu as déjà obtenu tes ${REFERRAL_MAX_MONTHS} mois offerts : ce parrainage est bien enregistré, mais il ne donne plus de mois supplémentaire.`
    : `Tu es à ${progress}/${REFERRALS_PER_MONTH} vers ton prochain mois de Pro offert.`
  return {
    subject: "Un de tes filleuls vient d'être qualifié",
    html: baseLayout(`
      <h1 style="margin:0 0 16px;font-size:24px;color:#1a1a2e;">Un filleul de plus</h1>
      ${paragraph('Une personne inscrite avec ton lien de parrainage vient de générer son premier contenu sur Studra.')}
      ${paragraph(next)}
      <div style="height:8px;"></div>
      ${emailButton(referralPageUrl(), 'Voir mon parrainage')}
    `),
  }
}

export function referralRewardEmail({sequence, proUntil, hasStripeSubscription}: ReferralRewardEmailData): {subject: string; html: string} {
  const until = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris'}).format(new Date(proUntil))
  const count = sequence >= REFERRAL_MAX_MONTHS
    ? `C'était ton ${REFERRAL_MAX_MONTHS}e et dernier mois offert. Merci d'avoir fait connaître Studra.`
    : `Mois offerts obtenus : ${sequence}/${REFERRAL_MAX_MONTHS}.`
  return {
    subject: 'Tu as gagné un mois de Studra Pro',
    html: baseLayout(`
      <h1 style="margin:0 0 16px;font-size:24px;color:#1a1a2e;">Un mois de Pro offert</h1>
      ${paragraph('Deux personnes inscrites avec ton lien utilisent maintenant Studra. Comme promis, tu gagnes un mois de Studra Pro, sans carte bancaire.')}
      ${paragraph(`Ton Pro offert court jusqu'au <strong>${until}</strong>.`)}
      ${hasStripeSubscription ? paragraph('Ton abonnement en cours continue normalement : le mois offert court en parallèle.') : ''}
      ${paragraph(count)}
      <div style="height:8px;"></div>
      ${emailButton(referralPageUrl(), 'Voir mon parrainage')}
    `),
  }
}

export async function sendReferralQualifiedEmail(to: string, data: ReferralQualifiedEmailData) {
  const {subject, html} = referralQualifiedEmail(data)
  return resend.emails.send({from: FROM, to, subject, html})
}

export async function sendReferralRewardEmail(to: string, data: ReferralRewardEmailData) {
  const {subject, html} = referralRewardEmail(data)
  return resend.emails.send({from: FROM, to, subject, html})
}

export async function sendWelcomeEmail(to: string) {
  return sendTransactionalEmail(to, 'welcome')
}

export async function sendWelcomeProEmail(to: string) {
  return sendTransactionalEmail(to, 'welcomePro')
}

export async function sendSubscriptionCancelledEmail(to: string) {
  return sendTransactionalEmail(to, 'subscriptionCancelled')
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
) {
  return sendTransactionalEmail(to, 'passwordReset', resetUrl)
}
