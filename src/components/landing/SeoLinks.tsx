import {useTranslations} from 'next-intl'
import {Link} from '@/i18n/navigation'

const pages = [
  {
    key: 'flashcards',
    href: '/flashcards-ia',
  },
  {
    key: 'fiches',
    href: '/fiches-de-revision-ia',
  },
  {
    key: 'spacing',
    href: '/repetition-espacee',
  },
  {
    key: 'exam',
    href: '/examen-blanc-ia',
  },
] as const

export function SeoLinks() {
  const t = useTranslations('landing.seoLinks')
  return (
    <section className="py-20 px-7 border-b border-line">
      <div className="max-w-[1240px] mx-auto">
        <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">{t('eyebrow')}</span>
        <h2 className="font-serif text-[clamp(28px,4vw,44px)] leading-[1.05] tracking-[-0.02em] mt-3.5 mb-10 max-w-[24ch]">
          {t('title')}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {pages.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[18px] p-6 flex flex-col gap-3 hover:border-accent/40 transition-colors"
            >
              <h3 className="font-serif text-[19px] leading-[1.2] tracking-[-0.015em] group-hover:text-accent transition-colors">
                {t(`pages.${p.key}.label`)}
              </h3>
              <p className="text-fg-dim text-sm leading-[1.6] flex-1">{t(`pages.${p.key}.description`)}</p>
              <span className="text-accent text-sm mt-1">{t('learnMore')}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
