'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ClipboardText, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import type { Exam, ExamQuestion } from '@/types'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import { formatDate } from '@/lib/utils'
import styles from '../flashcards/flashcards.module.css'
import examStyles from './exams.module.css'

export type ExamSummary = Pick<Exam, 'id' | 'title' | 'subject' | 'questions' | 'created_at'>
export interface ExamSessionScore {
  exam_id: string
  score: number
}

type SortKey = 'recent' | 'oldest' | 'alpha'

function scoreColor(score: number) {
  return score >= 75 ? '#1F4D3F' : score >= 50 ? '#A8762E' : '#B4503C'
}

export default function ExamsPage({ initialExams, initialSessions }: { initialExams: ExamSummary[]; initialSessions: ExamSessionScore[] }) {
  const [exams, setExams] = useState(initialExams)
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('recent')

  const bestScores = useMemo(() => {
    const scores = new Map<string, number>()
    for (const session of initialSessions) {
      const previous = scores.get(session.exam_id)
      if (previous === undefined || session.score > previous) scores.set(session.exam_id, session.score)
    }
    return scores
  }, [initialSessions])

  const subjects = useMemo(() => {
    return Array.from(new Set(exams.map((exam) => exam.subject).filter(Boolean) as string[])).sort()
  }, [exams])

  const filtered = useMemo(() => {
    let result = exams
    if (search) result = result.filter((exam) => exam.title.toLowerCase().includes(search.toLowerCase()))
    if (subject) result = result.filter((exam) => exam.subject === subject)
    if (sort === 'alpha') result = [...result].sort((a, b) => a.title.localeCompare(b.title, 'fr'))
    if (sort === 'oldest') result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    return result
  }, [exams, search, subject, sort])

  const totalQuestions = exams.reduce((sum, exam) => sum + (exam.questions as ExamQuestion[]).length, 0)

  return (
    <div className={styles.libraryPage}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageContext}>Examens</p>
          <h1>Mes examens</h1>
          <p className={styles.pageSummary}>
            {exams.length === 0
              ? 'Transforme un cours en questions corrigées pour tester ce que tu maîtrises vraiment.'
              : `${exams.length} examen${exams.length > 1 ? 's' : ''} · ${totalQuestions} question${totalQuestions > 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/exams/new" className={styles.primaryButton}>
          <Plus size={15} weight="bold" aria-hidden="true" />
          Nouvel examen
        </Link>
      </header>

      {exams.length > 0 && (
        <section className={styles.libraryControls} aria-label="Rechercher et filtrer les examens">
          <label className={styles.searchField}>
            <MagnifyingGlass size={16} aria-hidden="true" />
            <span className="sr-only">Rechercher un examen</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par titre" />
          </label>
          <label className={styles.sortField}>
            <span>Trier</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              <option value="recent">Plus récent</option>
              <option value="oldest">Plus ancien</option>
              <option value="alpha">Alphabétique</option>
            </select>
          </label>
          {subjects.length > 0 && (
            <div className={styles.subjectFilters} aria-label="Filtrer par matière">
              <button type="button" data-active={subject === null} onClick={() => setSubject(null)}>Toutes</button>
              {subjects.map((item) => (
                <button key={item} type="button" data-active={subject === item} onClick={() => setSubject(subject === item ? null : item)}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {exams.length === 0 ? (
        <section className={styles.emptyLibrary}>
          <ClipboardText size={25} weight="regular" aria-hidden="true" />
          <div>
            <h2>Commence avec un seul cours</h2>
            <p>Studra prépare un examen mêlant QCM et questions ouvertes, puis corrige tes réponses.</p>
          </div>
          <Link href="/exams/new" className={styles.primaryButton}>Créer mon premier examen <ArrowRight size={15} /></Link>
        </section>
      ) : filtered.length === 0 ? (
        <section className={styles.noResults}>
          <div>
            <h2>Aucun examen ne correspond</h2>
            <p>Modifie la recherche ou affiche toutes les matières.</p>
          </div>
          <button type="button" onClick={() => { setSearch(''); setSubject(null) }}>Réinitialiser les filtres</button>
        </section>
      ) : (
        <section className={styles.deckGrid} aria-label="Examens blancs">
          {filtered.map((exam) => {
            const questions = exam.questions as ExamQuestion[]
            const mcqCount = questions.filter((question) => question.type === 'mcq').length
            const openCount = questions.filter((question) => question.type === 'open').length
            const bestScore = bestScores.get(exam.id)
            const color = bestScore === undefined ? undefined : scoreColor(bestScore)

            return (
              <article key={exam.id} className={styles.deckCard}>
                <div className={styles.deckCardTop}>
                  <span className={styles.deckSubject}>{exam.subject || 'Sans matière'}</span>
                  <div className={styles.deckCardActions}>
                    <time dateTime={exam.created_at}>{formatDate(exam.created_at)}</time>
                    <DeleteEntityButton
                      table="exams"
                      id={exam.id}
                      entityLabel="cet examen"
                      variant="icon"
                      color="#1F4D3F"
                      onDeleted={(id) => setExams((current) => current.filter((item) => item.id !== id))}
                    />
                  </div>
                </div>
                <Link href={`/exams/${exam.id}`} className={styles.deckCardLink}>
                  <h2>{exam.title}</h2>
                  <p className={examStyles.examDetails}>{mcqCount} QCM · {openCount} question{openCount > 1 ? 's' : ''} ouverte{openCount > 1 ? 's' : ''}</p>
                  <div className={examStyles.scoreLine}>
                    {color && <span className={examStyles.scoreDot} style={{ background: color }} />}
                    <span style={color ? { color } : undefined}>{bestScore === undefined ? 'Jamais tenté' : `Meilleur score : ${bestScore}%`}</span>
                  </div>
                  <div className={styles.deckCardMeta}>
                    <span>{questions.length} question{questions.length > 1 ? 's' : ''}</span>
                    <span className={styles.openDeck}>Voir l’examen <ArrowRight size={14} /></span>
                  </div>
                </Link>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
