export function Formats() {
  return (
    <section id="formats" data-screen-label="Formats" className="py-30 px-7">
      <div className="max-w-[1240px] mx-auto">
        <div className="flex flex-col gap-6 mb-15">
          <div>
            <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">Formats · 05</span>
            <h2 className="font-serif text-[clamp(36px,5vw,60px)] leading-[1.02] tracking-[-0.03em] mt-3.5 mb-4.5 max-w-[18ch]">
              Cinq façons de transformer ton cours en <em className="italic text-[#c4b5fd]">mémoire durable.</em>
            </h2>
          </div>
          <p className="text-[17px] text-fg-dim max-w-[58ch] leading-[1.55]">
            Un seul import, cinq supports générés automatiquement. Choisis le format qui colle à ton style d&apos;apprentissage, ou combine-les tous pour verrouiller la matière.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4.5">
          <FormatCard span="md:col-span-8" num="01 · FLASHCARDS" title="Paires Q/R, espacées par un algo FSRS v5." desc="Extraction automatique des concepts clés. Chaque carte est planifiée pour ressortir juste avant que tu l'oublies. La méthode la plus efficace prouvée en sciences cognitives.">
            <FlashcardsVisual />
          </FormatCard>

          <FormatCard span="md:col-span-4" num="02 · FICHES" title="Synthèses hiérarchisées." desc="Plan, titres, sous-titres, points clés. En quelques secondes.">
            <SheetVisual />
          </FormatCard>

          <FormatCard span="md:col-span-4" num="03 · SCHÉMAS" title="Mind maps & arbres conceptuels." desc="Visualise les liens entre notions, exporte ton schéma en un clic.">
            <MindmapVisual />
          </FormatCard>

          <FormatCard span="md:col-span-8" num="04 · FRISES" title="Frises chronologiques interactives." desc="Studra repère les événements et dates dans ton cours et les met en forme automatiquement. Parfait pour l'histoire, le droit, la biologie du développement.">
            <TimelineVisual />
          </FormatCard>

          <article className="col-span-12 bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[22px] p-7 min-h-auto">
            <div className="grid md:grid-cols-[1fr_1.4fr] gap-10 items-center">
              <div>
                <div className="font-mono text-[11px] text-fg-mute tracking-[0.1em]">05 · EXAMENS BLANCS</div>
                <h3 className="font-serif text-[42px] leading-[1] tracking-[-0.02em] m-0 mt-3.5">Simule le jour J.</h3>
                <p className="text-fg-dim text-sm leading-[1.55] max-w-[42ch] mt-3.5">
                  QCM, questions ouvertes, correction automatique par l&apos;IA, score final détaillé. Reviens avec la confiance d&apos;avoir déjà réussi.
                </p>
              </div>
              <div className="flex-1 mt-2.5 rounded-[14px] bg-gradient-to-b from-[#0b0b15] to-[#0a0a13] border border-line p-7 min-h-[240px] flex items-center justify-center">
                <QuizVisual />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function FormatCard({
  span,
  num,
  title,
  desc,
  children,
}: {
  span: string;
  num: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`col-span-12 ${span} bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[22px] p-7 min-h-[360px] flex flex-col gap-3.5 relative overflow-hidden hover:border-line-2 hover:-translate-y-[3px] transition-all`}>
      <div className="font-mono text-[11px] text-fg-mute tracking-[0.1em]">{num}</div>
      <h3 className="font-serif text-[34px] leading-[1] tracking-[-0.02em] m-0">{title}</h3>
      <p className="text-fg-dim text-sm leading-[1.55] max-w-[42ch]">{desc}</p>
      <div className="flex-1 mt-2.5 rounded-[14px] bg-gradient-to-b from-[#0b0b15] to-[#0a0a13] border border-line p-4 relative overflow-hidden flex items-center justify-center">
        {children}
      </div>
    </article>
  );
}

function FlashcardsVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-7">
      <div className="absolute w-[45%] -translate-x-10 -translate-y-2.5 -rotate-[4deg] opacity-55 bg-gradient-to-b from-[#191933] to-[#12122a] border border-line-2 rounded-[10px] p-4 flex flex-col gap-2.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]">
        <div className="font-serif text-[18px]">Définis la notion de nation.</div>
        <div className="text-fg-dim text-xs border-t border-dashed border-line pt-2.5">Communauté humaine liée par langue, histoire, territoire…</div>
      </div>
      <div className="relative z-[2] w-[58%] bg-gradient-to-b from-[#191933] to-[#12122a] border border-line-2 rounded-[10px] p-4 flex flex-col gap-2.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]">
        <div className="font-serif text-[18px]">Qu&apos;est-ce qui distingue une nation civique d&apos;une nation ethnique&nbsp;?</div>
        <div className="text-fg-dim text-xs border-t border-dashed border-line pt-2.5">La première se fonde sur le consentement politique, la seconde sur des critères hérités…</div>
      </div>
    </div>
  );
}

function SheetVisual() {
  return (
    <div className="w-full h-full flex flex-col gap-1.5 p-1.5">
      <div className="h-2.5 rounded w-[40%] bg-gradient-to-r from-accent to-transparent" />
      <div className="h-2 rounded bg-white/[0.06] w-[90%]" />
      <div className="h-2 rounded bg-white/[0.06] ml-3.5 w-[60%]" />
      <div className="h-2 rounded bg-white/[0.06] ml-3.5 w-[75%]" />
      <div className="h-2.5 rounded w-[40%] mt-2 bg-gradient-to-r from-accent to-transparent" />
      <div className="h-2 rounded bg-white/[0.06] w-[85%]" />
      <div className="h-2 rounded bg-white/[0.06] ml-3.5 w-[55%]" />
      <div className="h-2 rounded bg-white/[0.06] ml-3.5 w-[65%]" />
    </div>
  );
}

function MindmapVisual() {
  return (
    <div className="relative w-full h-[160px]">
      <Node className="left-[38%] top-[42%]" center>Révolution</Node>
      <Node className="left-[8%] top-[14%]">Causes</Node>
      <Node className="left-[70%] top-[10%]">Acteurs</Node>
      <Node className="left-[6%] top-[72%]">Conséquences</Node>
      <Node className="left-[70%] top-[70%]">Dates clés</Node>
      <Edge style={{ left: '24%', top: '28%', width: '22%', transform: 'rotate(20deg)' }} />
      <Edge style={{ left: '56%', top: '26%', width: '22%', transform: 'rotate(-18deg)' }} />
      <Edge style={{ left: '22%', top: '66%', width: '22%', transform: 'rotate(-18deg)' }} />
      <Edge style={{ left: '55%', top: '65%', width: '22%', transform: 'rotate(18deg)' }} />
    </div>
  );
}

function Node({ children, className = '', center }: { children: React.ReactNode; className?: string; center?: boolean }) {
  return (
    <div
      className={`absolute px-2.5 py-1.5 rounded-lg text-[11px] ${className} ${
        center
          ? 'bg-accent/[0.16] border border-[rgba(99,102,241,0.55)] text-white font-medium'
          : 'border border-line-2 bg-white/[0.04] text-fg-dim'
      }`}
    >
      {children}
    </div>
  );
}

function Edge({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute h-px bg-gradient-to-r from-[rgba(99,102,241,0.6)] to-[rgba(99,102,241,0.05)] origin-left"
      style={style}
    />
  );
}

function TimelineVisual() {
  const events = [
    { yr: '1945', lbl: 'Yalta', active: false },
    { yr: '1947', lbl: 'Doctrine Truman', active: true },
    { yr: '1961', lbl: 'Mur de Berlin', active: false },
    { yr: '1962', lbl: 'Crise Cuba', active: true },
    { yr: '1989', lbl: 'Chute du Mur', active: false },
    { yr: '1991', lbl: 'Dissolution URSS', active: false },
  ];
  return (
    <div className="relative w-full h-20 flex items-center">
      <div className="absolute left-0 right-0 h-0.5 top-1/2 bg-gradient-to-r from-transparent via-[rgba(99,102,241,0.7)] to-transparent" />
      {events.map((e) => (
        <div key={e.yr} className="relative flex-1 flex flex-col items-center gap-2 text-fg-mute text-[10px]">
          <div
            className={`w-2.5 h-2.5 rounded-full border-2 border-accent shadow-[0_0_14px_rgba(99,102,241,0.7)] ${
              e.active ? 'bg-accent' : 'bg-surface-2'
            }`}
          />
          <span className="font-mono text-fg-dim">{e.yr}</span>
          <span>{e.lbl}</span>
        </div>
      ))}
    </div>
  );
}

function QuizVisual() {
  return (
    <div className="flex flex-col gap-2 max-w-[480px] w-full">
      <div className="font-serif text-[16px] mb-1">Laquelle de ces dates marque le début de la Guerre froide&nbsp;?</div>
      <QuizOpt>1939. Pacte germano-soviétique</QuizOpt>
      <QuizOpt correct>1947. Doctrine Truman</QuizOpt>
      <QuizOpt>1955. Pacte de Varsovie</QuizOpt>
      <QuizOpt>1962. Crise des missiles</QuizOpt>
    </div>
  );
}

function QuizOpt({ children, correct }: { children: React.ReactNode; correct?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 border rounded-lg text-xs ${
        correct
          ? 'border-[rgba(163,230,53,0.4)] text-[#d9f99d] bg-[rgba(163,230,53,0.06)]'
          : 'border-line text-fg-dim'
      }`}
    >
      <span className={`w-3.5 h-3.5 rounded border border-line-2 ${correct ? 'quiz-correct-box' : ''}`} />
      {children}
    </div>
  );
}
