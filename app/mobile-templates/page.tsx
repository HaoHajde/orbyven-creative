"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import ClientTemplatePreview from "@/components/ClientTemplatePreview";
import MobilePageChrome from "@/components/MobilePageChrome";
import OrbitalSystem from "@/components/OrbitalSystem";
import { clientTemplateList } from "@/lib/client-template-catalog";

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const vars = {
  "--bg": "#000000",
  "--surface": "#0b0b0d",
  "--surface-2": "#121216",
  "--text": "#f5f5f7",
  "--muted": "#a1a1a6",
  "--muted-2": "#74747a",
  "--border": "rgba(255,255,255,0.08)",
  "--border-strong": "rgba(255,255,255,0.15)",
  "--button": "#f5f5f7",
  "--button-text": "#000000",
} as CSSProperties;

export default function MobileTemplatesPage() {
  const [templates, setTemplates] = useState(clientTemplateList);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ordered = shuffle(clientTemplateList);
    setTemplates(ordered);
    setActive(Math.floor(Math.random() * ordered.length));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % templates.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [templates.length]);

  const featured = templates[active] ?? templates[0];

  return (
    <main
      id="mobile-page-root"
      style={vars}
      className="min-h-screen overflow-x-clip bg-[var(--bg)] text-[var(--text)]"
    >
      <MobilePageChrome activePage="templates" />

      <section
        className="mobile-subhero mobile-shell-x relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 78% 18%, rgba(75,70,238,0.11), transparent 28%)",
        }}
      >
        <OrbitalSystem variant="accent" className="left-[72%] top-[52%]" />
        <div className="mx-auto max-w-[760px]">
          <p className="mobile-hero-kicker text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
            ORBYVEN · CLIENT TEMPLATES
          </p>
          <h1 className="mobile-hero-title mobile-hero-title-size mt-9 font-semibold leading-[0.91] tracking-[-0.065em]">
            Patru direcții.
            <br />
            Patru personalități<span className="text-[#4b46ee]">.</span>
          </h1>
          <p className="mobile-hero-copy mt-7 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            Aceeași fundație ORBYVEN, dar layout, ritm, tipografie și ton diferite pentru fiecare tip de business.
          </p>
        </div>
      </section>

      <section className="mobile-defer border-t border-[var(--border)] mobile-shell-x py-14">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
                Featured · random
              </p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.05em]">
                {featured.title}
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {featured.category}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setActive(
                    (current) =>
                      (current - 1 + templates.length) % templates.length
                  )
                }
                aria-label="Template anterior"
                className="mobile-press flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() =>
                  setActive((current) => (current + 1) % templates.length)
                }
                aria-label="Template următor"
                className="mobile-press flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]"
              >
                →
              </button>
            </div>
          </div>

          <Link
            href={`/templates/${featured.slug}`}
            className="mobile-card block overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-2"
            data-mobile-reveal
          >
            <ClientTemplatePreview template={featured} compact />
            <div className="flex items-center justify-between gap-5 px-3 pb-4 pt-5">
              <div>
                <p className="text-sm font-semibold">Deschide demo-ul complet</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Hero, servicii, proof, proces și CTA proprii.
                </p>
              </div>
              <span className="text-2xl text-[#4b46ee]">↗</span>
            </div>
          </Link>

          <div className="mt-4 flex gap-1.5">
            {templates.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setActive(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === active ? "w-10 bg-white" : "w-5 bg-white/15"
                }`}
                aria-label={`Arată ${item.title}`}
              />
            ))}
          </div>

          <div className="mt-12 space-y-5">
            {templates.map((item) => (
              <Link
                key={item.slug}
                href={`/templates/${item.slug}`}
                className="mobile-card block overflow-hidden rounded-[27px] border border-[var(--border)] bg-[var(--surface)] p-2"
                data-mobile-reveal
              >
                <ClientTemplatePreview template={item} compact />
                <div className="flex items-end justify-between gap-5 px-3 pb-4 pt-5">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                      {item.category}
                    </p>
                    <h3 className="mt-2 text-[28px] font-semibold tracking-[-0.05em]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-xl text-[#4b46ee]">↗</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mobile-defer border-t border-[var(--border)] mobile-shell-x py-14">
        <div className="mx-auto max-w-[760px]">
          <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
            Proiect live
          </p>
          <h2 className="mt-3 text-[34px] font-semibold tracking-[-0.055em]">
            Diana & Florin
          </h2>

          <Link
            href="/demo/nunta/diana-florin"
            className="mobile-card relative mt-6 block min-h-[360px] overflow-hidden rounded-[28px] border border-[var(--border)]"
            data-mobile-reveal
          >
            <Image
              src="/demo/nunta/diana-florin/couple1.jpeg"
              alt="Preview proiect Diana și Florin"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-white/55">
                  Wedding · Interactive
                </p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Un proiect complet, nu doar un concept vizual.
                </p>
              </div>
              <span className="text-2xl">↗</span>
            </div>
          </Link>
        </div>
      </section>

      <footer className="mobile-defer px-[clamp(12px,4vw,16px)] pt-5">
        <div
          className="rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]"
          data-mobile-reveal
        >
          <p className="text-[9px] uppercase tracking-[0.18em] opacity-40">
            Custom by default
          </p>
          <h2 className="mt-7 text-[43px] font-semibold leading-[0.93] tracking-[-0.06em]">
            Îți place direcția?
            <br />O facem a ta.
          </h2>
          <Link
            href="/contact"
            className="mobile-press mt-9 flex h-14 items-center justify-between rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]"
          >
            <span>Începe un proiect</span>
            <span className="text-[#4b46ee]">↗</span>
          </Link>
        </div>
      </footer>
    </main>
  );
}
