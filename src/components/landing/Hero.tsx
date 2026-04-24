import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function Hero() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <header className="relative overflow-hidden max-sm:pt-14 max-sm:pb-6 max-sm:px-4 pt-20 pb-10 px-7" id="top" data-screen-label="Hero">
      <div className="hero-bg absolute inset-0 pointer-events-none z-0" />

      <div className="relative max-w-[1100px] mx-auto text-center z-10">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-line-2 rounded-full text-xs text-fg-dim bg-white/[0.03]">
          <span className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_10px_#a3e635]" />
          Nouveau · Mode Socrate
        </span>
        <h1 className="font-serif max-sm:text-[54px] text-[58px] md:text-[clamp(58px,7vw,88px)] leading-[0.98] tracking-[-0.035em] mt-7 mb-4.5 mx-auto max-w-[14ch]">
          Révise mieux. Retiens <em className="italic text-accent-gradient">plus vite.</em> Performe.
        </h1>
        <p className="max-sm:text-[13px] text-[18px] text-fg-dim max-w-[620px] mx-auto mb-8 leading-[1.55]">
          Colle un cours, un PDF ou un lien YouTube. Studra génère flashcards, fiches, schémas, timelines et examens blancs en quelques secondes, et t&apos;entraîne comme un coach personnel.
        </p>
        <div className="flex gap-3 justify-center items-center flex-wrap">
          <Link href={isLoggedIn ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
            {isLoggedIn ? 'Accéder à l\'application' : 'Commencer gratuitement'} <span className="arrow">→</span>
          </Link>
          <Link href="#how" className="btn btn-outline btn-lg">Voir comment ça marche</Link>
        </div>
        <div className="mt-5 flex gap-5.5 justify-center text-fg-mute text-[13px] flex-wrap">
          <span><span className="text-green">✓</span> Sans carte bancaire</span>
          <span><span className="text-green">✓</span> 5 générations offertes</span>
          <span><span className="text-green">✓</span> PDF · texte · YouTube</span>
        </div>
      </div>

      <ProductMock />
    </header>
  );
}

function ProductMock() {
  return (
    <div className="product relative mx-auto mt-15 max-w-[1140px] rounded-[22px] border border-line-2 bg-gradient-to-b from-[#0f0f1c] to-[#0a0a13] overflow-hidden shadow-[0_40px_120px_-20px_rgba(99,102,241,0.35),0_0_0_1px_rgba(255,255,255,0.03)]">
      {/* Topbar */}
      <div className="flex items-center max-sm:gap-2 max-sm:px-3 max-sm:py-2.5 gap-3.5 px-4.5 py-3.5 border-b border-line">
        <div className="flex gap-1.5">
          <span className="w-[11px] h-[11px] rounded-full bg-[#2a2a38]" />
          <span className="w-[11px] h-[11px] rounded-full bg-[#2a2a38]" />
          <span className="w-[11px] h-[11px] rounded-full bg-[#2a2a38]" />
        </div>
        <div className="flex-1 flex items-center gap-2 text-fg-mute bg-white/[0.03] border border-line rounded-lg max-sm:px-2 max-sm:py-1 max-sm:text-[11px] px-3 py-1.5 text-xs justify-center">
          <span>🔒</span>
          <span className="font-mono text-fg-dim">studra.fr/flashcards</span>
        </div>
        <div className="text-[11px] text-fg-mute font-mono">⌘K</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] min-h-[460px]">
        <aside className="hidden md:block border-r border-line p-4.5 bg-white/[0.015]">
          <SideLabel>Mes cours</SideLabel>
          <SideItem active>Histoire contemporaine</SideItem>
          <SideItem>Droit constitutionnel</SideItem>
          <SideItem>Microéconomie</SideItem>
          <SideItem>Biologie cellulaire</SideItem>
          <div className="mt-5"><SideLabel>Formats</SideLabel></div>
          <SideItem active>Flashcards · 18</SideItem>
          <SideItem>Fiche de révision</SideItem>
          <SideItem>Schéma</SideItem>
          <SideItem>Frise chrono.</SideItem>
          <SideItem>Examen blanc</SideItem>
        </aside>

        {/* Main content */}
        <main className="max-sm:px-4 max-sm:py-5 max-sm:gap-3.5 p-7 relative flex flex-col gap-5">
          <div className="max-sm:text-[11px] max-sm:leading-tight text-xs text-fg-mute">
            Cours › <strong className="text-fg-dim font-medium">Histoire contemporaine</strong> › <strong className="text-fg-dim font-medium">Guerre froide</strong>
          </div>
          <h3 className="font-serif max-sm:text-[22px] text-[26px] tracking-[-0.02em] m-0">Flashcards · Guerre froide</h3>
          <div className="flex max-sm:flex-wrap max-sm:gap-x-3.5 max-sm:gap-y-2 max-sm:text-[11px] gap-3.5 text-xs text-fg-mute font-mono">
            <span>📅 14 / 18</span>
            <span className="text-green">● FSRS actif</span>
            <span>Prochaine révision · 2h</span>
          </div>

          <Deck />

        </main>
      </div>
    </div>
  );
}

function SideLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-fg-mute uppercase tracking-[0.12em] mx-2 my-2.5">{children}</div>;
}

function SideItem({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] ${
        active ? 'bg-accent/[0.12] text-white shadow-[inset_0_0_0_1px_rgba(99,102,241,0.3)]' : 'text-fg-dim'
      }`}
    >
      <span className={`w-3.5 h-3.5 rounded ${active ? 'bg-accent' : 'bg-fg-mute opacity-50'}`} />
      {children}
    </div>
  );
}


function Deck() {
  return (
    <div className="relative self-center w-full max-sm:max-w-full max-sm:h-[260px] max-w-[560px] h-[230px] mx-auto">
      <Card
        className="max-sm:-translate-x-2 max-sm:translate-y-2.5 max-sm:-rotate-[3deg] -translate-x-4 translate-y-3.5 -rotate-[4deg] opacity-55"
        num="12/48" diff="Difficile"
      >
        Qu&apos;est-ce que la doctrine Brejnev ?
      </Card>
      <Card
        className="max-sm:translate-x-1.5 max-sm:translate-y-1 max-sm:rotate-[2deg] translate-x-2.5 translate-y-1.5 rotate-[2.5deg] opacity-80"
        num="13/48" diff="Moyen"
      >
        Conséquences du plan Marshall ?
      </Card>
      <Card className="card-floating" active num="14/48" diff="Actuelle">
        En quelle année a eu lieu la crise des missiles de Cuba&nbsp;?
      </Card>
    </div>
  );
}

function Card({
  children,
  className = '',
  num,
  diff,
  active,
}: {
  children: React.ReactNode;
  className?: string;
  num: string;
  diff: string;
  active?: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#15152a] border border-line-2 max-sm:rounded-[14px] max-sm:p-5 rounded-[18px] p-7 flex flex-col justify-between shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] ${className}`}
    >
      {/* Card header */}
      <div className="flex justify-between items-center text-[11px] text-fg-mute">
        {active ? (
          <span className="inline-flex items-center gap-1.5 max-sm:px-2 max-sm:py-0.5 max-sm:text-[10px] px-2.5 py-0.5 rounded-full bg-accent/[0.14] border border-[rgba(99,102,241,0.35)] text-[#c7c9ff] text-[11px]">
            ● {diff}
          </span>
        ) : (
          <span>Carte {num}</span>
        )}
        <span className="font-mono">{active ? `Carte ${num}` : diff}</span>
      </div>

      {/* Card question */}
      <div className="font-serif max-sm:text-[22px] max-sm:leading-[1.15] text-[30px] leading-[1.1] tracking-[-0.02em]">{children}</div>

      {/* Card footer */}
      <div className="max-sm:flex-col max-sm:items-start max-sm:gap-2 flex justify-between items-center text-[11px] text-fg-mute">
        {active ? (
          <>
            <span className="font-mono max-sm:hidden">Espace pour retourner</span>
            <div className="max-sm:flex-wrap max-sm:gap-1 flex gap-1.5">
              <Rate>À revoir</Rate>
              <Rate>Difficile</Rate>
              <Rate ok>Bien</Rate>
              <Rate ok>Facile</Rate>
            </div>
          </>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

function Rate({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <span
      className={`max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[10px] px-2 py-1 rounded-md bg-white/[0.04] border text-[11px] ${
        ok ? 'border-[rgba(163,230,53,0.35)] text-green' : 'border-line text-fg-dim'
      }`}
    >
      {children}
    </span>
  );
}
