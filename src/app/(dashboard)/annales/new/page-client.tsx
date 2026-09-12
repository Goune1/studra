'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, FilePdf, Info, Sparkle, UploadSimple } from '@phosphor-icons/react'
import ContentPicker from '@/components/ContentPicker'
import type { ContentItem } from '@/types'
import styles from '../annales.module.css'

export default function AnnalesNewPage() {
  const [examText, setExamText] = useState('')
  const [examFile, setExamFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [courseContent, setCourseContent] = useState<ContentItem | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function handleFileUpload(file: File) {
    if (file.type !== 'application/pdf') { toast.error('Seuls les fichiers PDF sont acceptés'); return }
    setExamFile(file); setExtracting(true)
    try { const fd = new FormData(); fd.append('file', file); const res = await fetch('/api/extract/pdf', { method: 'POST', body: fd }); const json = await res.json(); if (!res.ok) { toast.error(json.error ?? 'Erreur d’extraction PDF'); return }; setExamText(json.text); toast.success(`PDF extrait (${json.pages} ${json.pages === 1 ? 'page' : 'pages'})`) } catch { toast.error('Erreur lors de la lecture du PDF') } finally { setExtracting(false) }
  }
  async function handleGenerate() {
    if (!examText || !courseContent || !title) return
    setLoading(true)
    try { const res = await fetch('/api/generate/annales', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ exam_text:examText, course_content:courseContent.source_content, title }) }); const json = await res.json(); if (!res.ok) { toast.error(json.error ?? 'Erreur lors de la génération'); return }; toast.success('Annale générée'); router.push(`/annales/${json.examId}`) } catch { toast.error('Une erreur est survenue') } finally { setLoading(false) }
  }
  const canGenerate = examText.length >= 100 && courseContent && title.trim()
  return <main className={styles.createPage}>
    <header className={styles.header}><div><p className={styles.context}>Annales · Création</p><h1 className={styles.title}>Générer une annale</h1><p className={styles.summary}>Pars d’un ancien sujet et de ton cours pour composer une nouvelle épreuve corrigée.</p></div></header>
    <div className={styles.createGrid}><div className={styles.panel}>
      <section className={styles.section}><h2>1. Ancienne annale</h2><p>Dépose le PDF d’un ancien examen ou colle son texte.</p><label className={styles.drop} data-ready={Boolean(examFile)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void handleFileUpload(file) }}><input type="file" accept=".pdf" onChange={event => { const file = event.target.files?.[0]; if (file) void handleFileUpload(file) }} />{extracting ? 'Extraction en cours…' : examFile ? <><FilePdf size={21} weight="regular" />{examFile.name}</> : <><UploadSimple size={21} weight="regular" />Dépose un PDF ici ou clique pour le sélectionner</>}</label><p className={styles.hint}>ou colle directement le texte ci-dessous</p><textarea value={examText} onChange={event => setExamText(event.target.value)} className={styles.textarea} placeholder="Colle ici le texte de l’ancienne annale…" aria-label="Texte de l’ancienne annale" />{examText.length > 0 && <p className={styles.hint}>{examText.length} caractères extraits</p>}</section>
      <section className={styles.section}><h2>2. Cours source</h2><p>Sélectionne le cours à utiliser pour le nouveau sujet.</p><ContentPicker selected={courseContent} onSelect={setCourseContent} /></section>
      <section className={styles.section}><label className={styles.fieldLabel} htmlFor="annale-title">3. Titre du sujet généré</label><input id="annale-title" value={title} onChange={event => setTitle(event.target.value)} className={styles.input} placeholder="Ex. Examen — Chapitre 3 — La photosynthèse" /></section>
    </div><aside className={styles.aside}><h2>Ce que tu obtiens</h2><p>Un nouveau sujet construit dans le style de ton annale.</p><ul><li><CheckCircle size={15} weight="regular" />Des questions adaptées à ton cours</li><li><CheckCircle size={15} weight="regular" />Un corrigé détaillé, question par question</li><li><Info size={15} weight="regular" />Une génération déduite de ton quota mensuel</li></ul></aside></div>
    <div className={styles.submitRow}><button onClick={() => void handleGenerate()} disabled={!canGenerate || loading} className={styles.primary}><Sparkle size={16} weight="regular" />{loading ? 'Génération en cours…' : 'Générer le sujet'}</button><p className={styles.quota}>Compte comme une génération sur ton quota mensuel</p></div>
  </main>
}
