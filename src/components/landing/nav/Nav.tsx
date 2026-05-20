"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "@phosphor-icons/react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Méthode", href: "#methode" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "FAQ", href: "#faq" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createClient().auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) setLoggedIn(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 100,
          background: scrolled ? "rgba(250,250,249,0.72)" : "rgba(250,250,249,0)",
          backdropFilter: scrolled ? "saturate(160%) blur(14px)" : "none",
          WebkitBackdropFilter: scrolled ? "saturate(160%) blur(14px)" : "none",
          borderBottom: `1px solid ${scrolled ? "rgba(0,0,0,0.05)" : "transparent"}`,
          transition: "background .3s ease, border-color .3s ease, backdrop-filter .3s ease",
        }}>
        <div className="container nav-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", height: 68 }}>
          {/* Logo */}
          <a href="/" className="nav-logo" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)" }}>
            <Image src="/studra-logo.png" alt="Studra" width={40} height={40} priority unoptimized />
            <span>Studra</span>
          </a>

          {/* Links desktop */}
          <nav style={{ display: "flex", gap: 28, justifyContent: "center" }} className="nav-links-desktop">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: 450, color: "var(--ink-700)", padding: "6px 2px", transition: "color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-700)")}>
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTAs + burger */}
          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", alignItems: "center" }}>
            {loggedIn ? (
              <a href="/dashboard" className="btn btn-primary nav-cta-desktop" style={{ padding: "10px 16px", fontSize: 14 }}>Accéder à l&apos;app</a>
            ) : (
              <>
                <a href="/login" className="btn btn-ghost nav-cta-desktop" style={{ padding: "10px 14px", fontSize: 14 }}>Se connecter</a>
                <a href="/register" className="btn btn-primary nav-cta-desktop" style={{ padding: "10px 16px", fontSize: 14 }}>Essayer gratuitement</a>
              </>
            )}
            <button
              className="nav-burger"
              aria-label="Menu"
              onClick={() => setOpen(true)}
              style={{ display: "none", appearance: "none", border: 0, background: "transparent", padding: 8, color: "var(--ink)", cursor: "pointer", borderRadius: 8 }}
            >
              <List size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              background: "var(--bg)",
              display: "flex", flexDirection: "column",
              padding: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px", height: 48 }}>
              <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)" }}>
                <Image src="/studra-logo.png" alt="Studra" width={40} height={40} unoptimized />
                <span>Studra</span>
              </a>
              <button onClick={() => setOpen(false)} style={{ appearance: "none", border: 0, background: "transparent", padding: 8, color: "var(--ink)", cursor: "pointer", borderRadius: 8 }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, padding: "48px 8px 0" }}>
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 28 }}
                  style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.025em", color: "var(--ink)", padding: "10px 0", display: "block" }}
                >
                  {l.label}
                </motion.a>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0 24px" }}>
              {loggedIn ? (
                <a href="/dashboard" className="btn btn-primary" style={{ width: "100%", padding: 16, justifyContent: "center" }}>Accéder à l&apos;app</a>
              ) : (
                <>
                  <a href="/login" className="btn btn-outline" style={{ width: "100%", padding: 16, justifyContent: "center" }}>Se connecter</a>
                  <a href="/register" className="btn btn-primary" style={{ width: "100%", padding: 16, justifyContent: "center" }}>Essayer gratuitement</a>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          .nav-links-desktop { display: none !important; }
          .nav-cta-desktop { display: none !important; }
          .nav-burger { display: inline-flex !important; }
          .nav-grid { grid-template-columns: 1fr auto !important; }
        }
      `}</style>
    </>
  );
}
