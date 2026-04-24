export function Features() {
  return (
    <section id="features" data-screen-label="Features" className="py-30 px-7">
      <div className="max-w-[1240px] mx-auto">
        <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">Niveau au-dessus</span>
        <h2 className="font-serif text-[clamp(36px,5vw,60px)] leading-[1.02] tracking-[-0.03em] mt-3.5 mb-4.5 max-w-[18ch]">
          Des fonctionnalités que les <em className="italic text-[#c4b5fd]">top étudiants</em> utilisent déjà.
        </h2>
        <p className="text-[17px] text-fg-dim max-w-[58ch] leading-[1.55]">
          Pas juste du contenu auto-généré. Une méthode. Des coachs IA qui t&apos;interrogent, qui détectent tes failles, et qui planifient tes révisions à ta place.
        </p>

        <div className="grid grid-cols-6 gap-4.5 mt-15">
          <Tile span="md:col-span-3" name="Mode Socrate" title="Explique-le à Socrate. Si tu bloques, tu ne sais pas." desc="Tu expliques un concept à Socrate. Il pose des questions, soulève des contradictions, et te pousse à préciser ta pensée.">
            <div className="flex flex-col gap-2 mt-auto">
              <Bubble type="ia">Qu&apos;entends-tu exactement par « aide » dans la doctrine Truman ?</Bubble>
              <Bubble type="you">C&apos;est quand les États-Unis soutiennent les pays menacés par le communisme.</Bubble>
              <Bubble type="ia">Et qu&apos;est-ce qui distingue ce soutien de ce qu&apos;ils faisaient déjà avant 1947 ?</Bubble>
            </div>
          </Tile>

          <Tile span="md:col-span-3" name="Rappel libre" title="Vide ta mémoire. Identifie les trous." desc="Rappel libre chronométré. Tu dis tout ce que tu sais sur un chapitre, l'IA écoute et identifie les trous.">
            <div className="mt-auto flex items-center gap-4">
              <div className="timer-ring w-[74px] h-[74px] rounded-full flex items-center justify-center relative">
                <span className="relative font-mono text-[15px]">02:43</span>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-1 rounded-full bg-gradient-to-r from-accent via-accent-2 to-transparent" />
                <div className="h-1 rounded-full w-4/5 opacity-60 bg-gradient-to-r from-accent via-accent-2 to-transparent" />
                <div className="h-1 rounded-full w-[55%] opacity-35 bg-gradient-to-r from-accent via-accent-2 to-transparent" />
                <div className="text-[11px] text-fg-mute font-mono mt-1">● Enregistrement</div>
              </div>
            </div>
          </Tile>

          <Tile span="md:col-span-4" name="Planning" title="Un plan de révision adapté à ton examen." desc="Donne-nous la date. On orchestre les sessions, les formats, les chapitres, pour que tu arrives prêt sans finir en panique la veille.">
            <Calendar />
          </Tile>

          <Tile span="md:col-span-2" name="Lacunes" title="Diagnostic personnalisé.">
            <div className="mt-auto flex flex-col gap-2.5">
              <GapRow label="Les alliances" color="red" pct="28%" width="28%" />
              <GapRow label="Dates clés" color="amber" pct="58%" width="58%" />
              <GapRow label="Acteurs" color="green" pct="90%" width="90%" />
            </div>
          </Tile>

          <Tile span="col-span-6" name="Import multi-sources" title="PDF, texte collé, YouTube. Trois secondes, c'est dans Studra." desc="Extraction OCR sur tes scans, transcription auto des vidéos, nettoyage intelligent du texte collé. Pas besoin de préparer quoi que ce soit." horizontal>
            <div className="flex gap-2.5 flex-wrap">
              <Source color="bg-[#ef4444]">Cours_Histoire.pdf</Source>
              <Source color="bg-[#f43f5e]">Conférence Sciences Po</Source>
              <Source color="bg-amber">Notes de TD</Source>
              <Source color="bg-green">Wikipédia · URL</Source>
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({
  span,
  name,
  title,
  desc,
  children,
  horizontal,
}: {
  span: string;
  name: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
  horizontal?: boolean;
}) {
  if (horizontal) {
    return (
      <article className={`col-span-6 ${span} bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[22px] p-7 min-h-[200px] relative overflow-hidden`}>
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-10 items-center h-full">
          <div>
            <span className="font-mono text-[11px] text-accent tracking-[0.15em] uppercase">{name}</span>
            <h3 className="font-serif text-[30px] leading-[1.05] tracking-[-0.02em] m-0 mt-2.5">{title}</h3>
            {desc && <p className="text-fg-dim text-sm leading-[1.55] mt-2">{desc}</p>}
          </div>
          {children}
        </div>
      </article>
    );
  }
  return (
    <article className={`col-span-6 ${span} bg-gradient-to-b from-surface to-bg-2 border border-line rounded-[22px] p-7 min-h-[280px] relative overflow-hidden flex flex-col gap-3`}>
      <span className="font-mono text-[11px] text-accent tracking-[0.15em] uppercase">{name}</span>
      <h3 className="font-serif text-[30px] leading-[1.05] tracking-[-0.02em] m-0">{title}</h3>
      {desc && <p className="text-fg-dim text-sm leading-[1.55]">{desc}</p>}
      {children}
    </article>
  );
}

function Bubble({ children, type }: { children: React.ReactNode; type: 'ia' | 'you' }) {
  return (
    <div
      className={`py-2.5 px-3.5 rounded-xl text-[13px] max-w-[80%] leading-[1.45] ${
        type === 'ia'
          ? 'bg-accent/[0.12] border border-[rgba(99,102,241,0.32)] text-[#dfe0ff] self-start rounded-bl-[4px]'
          : 'bg-white/[0.04] border border-line self-end rounded-br-[4px] text-fg-dim'
      }`}
    >
      {children}
    </div>
  );
}

function Calendar() {
  const days: { d: string; cls?: string; today?: boolean }[] = [
    { d: '18' }, { d: '19', cls: 'r1' }, { d: '20' }, { d: '21', cls: 'r2' },
    { d: '22', cls: 'r1' }, { d: '23' }, { d: '24', cls: 'r2' },
    { d: '25', cls: 'r1', today: true }, { d: '26', cls: 'r2' }, { d: '27', cls: 'r3' },
    { d: '28', cls: 'r2' }, { d: '29', cls: 'r3' }, { d: '30', cls: 'r3' },
    { d: 'J-0', cls: 'exam' },
  ];
  const cls = (c?: string) => {
    switch (c) {
      case 'r1': return 'bg-[rgba(99,102,241,0.22)] border-[rgba(99,102,241,0.4)] text-white';
      case 'r2': return 'bg-[rgba(99,102,241,0.42)] border-[rgba(99,102,241,0.55)] text-white';
      case 'r3': return 'bg-accent-gradient border-transparent text-white';
      case 'exam': return 'bg-gradient-to-br from-pink to-accent-2 border-transparent text-white';
      default: return 'bg-white/[0.03] border-line';
    }
  };
  return (
    <div className="grid grid-cols-7 gap-1 mt-auto">
      {days.map((d, i) => (
        <div
          key={i}
          className={`aspect-square rounded-md border flex items-end justify-start px-[5px] py-1 text-[9px] text-fg-mute font-mono relative ${cls(d.cls)} ${
            d.today ? 'outline outline-1 outline-fg -outline-offset-1' : ''
          }`}
        >
          {d.d}
        </div>
      ))}
    </div>
  );
}

function GapRow({ label, color, pct, width }: { label: string; color: 'red' | 'amber' | 'green'; pct: string; width: string }) {
  const bar = { red: 'bg-[#ef4444]', amber: 'bg-amber', green: 'bg-green' }[color];
  return (
    <div className="flex items-center gap-2.5 text-[13px]">
      <span className="flex-1 text-fg-dim">{label}</span>
      <span className="h-1.5 rounded-sm bg-white/[0.06] w-[120px] overflow-hidden relative">
        <i className={`absolute left-0 top-0 bottom-0 rounded-sm ${bar}`} style={{ width }} />
      </span>
      <span className="font-mono text-fg-mute text-[11px] w-9 text-right">{pct}</span>
    </div>
  );
}

function Source({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-line rounded-[10px] bg-white/[0.02] text-xs text-fg-dim">
      <span className={`w-3 h-3 rounded-[3px] ${color}`} />
      {children}
    </div>
  );
}
