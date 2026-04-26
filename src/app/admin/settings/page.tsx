import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/admin/Sidebar'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) redirect('/')

  const vars = [
    { key: 'NEXT_PUBLIC_APP_URL',        value: process.env.NEXT_PUBLIC_APP_URL,        label: 'URL de l\'application'      },
    { key: 'NEXT_PUBLIC_SUPABASE_URL',   value: process.env.NEXT_PUBLIC_SUPABASE_URL,   label: 'URL Supabase'               },
    { key: 'ADMIN_EMAIL',                value: process.env.ADMIN_EMAIL,                label: 'Email admin'                },
    { key: 'STRIPE_PRICE_ID',            value: process.env.STRIPE_PRICE_ID,            label: 'Stripe Price ID'            },
    { key: 'OPENAI_API_KEY',             value: process.env.OPENAI_API_KEY ? '••••••••' + process.env.OPENAI_API_KEY.slice(-4) : undefined, label: 'OpenAI API Key' },
    { key: 'STRIPE_SECRET_KEY',          value: process.env.STRIPE_SECRET_KEY ? '••••••••' + process.env.STRIPE_SECRET_KEY.slice(-4) : undefined, label: 'Stripe Secret Key' },
    { key: 'STRIPE_WEBHOOK_SECRET',      value: process.env.STRIPE_WEBHOOK_SECRET ? '••••••••' + process.env.STRIPE_WEBHOOK_SECRET.slice(-4) : undefined, label: 'Stripe Webhook Secret' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY',  value: process.env.SUPABASE_SERVICE_ROLE_KEY ? '••••••••' + process.env.SUPABASE_SERVICE_ROLE_KEY.slice(-4) : undefined, label: 'Supabase Service Role Key' },
  ]

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-100 flex">
      <Sidebar />
      <main className="flex-1 ml-12 xl:ml-[220px] min-h-screen transition-all duration-300">
        <div className="p-5 max-w-[900px]">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-base font-semibold text-white">Paramètres</h1>
              <p className="font-mono text-xs text-gray-600 mt-0.5">Configuration de l&apos;application</p>
            </div>
          </div>

          {/* Variables d'environnement */}
          <div className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-[#1E1E1E] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Variables d&apos;environnement</p>
            </div>
            <div className="divide-y divide-[#1A1A1A]">
              {vars.map(({ key, value, label }) => (
                <div key={key} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.01]">
                  <div>
                    <p className="text-xs text-white font-medium">{label}</p>
                    <p className="font-mono text-[10px] text-gray-600">{key}</p>
                  </div>
                  <span className={`font-mono text-[11px] px-3 py-1 rounded-lg ${value ? 'bg-[#1A2A1A] text-green-400' : 'bg-[#2A1A1A] text-red-500'}`}>
                    {value ?? 'non défini'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Limites du plan gratuit */}
          <div className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-[#1E1E1E]">
              <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Plan gratuit</p>
            </div>
            <div className="divide-y divide-[#1A1A1A]">
              {[
                { label: 'Générations / mois',   value: '5'    },
                { label: 'Formats disponibles',  value: 'Tous' },
                { label: 'Mode Socrate',          value: 'Non'  },
                { label: 'Analyse des lacunes',   value: 'Non'  },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <p className="text-xs text-gray-400">{label}</p>
                  <span className="font-mono text-[11px] text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Infos build */}
          <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-3">Build</p>
            <div className="space-y-2">
              {[
                { label: 'Framework',  value: 'Next.js 16 (App Router)'   },
                { label: 'Base',       value: 'Supabase (PostgreSQL)'      },
                { label: 'Auth',       value: 'Supabase Auth'              },
                { label: 'Paiements',  value: 'Stripe'                    },
                { label: 'IA',         value: 'OpenAI GPT-5 nano'         },
                { label: 'Deploy',     value: 'Vercel'                    },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <p className="font-mono text-[10px] text-gray-600">{label}</p>
                  <p className="font-mono text-[10px] text-gray-400">{value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
