import Link from 'next/link'
import { ArrowLeft, Cards } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { FicheViewer } from '@/components/fiche-viewer'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import styles from '../../flashcards/flashcards.module.css'
import ficheStyles from '../fiches.module.css'

function wordCount(content: string) {
  return content.trim().split(/\s+/).filter(Boolean).length
}

function extractHeadings(content: string): string[] {
  return content.split('\n').filter((line) => line.startsWith('## ')).map((line) => line.replace(/^#+\s+/, '').trim())
}

function headingId(heading: string) {
  return heading.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default async function FichePage({ params }: { params: Promise<{ ficheId: string }> }) {
  const { ficheId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: fiche } = await supabase.from('fiches').select('*').eq('id', ficheId).single()
  if (!fiche) notFound()
  if (fiche.user_id !== user!.id && !fiche.is_public) notFound()

  const words = wordCount(fiche.generated_content)
  const readingTime = Math.max(1, Math.round(words / 200))
  const headings = extractHeadings(fiche.generated_content)
  const createdAt = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(fiche.created_at))

  return (
    <div className={styles.deckPage}>
      <Link href="/fiches" className={styles.backLink}><ArrowLeft size={14} /> Mes fiches</Link>

      <section className={styles.deckHeaderCard}>
        <div className={styles.deckHeaderMain}>
          <div className={styles.deckIdentity}>
            <p>{fiche.subject || 'Sans matière'} · {createdAt}</p>
            <h1>{fiche.title}</h1>
            <span>~{words.toLocaleString('fr-FR')} mots · {readingTime} min de lecture</span>
          </div>
          <div className={styles.deckActions}>
            {fiche.user_id === user!.id && (
              <DeleteEntityButton
                table="fiches"
                id={fiche.id}
                entityLabel="cette fiche"
                variant="button"
                color="#1F4D3F"
                redirectTo="/fiches"
              />
            )}
            <Link href={`/flashcards/new?fiche=${ficheId}`} className={styles.primaryButton}>
              <Cards size={16} aria-hidden="true" />
              Créer des flashcards
            </Link>
          </div>
        </div>
        <div className={styles.deckHeaderNote}>
          <span>Fiche modifiable</span>
          <span>Relis, corrige et complète le contenu directement dans Studra.</span>
        </div>
      </section>

      <div className={ficheStyles.ficheLayout}>
        <section className={ficheStyles.ficheContent}>
          <header className={ficheStyles.ficheContentHeader}>
            <div>
              <p>Contenu de la fiche</p>
              <h2>Ta synthèse</h2>
            </div>
            <span>{headings.length} section{headings.length > 1 ? 's' : ''}</span>
          </header>
          <div className={ficheStyles.ficheViewerBody}>
            <FicheViewer content={fiche.generated_content} ficheId={fiche.user_id === user!.id ? ficheId : undefined} />
          </div>
        </section>

        <aside className={ficheStyles.ficheSidebar}>
          {headings.length > 0 && (
            <section className={ficheStyles.sidebarPanel}>
              <p className={ficheStyles.panelLabel}>Sommaire</p>
              <nav className={ficheStyles.tocList}>
                {headings.map((heading, index) => (
                  <a key={`${heading}-${index}`} href={`#${headingId(heading)}`} className={ficheStyles.tocLink}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <span>{heading}</span>
                  </a>
                ))}
              </nav>
            </section>
          )}

          <section className={ficheStyles.sidebarPanel}>
            <p className={ficheStyles.panelLabel}>Statistiques</p>
            <div className={ficheStyles.statsList}>
              <div className={ficheStyles.statRow}><span>Mots</span><strong>~{words.toLocaleString('fr-FR')}</strong></div>
              <div className={ficheStyles.statRow}><span>Lecture</span><strong>{readingTime} min</strong></div>
              <div className={ficheStyles.statRow}><span>Créée le</span><strong>{createdAt}</strong></div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
