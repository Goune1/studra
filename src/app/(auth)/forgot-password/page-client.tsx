'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Une erreur est survenue. Réessaie dans un instant.")
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      toast.error("Une erreur est survenue. Réessaie dans un instant.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            {"Studra"}
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-2">{"Mot de passe oublié"}</h1>
          <p className="text-gray-400">{sent ? "Vérifie ta boîte mail" : "On t'envoie un lien pour en choisir un nouveau"}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {sent ? (
            <p className="text-sm text-gray-300 leading-relaxed">{"Si un compte Studra existe avec cette adresse, tu vas recevoir un email contenant un lien de réinitialisation. Il expire dans 1 heure. Pense à regarder tes spams."}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{"Email"}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder={"votre@email.com"}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-colors"
              >
                {loading ? "Envoi..." : "Envoyer le lien"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-gray-400">
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            {"Retour à la connexion"}
          </Link>
        </p>
      </div>
    </div>
  )
}
