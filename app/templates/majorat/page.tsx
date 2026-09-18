"use client";

import Link from "next/link";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const uiFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-majorat-ui",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-majorat-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const EVENT_DATE = new Date("2027-09-12T21:00:00+03:00").getTime();

const plan = [
  {
    number: "01",
    time: "21:00",
    title: "Doors open",
    text: "Ajungi, intri, îți iei primul drink și începe seara.",
  },
  {
    number: "02",
    time: "22:30",
    title: "Main moment",
    text: "Tort, toast, fotografii și momentul oficial de 18.",
  },
  {
    number: "03",
    time: "23:00 → late",
    title: "Party mode",
    text: "DJ, dans, lumină joasă și fără program complicat.",
  },
];

const gallery = [
  {
    title: "Flash",
    subtitle: "momente rapide",
    className: "bg-[radial-gradient(circle_at_65%_25%,rgba(151,112,255,.62),transparent_25%),linear-gradient(145deg,#181122,#07060a)]",
  },
  {
    title: "After dark",
    subtitle: "city lights",
    className: "bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,.18),transparent_22%),linear-gradient(145deg,#101018,#251b36)]",
  },
  {
    title: "Chapter 18",
    subtitle: "the memory",
    className: "bg-[radial-gradient(circle_at_72%_24%,rgba(181,76,255,.42),transparent_27%),linear-gradient(145deg,#09070d,#17111f)]",
  },
];

function calculateCountdown() {
  const distance = Math.max(EVENT_DATE - Date.now(), 0);
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance / 3600000) % 24),
    minutes: Math.floor((distance / 60000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-px w-8 bg-violet-300/45" />
      <span className="text-[9px] font-bold uppercase tracking-[.28em] text-violet-200/72">{children}</span>
    </div>
  );
}

export default function MajoratTemplate() {
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(calculateCountdown());

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(calculateCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const countdownItems = useMemo(
    () => [
      [String(countdown.days), "Zile"],
      [String(countdown.hours).padStart(2, "0"), "Ore"],
      [String(countdown.minutes).padStart(2, "0"), "Minute"],
      [String(countdown.seconds).padStart(2, "0"), "Secunde"],
    ],
    [countdown],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main
      className={uiFont.variable + " " + displayFont.variable + " relative min-h-screen overflow-x-hidden bg-[#050507] text-white"}
      style={{ fontFamily: "var(--font-majorat-ui)" }}
    >
      <Link
        href="/templates"
        className="fixed bottom-5 left-5 z-[100] inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/75 px-4 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-white shadow-[0_16px_50px_rgba(0,0,0,.32)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-black"
      >
        ← Templates
      </Link>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_16%,rgba(111,67,255,.24),transparent_27%),radial-gradient(circle_at_22%_68%,rgba(174,72,255,.13),transparent_31%),linear-gradient(145deg,#09070e,#030304_70%)]" />
        <div className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute -right-40 top-[18%] h-[520px] w-[520px] rounded-full border border-white/[.035]" />
        <div className="absolute -left-32 top-[62%] h-[380px] w-[380px] rounded-full border border-violet-300/[.055]" />
      </div>

      <nav className="fixed left-1/2 top-3 z-50 w-[calc(100%-18px)] max-w-[1080px] -translate-x-1/2 sm:top-4 sm:w-[calc(100%-32px)]">
        <div className="flex h-[62px] items-center rounded-[23px] border border-white/10 bg-black/45 px-3 shadow-[0_18px_60px_rgba(0,0,0,.28)] backdrop-blur-[28px] sm:px-5">
          <a href="#start" className="hidden min-w-[145px] sm:block">
            <p className="font-[family-name:var(--font-majorat-display)] text-[13px] font-bold tracking-[-.03em]">ALEX / 18</p>
            <p className="mt-1 text-[6px] font-bold uppercase tracking-[.20em] text-violet-300/55">midnight edition</p>
          </a>

          <div className="mx-auto flex items-center gap-0.5 text-[9px] font-bold text-white/52 sm:text-[10px]">
            {[
              ["Start", "#start"],
              ["18", "#chapter"],
              ["Plan", "#plan"],
              ["Dress", "#dress"],
              ["Galerie", "#galerie"],
              ["RSVP", "#rsvp"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="rounded-full px-2 py-2.5 transition hover:bg-white/8 hover:text-white md:px-3">
                {label}
              </a>
            ))}
          </div>

          <a href="#rsvp" className="hidden min-w-[145px] justify-end sm:flex">
            <span className="rounded-full bg-white px-4 py-2 text-[9px] font-bold text-black transition hover:bg-violet-100">
              Confirmă
            </span>
          </a>
        </div>
      </nav>

      <div className="relative z-10">
        <section id="start" className="flex min-h-screen scroll-mt-24 items-center px-4 pb-12 pt-24 sm:px-6">
          <div className="mx-auto w-full max-w-[1320px]">
            <div className="relative overflow-hidden rounded-[38px] border border-white/10 bg-white/[.025] shadow-[0_40px_120px_rgba(0,0,0,.34)] backdrop-blur-[20px] md:rounded-[54px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(115,76,255,.22),transparent_25%),linear-gradient(135deg,rgba(255,255,255,.03),transparent_55%)]" />
              <div className="absolute right-[-3%] top-[-12%] font-[family-name:var(--font-majorat-display)] text-[clamp(220px,32vw,520px)] font-bold leading-none tracking-[-.14em] text-white/[.025]">
                18
              </div>

              <div className="relative grid min-h-[82vh] items-end gap-10 px-7 py-14 md:grid-cols-[1.1fr_.9fr] md:px-14 lg:px-20">
                <div className="pb-4 md:pb-8">
                  <Label>12 Septembrie 2027 · București</Label>
                  <p className="mt-7 text-[10px] font-bold uppercase tracking-[.24em] text-white/36">
                    Chapter 18 starts here
                  </p>
                  <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-majorat-display)] text-[clamp(64px,10vw,142px)] font-bold leading-[.76] tracking-[-.085em]">
                    One night.
                    <br />
                    <span className="bg-gradient-to-r from-white via-violet-200 to-violet-500 bg-clip-text text-transparent">
                      Eighteen forever.
                    </span>
                  </h1>
                  <p className="mt-7 max-w-xl text-[15px] leading-7 text-white/48 md:text-[17px]">
                    Fără invitație încărcată. Doar locul, ora, vibe-ul și oamenii care trebuie să fie acolo.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-2">
                    {[
                      ["21:00", "Start"],
                      ["Skyline Hall", "Locație"],
                      ["Black / silver", "Dress code"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-[18px] border border-white/10 bg-white/[.045] px-4 py-3 backdrop-blur-xl">
                        <p className="text-[7px] font-bold uppercase tracking-[.18em] text-violet-200/55">{label}</p>
                        <p className="mt-1 text-[11px] font-bold text-white/82">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <a href="#rsvp" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-bold text-black transition hover:-translate-y-0.5 hover:bg-violet-100">
                      Confirmă prezența →
                    </a>
                    <a href="#plan" className="inline-flex h-12 items-center justify-center rounded-full border border-white/12 bg-white/[.035] px-7 text-sm font-semibold text-white/72 transition hover:bg-white/[.07] hover:text-white">
                      Vezi planul
                    </a>
                  </div>
                </div>

                <div className="relative flex min-h-[420px] items-center justify-center md:min-h-[560px]">
                  <div className="absolute h-[390px] w-[390px] rounded-full border border-violet-300/12 bg-violet-500/[.055] shadow-[0_0_100px_rgba(112,75,255,.12)] md:h-[470px] md:w-[470px]" />
                  <div className="absolute h-[305px] w-[305px] rounded-full border border-white/[.075] md:h-[360px] md:w-[360px]" />
                  <div className="relative text-center">
                    <p className="text-[9px] font-black uppercase tracking-[.34em] text-white/32">welcome to</p>
                    <div className="mt-5 font-[family-name:var(--font-majorat-display)] text-[clamp(150px,20vw,260px)] font-bold leading-[.64] tracking-[-.13em] text-white">
                      18
                    </div>
                    <p className="mt-7 text-[10px] font-bold uppercase tracking-[.30em] text-violet-300">ALEX · STARTS NOW</p>
                  </div>
                  <span className="absolute right-[8%] top-[14%] text-[24px] text-violet-200/85">✦</span>
                  <span className="absolute bottom-[12%] left-[12%] text-[12px] text-white/32">✦</span>
                  <span className="absolute left-[2%] top-[35%] rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[7px] font-bold uppercase tracking-[.16em] text-white/50 backdrop-blur-xl">no ordinary night</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="chapter" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid gap-6 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
              <div>
                <Label>Chapter 18</Label>
                <h2 className="mt-6 font-[family-name:var(--font-majorat-display)] text-[clamp(58px,8vw,104px)] font-bold leading-[.82] tracking-[-.075em]">
                  Nu e doar
                  <br />
                  <span className="text-white/28">o aniversare.</span>
                </h2>
              </div>

              <div className="rounded-[34px] border border-white/9 bg-white/[.035] p-7 md:p-10">
                <p className="max-w-2xl text-[17px] leading-8 text-white/58 md:text-[20px]">
                  18 ani înseamnă începutul unui capitol nou. Template-ul păstrează povestea scurtă și lasă atmosfera să vorbească.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    ["18", "ani"],
                    ["01", "noapte"],
                    ["∞", "amintiri"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-[22px] border border-white/8 bg-black/22 p-5">
                      <p className="font-[family-name:var(--font-majorat-display)] text-[38px] font-bold tracking-[-.06em]">{value}</p>
                      <p className="mt-1 text-[8px] font-bold uppercase tracking-[.18em] text-white/34">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="countdown" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1200px] text-center">
            <Label>Countdown</Label>
            <h2 className="mt-6 font-[family-name:var(--font-majorat-display)] text-[clamp(50px,7vw,86px)] font-bold tracking-[-.065em]">
              Timpul curge.
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {countdownItems.map(([value, label]) => (
                <div key={label} className="rounded-[28px] border border-white/9 bg-white/[.035] px-4 py-8 shadow-[0_18px_60px_rgba(0,0,0,.20)] backdrop-blur-xl">
                  <div className="font-[family-name:var(--font-majorat-display)] text-[54px] font-bold tracking-[-.075em] md:text-[72px]">{value}</div>
                  <div className="mt-2 text-[9px] font-bold uppercase tracking-[.22em] text-violet-200/55">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="plan" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-11 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <Label>Party plan</Label>
                <h2 className="mt-6 font-[family-name:var(--font-majorat-display)] text-[clamp(52px,7vw,88px)] font-bold leading-[.86] tracking-[-.07em]">
                  Simplu.
                  <br />
                  <span className="text-white/28">Știi unde trebuie să fii.</span>
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-7 text-white/42">
                Fără program kilometric. Doar momentele care contează.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {plan.map((item) => (
                <article key={item.number} className="group min-h-[310px] rounded-[30px] border border-white/9 bg-white/[.035] p-7 transition duration-300 hover:-translate-y-1 hover:bg-white/[.055]">
                  <div className="flex items-start justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-[.22em] text-violet-300/62">{item.number}</span>
                    <span className="font-[family-name:var(--font-majorat-display)] text-[22px] font-semibold text-white/38">{item.time}</span>
                  </div>
                  <div className="mt-20">
                    <h3 className="font-[family-name:var(--font-majorat-display)] text-[34px] font-bold tracking-[-.055em]">{item.title}</h3>
                    <p className="mt-4 max-w-sm text-sm leading-7 text-white/42">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="dress" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto grid max-w-[1200px] overflow-hidden rounded-[38px] border border-white/10 bg-white/[.035] md:grid-cols-[.9fr_1.1fr]">
            <div className="relative min-h-[420px] overflow-hidden p-8 md:min-h-[520px] md:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_25%,rgba(125,86,255,.26),transparent_30%),linear-gradient(145deg,#0a0910,#16101f)]" />
              <div className="absolute -right-12 -bottom-12 font-[family-name:var(--font-majorat-display)] text-[210px] font-bold leading-none tracking-[-.14em] text-white/[.025]">18</div>
              <div className="relative flex h-full min-h-[350px] flex-col justify-between">
                <Label>Dress code</Label>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.24em] text-white/30">recommended</p>
                  <h3 className="mt-3 font-[family-name:var(--font-majorat-display)] text-[clamp(48px,6vw,82px)] font-bold leading-[.85] tracking-[-.07em]">
                    Black.
                    <br />
                    Silver.
                    <br />
                    <span className="text-violet-300">One accent.</span>
                  </h3>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 md:p-12">
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-violet-300/62">Ideea</p>
              <h3 className="mt-5 font-[family-name:var(--font-majorat-display)] text-[42px] font-bold leading-[.95] tracking-[-.06em]">
                Elegant, dar nu rigid.
              </h3>
              <p className="mt-6 max-w-xl text-[15px] leading-8 text-white/48">
                Dress code-ul este orientativ: negru, gri, argintiu sau un singur accent violet. Fotografii coerente, atmosferă premium, fără să transformăm petrecerea într-un protocol.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {["black", "silver", "graphite", "violet accent"].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-black/20 px-4 py-2.5 text-[9px] font-bold uppercase tracking-[.15em] text-white/54">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="galerie" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1200px]">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <Label>Galerie</Label>
                <h2 className="mt-6 font-[family-name:var(--font-majorat-display)] text-[clamp(52px,7vw,88px)] font-bold leading-[.86] tracking-[-.07em]">
                  Flash.
                  <br />
                  <span className="text-white/28">No filters needed.</span>
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-7 text-white/42">
                În varianta finală, aici intră fotografiile sărbătoritului și momentele preferate.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {gallery.map((item, index) => (
                <article key={item.title} className={"relative aspect-[4/5] overflow-hidden rounded-[32px] border border-white/9 " + item.className}>
                  <div className="absolute inset-0 opacity-[.11] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]" />
                  <div className="absolute left-6 top-6 text-[9px] font-bold uppercase tracking-[.22em] text-white/30">0{index + 1}</div>
                  <div className="absolute bottom-6 left-6 right-6 rounded-[22px] border border-white/9 bg-black/28 p-5 backdrop-blur-xl">
                    <h3 className="font-[family-name:var(--font-majorat-display)] text-[30px] font-bold tracking-[-.05em]">{item.title}</h3>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[.18em] text-violet-200/52">{item.subtitle}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="rsvp" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto grid max-w-[1200px] gap-10 rounded-[38px] border border-white/10 bg-white/[.04] p-7 shadow-[0_30px_90px_rgba(0,0,0,.24)] backdrop-blur-xl md:grid-cols-[.85fr_1.15fr] md:p-12">
            <div>
              <Label>RSVP</Label>
              <h2 className="mt-6 font-[family-name:var(--font-majorat-display)] text-[clamp(52px,6vw,82px)] font-bold leading-[.84] tracking-[-.07em]">
                Are you in?
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/46">
                Confirmare simplă, fără cont și fără formulare inutile. În proiectul clientului poate fi conectată la Supabase.
              </p>
              <p className="mt-8 text-[10px] font-bold uppercase tracking-[.2em] text-violet-300/62">
                RSVP până la 01.09.2027
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Nume și prenume" className="w-full rounded-2xl border border-white/10 bg-black/22 px-4 py-4 text-sm text-white outline-none placeholder:text-white/24 focus:border-violet-300/35" />
              <div className="grid gap-4 sm:grid-cols-2">
                <select className="rounded-2xl border border-white/10 bg-[#0c0a10] px-4 py-4 text-sm text-white outline-none focus:border-violet-300/35" defaultValue="Particip">
                  <option>Particip</option>
                  <option>Nu particip</option>
                </select>
                <select className="rounded-2xl border border-white/10 bg-[#0c0a10] px-4 py-4 text-sm text-white outline-none focus:border-violet-300/35" defaultValue="1 persoană">
                  <option>1 persoană</option>
                  <option>2 persoane</option>
                </select>
              </div>
              <textarea placeholder="Mesaj pentru Alex (opțional)" className="min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-black/22 px-4 py-4 text-sm text-white outline-none placeholder:text-white/24 focus:border-violet-300/35" />
              <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-7 text-sm font-bold text-black transition hover:-translate-y-0.5 hover:bg-violet-100 sm:w-auto">
                Confirmă prezența →
              </button>
              {submitted && (
                <p className="rounded-2xl border border-violet-300/15 bg-violet-400/8 px-4 py-3 text-sm text-violet-100/82">
                  Demo: răspunsul a fost înregistrat.
                </p>
              )}
            </form>
          </div>
        </section>

        <section id="locatie" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-10 text-center">
              <Label>Locație</Label>
              <h2 className="mt-6 font-[family-name:var(--font-majorat-display)] text-[clamp(50px,7vw,86px)] font-bold tracking-[-.065em]">
                Skyline Hall · București
              </h2>
            </div>

            <div className="grid overflow-hidden rounded-[36px] border border-white/10 bg-white/[.035] md:grid-cols-[1.2fr_.8fr]">
              <iframe
                title="Hartă demo București"
                src="https://www.google.com/maps?q=Bucuresti%2C%20Romania&output=embed"
                className="min-h-[380px] w-full border-0 opacity-80 grayscale"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="flex flex-col justify-center p-8 md:p-10">
                <p className="text-[9px] font-bold uppercase tracking-[.22em] text-violet-300/58">12 Septembrie 2027</p>
                <h3 className="mt-4 font-[family-name:var(--font-majorat-display)] text-[42px] font-bold leading-[.94] tracking-[-.06em]">Skyline Hall</h3>
                <p className="mt-5 text-sm leading-7 text-white/44">Bd. Exemplu nr. 18 · București</p>
                <div className="my-7 h-px bg-white/8" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                    <p className="text-[7px] font-bold uppercase tracking-[.18em] text-white/30">Doors</p>
                    <p className="mt-1 text-[17px] font-semibold">21:00</p>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                    <p className="text-[7px] font-bold uppercase tracking-[.18em] text-white/30">Parking</p>
                    <p className="mt-1 text-[17px] font-semibold">Disponibil</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="px-5 pb-28 pt-12 text-center sm:px-6 md:pb-36">
          <div className="mx-auto max-w-[1120px] overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(122,80,255,.19),transparent_34%),rgba(255,255,255,.025)] px-7 py-16 md:px-12 md:py-20">
            <p className="text-[9px] font-bold uppercase tracking-[.28em] text-violet-300/58">save the night</p>
            <h2 className="mt-5 font-[family-name:var(--font-majorat-display)] text-[clamp(60px,9vw,118px)] font-bold leading-[.74] tracking-[-.085em]">
              See you at
              <br />
              <span className="bg-gradient-to-r from-white via-violet-200 to-violet-500 bg-clip-text text-transparent">chapter 18.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-white/42">Alex · 12 Septembrie 2027 · București</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
