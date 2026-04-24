'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface FlashcardCardProps {
  question: string
  answer: string
  onKnew: () => void
  onDidntKnow: () => void
  current: number
  total: number
}

type ExplainStyle = 'analogy' | 'example' | 'simple' | 'stepbystep'

const EXPLAIN_STYLES: { key: ExplainStyle; label: string; icon: string }[] = [
  { key: 'analogy', label: 'Analogie', icon: '🔗' },
  { key: 'example', label: 'Exemple concret', icon: '🌍' },
  { key: 'simple', label: 'Explication simple', icon: '👶' },
  { key: 'stepbystep', label: 'Étape par étape', icon: '📋' },
]

export function FlashcardCard({ question, answer, onKnew, onDidntKnow, current, total }: FlashcardCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [showExplain, setShowExplain] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)

  function flip() {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setFlipped((f) => !f)
      setAnimating(false)
    }, 150)
  }

  function handleKnew() {
    setFlipped(false)
    setExplanation(null)
    setShowExplain(false)
    setTimeout(onKnew, 150)
  }

  function handleDidntKnow() {
    setFlipped(false)
    setExplanation(null)
    setShowExplain(false)
    setTimeout(onDidntKnow, 150)
  }

  async function handleExplain(style: ExplainStyle) {
    setExplaining(true)
    setShowExplain(false)
    try {
      const res = await fetch('/api/generate/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, style }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erreur')
        return
      }
      setExplanation(json.explanation)
    } catch {
      toast.error('Erreur lors de la génération')
    } finally {
      setExplaining(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-sm text-gray-400">
        Carte <span className="font-semibold text-white">{current}</span> sur <span className="font-semibold text-white">{total}</span>
      </div>

      <div className="w-full max-w-lg">
        <div className="w-full h-2 bg-white/10 rounded-full mb-6">
          <div
            className="h-2 bg-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>

        <div
          className="cursor-pointer select-none relative"
          style={{ height: '300px' }}
          onClick={!flipped ? flip : undefined}
        >
          {/* Face question */}
          <div
            className="absolute inset-0 flex items-center justify-center p-8 rounded-2xl bg-white/5 border border-white/10 transition-opacity duration-150"
            style={{
              opacity: animating ? 0 : (flipped ? 0 : 1),
              pointerEvents: flipped ? 'none' : 'auto',
            }}
          >
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-4 uppercase tracking-wider">Question</div>
              <p className="text-xl font-medium text-white">{question}</p>
              <p className="text-sm text-gray-500 mt-6">Cliquez pour voir la réponse</p>
            </div>
          </div>

          {/* Face réponse */}
          <div
            className="absolute inset-0 flex items-center justify-center p-8 rounded-2xl bg-violet-600/20 border border-violet-500/30 transition-opacity duration-150"
            style={{
              opacity: animating ? 0 : (flipped ? 1 : 0),
              pointerEvents: flipped ? 'auto' : 'none',
            }}
          >
            <div className="text-center">
              <div className="text-xs text-violet-400 mb-4 uppercase tracking-wider">Réponse</div>
              {explanation ? (
                <div>
                  <p className="text-sm text-gray-400 line-through mb-2">{answer}</p>
                  <p className="text-base text-white italic">{explanation}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExplanation(null) }}
                    className="mt-2 text-xs text-violet-400 hover:text-violet-300"
                  >
                    Voir la réponse originale
                  </button>
                </div>
              ) : (
                <p className="text-lg text-white">{answer}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {flipped && (
        <>
          {/* Explique-moi autrement */}
          <div className="w-full max-w-lg">
            {showExplain ? (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs text-gray-400 mb-2 text-center">Choisir un style d&apos;explication</div>
                <div className="grid grid-cols-2 gap-2">
                  {EXPLAIN_STYLES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => handleExplain(s.key)}
                      disabled={explaining}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 border border-white/10 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      <span>{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowExplain(false)}
                  className="mt-2 w-full text-xs text-gray-500 hover:text-gray-300"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowExplain(true)}
                disabled={explaining}
                className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-violet-400 hover:border-violet-500/30 transition-colors flex items-center justify-center gap-2"
              >
                {explaining ? (
                  <><span className="animate-spin">⟳</span> Génération...</>
                ) : (
                  <><span>💡</span> Expliquer autrement</>
                )}
              </button>
            )}
          </div>

          {/* Je savais / Je ne savais pas */}
          <div className="flex gap-4 w-full max-w-lg">
            <button
              onClick={handleDidntKnow}
              className="flex-1 py-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors font-semibold"
            >
              ✗ Je ne savais pas
            </button>
            <button
              onClick={handleKnew}
              className="flex-1 py-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors font-semibold"
            >
              ✓ Je savais
            </button>
          </div>
        </>
      )}

      {!flipped && (
        <button
          onClick={flip}
          className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          Retourner la carte
        </button>
      )}
    </div>
  )
}
