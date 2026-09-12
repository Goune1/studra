'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, FileText, Plus } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import type { GeneratedPastExam } from '@/types'
import styles from './annales.module.css'

export default function AnnalesListPage() {
  const [exams, setExams] = useState<GeneratedPastExam[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function load() {
      const { data } = await createClient().from('generated_past_exams').select('*').order('created_at', { ascending: false })
      setExams((data ?? []) as GeneratedPastExam[])
      setLoading(false)
    }
    void load()
  }, [])
  const date = (value: string) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
  return <main className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.context}>Bibliothèque · Annales</p><div className={styles.titleRow}><h1 className={styles.title}>Mes annales</h1><span className={styles.count}>{loading ? '…' : `${exams.length} ${exams.length > 1 ? 'annales' : 'annale'}`}</span></div><p className={styles.summary}>Retrouve tes sujets générés et leurs corrigés.</p></div>
      <Link href="/annales/new" className={styles.primary}><Plus size={16} weight="regular" />Nouvelle annale</Link>
    </header>
    {loading ? <div className={styles.grid}>{[1,2,3].map(i => <div key={i} className={styles.skeleton} />)}</div> : exams.length === 0 ? <section className={styles.empty}><FileText size={28} weight="regular" /><div><h2>Pas encore d’annale</h2><p>Importe un ancien sujet et choisis un cours pour générer une nouvelle épreuve avec corrigé.</p></div><Link href="/annales/new" className={styles.primary}>Créer une annale</Link></section> : <section className={styles.grid}>{exams.map(exam => <article key={exam.id} className={styles.card}><div className={styles.delete}><DeleteEntityButton table="generated_past_exams" id={exam.id} entityLabel="cette annale" variant="icon" color="#1F4D3F" onDeleted={id => setExams(prev => prev.filter(exam => exam.id !== id))} /></div><Link href={`/annales/${exam.id}`} className={styles.cardLink}><div className={styles.cardTop}><span className={styles.iconBox}><FileText size={17} weight="regular" /></span><ArrowRight size={15} weight="regular" /></div><h2>{exam.title}</h2><div className={styles.meta}><span>{exam.questions_json.length} question{exam.questions_json.length > 1 ? 's' : ''}</span><time>{date(exam.created_at)}</time></div></Link></article>)}</section>}
  </main>
}
