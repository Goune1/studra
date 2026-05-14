'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '#formats', label: 'Formats' },
  { href: '#features', label: 'Fonctionnalités' },
  { href: '#how', label: 'Comment ça marche' },
  { href: '#pricing', label: 'Tarifs' },
  { href: '#faq', label: 'FAQ' },
];

export function NavClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 backdrop-blur-[14px] bg-[rgba(7,7,11,0.72)] border-b border-line">
      <nav className="max-w-[1240px] mx-auto flex items-center justify-between px-7 py-3.5 gap-6">
        {/* Logo */}
        <Link
          href="#top"
          className="flex items-center gap-2.5 text-[18px] tracking-[-0.02em] font-semibold"
          onClick={() => setOpen(false)}
        >
          <Image src="/logo.png" alt="Studra" width={36} height={36} />
          <span>Studra</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex gap-7 text-fg-dim text-sm">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-fg transition-colors">
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex gap-2.5 items-center">
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn btn-primary">
              Accéder à l&apos;application <span className="arrow">→</span>
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Se connecter</Link>
              <Link href="/register" className="btn btn-primary">
                Commencer <span className="arrow">→</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-lg hover:bg-white/[0.06] transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          <span className={`block w-5 h-px bg-fg transition-all duration-200 ${open ? 'rotate-45 translate-y-[6px]' : ''}`} />
          <span className={`block w-5 h-px bg-fg transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-px bg-fg transition-all duration-200 ${open ? '-rotate-45 -translate-y-[6px]' : ''}`} />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[400px] border-t border-line' : 'max-h-0'
        }`}
      >
        <div className="px-7 py-5 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-fg-dim text-[15px] py-2.5 hover:text-fg transition-colors border-b border-line last:border-0"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="flex flex-col gap-2.5 pt-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn btn-primary justify-center" onClick={() => setOpen(false)}>
                Accéder à l&apos;application <span className="arrow">→</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-outline justify-center" onClick={() => setOpen(false)}>
                  Se connecter
                </Link>
                <Link href="/register" className="btn btn-primary justify-center" onClick={() => setOpen(false)}>
                  Commencer gratuitement <span className="arrow">→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
