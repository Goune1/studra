import Link from 'next/link';

export function CTA() {
  return (
    <section className="pb-10">
      <div className="cta-bg relative mx-7 py-25 px-10 text-center rounded-[32px] border border-line-2 overflow-hidden">
        <div className="relative">
          <span className="font-mono text-xs text-accent uppercase tracking-[0.18em]">Prêt ?</span>
          <h2 className="font-serif text-[clamp(40px,6vw,76px)] tracking-[-0.03em] leading-none my-5">
            Fais passer tes révisions <em className="italic text-accent-gradient-2">au niveau au-dessus.</em>
          </h2>
          <p className="text-fg-dim text-[17px] max-w-[52ch] mx-auto mb-8">
            Cinq générations offertes. Aucune carte bancaire. Dix secondes pour créer ton compte.
          </p>
          <div className="flex gap-3 justify-center items-center flex-wrap">
            <Link href="/register" className="btn btn-primary btn-lg">
              Commencer gratuitement <span className="arrow">→</span>
            </Link>
            <Link href="#pricing" className="btn btn-outline btn-lg">Voir les tarifs</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
