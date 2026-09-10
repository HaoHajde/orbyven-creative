"use client";

import Link from "next/link";
import { Bodoni_Moda, DM_Sans } from "next/font/google";
import { useState, type FormEvent } from "react";

const uiFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-wedding-ui",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const editorialFont = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-wedding-editorial",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const details = [
  {
    number: "01",
    eyebrow: "Ceremonie",
    title: "Locația ceremoniei",
    time: "ORA",
    description: "Biserică / locație civilă · Adresa evenimentului",
  },
  {
    number: "02",
    eyebrow: "Petrecere",
    title: "Locația petrecerii",
    time: "ORA",
    description: "Restaurant / salon · Adresa evenimentului",
  },
];

const countdown = [
  ["00", "Zile"],
  ["00", "Ore"],
  ["00", "Minute"],
  ["00", "Secunde"],
];

function GoldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-px w-8 bg-[#a87d34]/45" />
      <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8b6528]">{children}</span>
      <span className="h-px w-8 bg-[#a87d34]/45" />
    </div>
  );
}

export default function WeddingTemplateDemo() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main
      className={`${uiFont.variable} ${editorialFont.variable} relative min-h-screen overflow-x-hidden bg-[#f4eee4] text-[#1c1814]`}
      style={{ fontFamily: "var(--font-wedding-ui)" }}
    >
      <Link
        href="/templates"
        className="fixed bottom-5 left-5 z-[80] inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/88 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_14px_40px_rgba(0,0,0,.18)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-black"
      >
        <span aria-hidden="true">←</span>
        Înapoi la templates
      </Link>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(255,255,255,.95),transparent_30%),radial-gradient(circle_at_86%_24%,rgba(201,160,80,.19),transparent_31%),radial-gradient(circle_at_35%_82%,rgba(255,255,255,.78),transparent_34%),linear-gradient(135deg,#f7f1e7,#eadfce)]" />
        <div className="absolute -left-24 top-[22%] h-[340px] w-[340px] rounded-full border border-[#a77b32]/15" />
        <div className="absolute -right-28 top-[54%] h-[440px] w-[440px] rounded-full border border-[#a77b32]/10" />
        <div className="absolute left-[18%] top-[44%] h-44 w-44 rounded-full bg-white/50 blur-[70px]" />
      </div>

      <nav className="fixed left-1/2 top-3 z-50 w-[calc(100%-18px)] max-w-[980px] -translate-x-1/2 sm:top-4 sm:w-[calc(100%-32px)]">
        <div className="flex h-[62px] items-center rounded-[24px] border border-white/75 bg-white/60 px-3 shadow-[0_16px_50px_rgba(80,59,25,.10)] backdrop-blur-[30px] sm:px-5">
          <a href="#acasa" className="hidden min-w-[110px] items-center gap-2 sm:flex">
            <span className="font-[family-name:var(--font-wedding-editorial)] text-[27px] font-semibold tracking-[-0.06em]">M</span>
            <span className="font-[family-name:var(--font-wedding-editorial)] text-[18px] italic text-[#a77b32]">&amp;</span>
            <span className="font-[family-name:var(--font-wedding-editorial)] text-[27px] font-semibold tracking-[-0.06em]">M</span>
          </a>

          <div className="mx-auto flex items-center gap-0.5 text-[9px] font-bold text-[#645d54] sm:text-[10px] md:text-[11px]">
            {[
              ["Acasă", "#acasa"],
              ["Noi", "#noi"],
              ["Nași", "#nasi"],
              ["Detalii", "#detalii"],
              ["RSVP", "#rsvp"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="rounded-full px-2.5 py-2.5 transition hover:bg-white/80 hover:text-[#191612] md:px-3.5">
                {label}
              </a>
            ))}
          </div>

          <div className="hidden min-w-[110px] justify-end sm:flex">
            <span className="rounded-full border border-[#a77b32]/15 bg-[#a77b32]/8 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#825f27]">
              DD.MM.YYYY
            </span>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        <section id="acasa" className="flex min-h-screen scroll-mt-24 items-center px-4 pb-14 pt-24 sm:px-6">
          <div className="mx-auto w-full max-w-[1240px]">
            <div className="relative overflow-hidden rounded-[38px] border border-white/75 bg-white/26 shadow-[0_36px_100px_rgba(69,49,20,.15)] backdrop-blur-[20px] md:rounded-[54px]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/45 via-white/10 to-[#cba65e]/8" />
              <div className="pointer-events-none absolute -right-20 -top-28 h-96 w-96 rounded-full border border-[#a77b32]/15" />
              <div className="pointer-events-none absolute -bottom-28 left-[38%] h-80 w-80 rounded-full border border-[#a77b32]/10" />

              <div className="relative flex min-h-[78vh] items-center justify-center px-7 py-16 text-center sm:px-10 md:px-16">
                <div className="max-w-4xl">
                  <GoldLabel>Template invitație de nuntă</GoldLabel>
                  <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#756b5e]">
                    Cu bucurie vă invităm alături de noi
                  </p>
                  <h1 className="mt-6 font-[family-name:var(--font-wedding-editorial)] text-[clamp(64px,12vw,150px)] font-medium leading-[0.72] tracking-[-0.08em]">
                    Mire
                    <span className="mx-3 inline-block bg-gradient-to-r from-[#8b6427] via-[#d1ad58] to-[#906a2e] bg-clip-text font-normal italic text-transparent">&amp;</span>
                    Mireasă
                  </h1>
                  <p className="mx-auto mt-9 max-w-xl text-[15px] leading-7 text-[#6c6358] md:text-[17px]">
                    Un layout editorial pregătit pentru personalizare. Numele, data, locațiile și mesajele se înlocuiesc pentru fiecare eveniment.
                  </p>

                  <div className="mx-auto mt-10 inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-[#9e7735]/15 bg-white/48 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6e604e] backdrop-blur-xl">
                    <span>ZI</span><span className="text-[#ad843d]">·</span><span>LUNĂ</span><span className="text-[#ad843d]">·</span><span>AN</span>
                  </div>

                  <div className="mt-10">
                    <a href="#noi" className="inline-flex h-12 items-center justify-center rounded-full bg-[#1f1a15] px-7 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                      Descoperă invitația ↓
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="noi" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <GoldLabel>Protagoniștii</GoldLabel>
              <h2 className="mt-6 font-[family-name:var(--font-wedding-editorial)] text-[clamp(50px,7vw,84px)] font-medium leading-[0.9] tracking-[-0.06em]">
                Mire <span className="italic text-[#a77b32]">&amp;</span> Mireasă
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#70685e]">Fără fotografii reale în template. Zona poate primi ulterior imagini, ilustrații sau poate rămâne complet tipografică.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {["Mire", "Mireasă"].map((role, index) => (
                <article key={role} className="relative min-h-[430px] overflow-hidden rounded-[34px] border border-white/75 bg-white/40 p-7 shadow-[0_24px_70px_rgba(76,54,22,.10)] backdrop-blur-xl md:p-9">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(190,151,74,.16),transparent_30%),linear-gradient(145deg,rgba(255,255,255,.34),rgba(255,255,255,.05))]" />
                  <div className="pointer-events-none absolute -right-16 -top-10 font-[family-name:var(--font-wedding-editorial)] text-[220px] font-semibold leading-none text-[#a77b32]/[0.055]">
                    {index === 0 ? "M" : "R"}
                  </div>
                  <div className="relative flex h-full min-h-[365px] flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d806f]">0{index + 1}</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9d7431]">Rol</p>
                      <h3 className="mt-4 font-[family-name:var(--font-wedding-editorial)] text-[64px] font-medium leading-none tracking-[-0.06em]">{role}</h3>
                      <p className="mt-5 max-w-sm text-sm leading-7 text-[#6e665c]">Spațiu pentru o scurtă poveste, un mesaj personal sau câteva rânduri despre fiecare dintre cei doi.</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="nasi" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px] rounded-[38px] border border-white/75 bg-[#211b17] px-6 py-14 text-white shadow-[0_28px_90px_rgba(50,35,18,.18)] sm:px-9 md:px-14 md:py-20">
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d2aa5a]">Alături de noi</p>
                <h2 className="mt-5 font-[family-name:var(--font-wedding-editorial)] text-[clamp(52px,7vw,86px)] font-medium leading-[0.88] tracking-[-0.065em]">
                  Nașă <span className="italic text-[#d4ad5c]">&amp;</span><br />Naș
                </h2>
              </div>
              <p className="max-w-2xl text-[15px] leading-8 text-white/55 md:text-[17px]">
                Secțiune dedicată nașilor. În varianta finală se pot introduce numele, un mesaj, o fotografie sau doar o compoziție tipografică elegantă.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px] text-center">
            <GoldLabel>Până la eveniment</GoldLabel>
            <h2 className="mt-6 font-[family-name:var(--font-wedding-editorial)] text-[clamp(48px,7vw,82px)] font-medium tracking-[-0.06em]">Countdown personalizabil</h2>
            <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
              {countdown.map(([value, label]) => (
                <div key={label} className="rounded-[28px] border border-white/75 bg-white/42 px-4 py-8 shadow-[0_18px_55px_rgba(70,50,24,.08)] backdrop-blur-xl">
                  <div className="font-[family-name:var(--font-wedding-editorial)] text-[54px] font-medium tracking-[-0.07em] md:text-[68px]">{value}</div>
                  <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.22em] text-[#85796c]">{label}</div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-[#877e72]">Valorile se conectează automat la data evenimentului în proiectul final.</p>
          </div>
        </section>

        <section id="detalii" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <GoldLabel>Program & locații</GoldLabel>
              <h2 className="mt-6 font-[family-name:var(--font-wedding-editorial)] text-[clamp(50px,7vw,84px)] font-medium leading-[0.9] tracking-[-0.06em]">Unde ne vedem</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {details.map((item) => (
                <article key={item.number} className="relative overflow-hidden rounded-[32px] border border-white/75 bg-white/40 p-7 shadow-[0_20px_60px_rgba(70,50,24,.09)] backdrop-blur-xl md:p-9">
                  <div className="absolute right-6 top-6 text-[10px] font-semibold text-[#9a8e7f]">{item.number}</div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#936c2d]">{item.eyebrow}</p>
                  <h3 className="mt-7 font-[family-name:var(--font-wedding-editorial)] text-[42px] font-medium leading-[0.95] tracking-[-0.05em]">{item.title}</h3>
                  <div className="mt-10 flex items-end justify-between gap-5 border-t border-black/8 pt-6">
                    <p className="max-w-xs text-sm leading-6 text-[#6f675d]">{item.description}</p>
                    <span className="font-[family-name:var(--font-wedding-editorial)] text-[30px] italic text-[#9c7535]">{item.time}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="rsvp" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto grid max-w-[1180px] gap-8 rounded-[38px] border border-white/75 bg-white/42 p-6 shadow-[0_26px_80px_rgba(70,50,24,.11)] backdrop-blur-xl md:grid-cols-[.8fr_1.2fr] md:p-10 lg:p-14">
            <div>
              <GoldLabel>Confirmare</GoldLabel>
              <h2 className="mt-6 font-[family-name:var(--font-wedding-editorial)] text-[clamp(48px,6vw,76px)] font-medium leading-[0.9] tracking-[-0.06em]">RSVP demo</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-[#6d655b]">Formular demonstrativ. Nu trimite date într-o bază reală; în proiectul final se conectează la workspace-ul clientului.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Numele invitatului" className="w-full rounded-2xl border border-black/8 bg-white/65 px-4 py-4 text-sm outline-none focus:border-[#a77b32]/50" />
              <div className="grid gap-4 sm:grid-cols-2">
                <select className="rounded-2xl border border-black/8 bg-white/65 px-4 py-4 text-sm outline-none focus:border-[#a77b32]/50" defaultValue="Particip">
                  <option>Particip</option>
                  <option>Nu particip</option>
                </select>
                <select className="rounded-2xl border border-black/8 bg-white/65 px-4 py-4 text-sm outline-none focus:border-[#a77b32]/50" defaultValue="1 persoană">
                  <option>1 persoană</option>
                  <option>2 persoane</option>
                  <option>3 persoane</option>
                  <option>4 persoane</option>
                </select>
              </div>
              <textarea placeholder="Mesaj pentru miri" className="min-h-32 w-full resize-y rounded-2xl border border-black/8 bg-white/65 px-4 py-4 text-sm outline-none focus:border-[#a77b32]/50" />
              <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#211b17] px-7 text-sm font-semibold text-white transition hover:-translate-y-0.5 sm:w-auto">
                Confirmă prezența
              </button>
              {submitted && <p className="rounded-2xl border border-[#9b7331]/15 bg-[#9b7331]/8 px-4 py-3 text-sm text-[#67553d]">Demo: confirmarea a fost simulată cu succes.</p>}
            </form>
          </div>
        </section>

        <section className="px-5 pb-28 pt-16 text-center sm:px-6 md:pb-36">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8d7f6e]">Template ORBYVEN</p>
          <div className="mt-7 font-[family-name:var(--font-wedding-editorial)] text-[clamp(58px,9vw,118px)] font-medium leading-[0.8] tracking-[-0.075em]">
            Mire <span className="italic text-[#aa8039]">&amp;</span> Mireasă
          </div>
          <p className="mx-auto mt-7 max-w-xl text-sm leading-7 text-[#756d62]">Tot conținutul este demonstrativ și poate fi înlocuit fără a modifica structura template-ului.</p>
        </section>
      </div>
    </main>
  );
}
