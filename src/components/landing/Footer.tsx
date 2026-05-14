import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="pt-20 px-7 pb-10 border-t border-line mt-30">
      <div className="max-w-[1240px] mx-auto grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10">
        <div>
          <Link href="#top" className="flex items-center gap-2.5 text-[18px] tracking-[-0.02em] font-semibold mb-3.5">
            <Image src="/logo.png" alt="Studra" width={36} height={36} />
            <span>Studra</span>
          </Link>
          <p className="text-fg-mute text-[13px] leading-[1.5] max-w-[30ch]">
            Plateforme de révision propulsée par l&apos;IA.
          </p>
        </div>

        <FooterCol title="Produit" links={[['Formats', '#formats'], ['Fonctionnalités', '#features'], ['Tarifs', '#pricing'], ['Changelog', '/changelog'] ]} />
        <FooterCol title="Fonctionnalités" links={[
          ['Flashcards IA', '/flashcards-ia'],
          ['Fiches de révision IA', '/fiches-de-revision-ia'],
          ['Répétition espacée', '/repetition-espacee'],
          ['Examens blancs IA', '/examen-blanc-ia'],
          ['Blog', '/blog'],
        ]} />
        <FooterCol title="Légal" links={[['CGU', '/cgu'], ['CGV', '/cgv'], ['Confidentialité', '/confidentialite']]} />
      </div>

      <div className="max-w-[1240px] mx-auto mt-15 pt-7 border-t border-line flex justify-between text-fg-mute text-xs flex-wrap gap-3.5">
        <span>© 2026 Studra</span>
        <span className="font-mono">studra.fr</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h6 className="font-mono text-[11px] tracking-[0.15em] text-fg-mute uppercase mb-4.5 font-medium">{title}</h6>
      <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
        {links.map(([lbl, href]) => (
          <li key={lbl}>
            <Link href={href} className="text-fg-dim text-sm hover:text-fg transition-colors">
              {lbl}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
