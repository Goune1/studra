import {Resend} from 'resend'
import {defaultLocale, getLocalizedPathname, type AppLocale} from '@/i18n/pathname'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Studra <noreply@studra.fr>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studra.fr'

type TransactionalEmailTemplate = {
  subject: string
  body: (dashboardUrl: string) => string
}

type TransactionalEmailTemplateSet = {
  welcome: TransactionalEmailTemplate
  welcomePro: TransactionalEmailTemplate
  subscriptionCancelled: TransactionalEmailTemplate
}

// Other locales intentionally fall back to French until their copy is validated.
// This keeps transactional templates separate from the next-intl UI catalog.
const transactionalEmailTemplates: Partial<Record<AppLocale, TransactionalEmailTemplateSet>> = {
  fr: {
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

function getTemplateSet(locale: AppLocale): {
  contentLocale: AppLocale
  templates: TransactionalEmailTemplateSet
} {
  const templates = transactionalEmailTemplates[locale] ?? transactionalEmailTemplates.fr!
  return {
    contentLocale: transactionalEmailTemplates[locale] ? locale : defaultLocale,
    templates,
  }
}

function localizedDashboardUrl(locale: AppLocale): string {
  return new URL(getLocalizedPathname('/dashboard', locale), APP_URL).toString()
}

function baseLayout(content: string, locale: AppLocale): string {
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Studra</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#1a1a2e;padding:28px 40px;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Studra</span>
            </td>
          </tr>
          <tr><td style="padding:40px;">${content}</td></tr>
          <tr>
            <td style="background:#f4f4f5;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                © ${new Date().getFullYear()} Studra · <a href="${APP_URL}" style="color:#6b7280;">studra.fr</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function sendTransactionalEmail(
  to: string,
  locale: AppLocale,
  templateName: keyof TransactionalEmailTemplateSet,
) {
  const {contentLocale, templates} = getTemplateSet(locale)
  const template = templates[templateName]
  const dashboardUrl = localizedDashboardUrl(locale)

  return resend.emails.send({
    from: FROM,
    to,
    subject: template.subject,
    html: baseLayout(template.body(dashboardUrl), contentLocale),
  })
}

export async function sendWelcomeEmail(to: string, locale: AppLocale = defaultLocale) {
  return sendTransactionalEmail(to, locale, 'welcome')
}

export async function sendWelcomeProEmail(to: string, locale: AppLocale = defaultLocale) {
  return sendTransactionalEmail(to, locale, 'welcomePro')
}

export async function sendSubscriptionCancelledEmail(to: string, locale: AppLocale = defaultLocale) {
  return sendTransactionalEmail(to, locale, 'subscriptionCancelled')
}
