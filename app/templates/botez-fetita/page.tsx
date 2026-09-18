"use client";

import Link from "next/link";
import { Bodoni_Moda, DM_Sans } from "next/font/google";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const uiFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-baptism-ui",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const editorialFont = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-baptism-editorial",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const EVENT_DATE = new Date("2027-05-15T12:00:00+03:00").getTime();

const schedule = [
  {
    icon: "✦",
    title: "Biserică",
    time: "12:00",
    place: "Biserica Sf. Nicolae",
    detail: "București",
  },
  {
    icon: "♡",
    title: "Restaurant",
    time: "14:00",
    place: "Grand Ballrooms",
    detail: "București",
  },
  {
    icon: "♪",
    title: "Petrecere",
    time: "16:00",
    place: "Muzică & voie bună",
    detail: "Alături de cei dragi",
  },
];

const gallery = [
  {
    label: "Primul zâmbet",
    className: "bg-[radial-gradient(circle_at_32%_28%,#fff_0%,#fce8e6_36%,#e8b7bd_100%)]",
    mark: "♡",
  },
  {
    label: "Mânuțe mici",
    className: "bg-[radial-gradient(circle_at_65%_30%,#fffaf4_0%,#f6ddd9_40%,#d7a6a9_100%)]",
    mark: "✦",
  },
  {
    label: "Povestea noastră",
    className: "bg-[radial-gradient(circle_at_45%_24%,#fff_0%,#fdeced_40%,#efc7cc_100%)]",
    mark: "A",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-px w-8 bg-[#bd9250]/45" />
      <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#a47735]">{children}</span>
      <span className="h-px w-8 bg-[#bd9250]/45" />
    </div>
  );
}

function calculateCountdown() {
  const distance = Math.max(EVENT_DATE - Date.now(), 0);
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance / 3600000) % 24),
    minutes: Math.floor((distance / 60000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

export default function BaptismGirlTemplate() {
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
      className={uiFont.variable + " " + editorialFont.variable + " relative min-h-screen overflow-x-hidden bg-[#fff9f6] text-[#522831]"}
      style={{ fontFamily: "var(--font-baptism-ui)" }}
    >
      <Link
        href="/templates"
        className="fixed bottom-5 left-5 z-[90] inline-flex items-center gap-2 rounded-full border border-[#5f3038]/10 bg-[#542c34]/92 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_14px_40px_rgba(81,40,49,.20)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-[#432229]"
      >
        <span aria-hidden="true">←</span>
        Înapoi la templates
      </Link>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_11%_9%,rgba(255,255,255,.98),transparent_28%),radial-gradient(circle_at_88%_21%,rgba(231,178,188,.23),transparent_28%),radial-gradient(circle_at_48%_78%,rgba(255,255,255,.86),transparent_30%),linear-gradient(145deg,#fffaf7,#faece9)]" />
        <div className="absolute -left-28 top-[24%] h-[360px] w-[360px] rounded-full border border-[#c99a54]/12" />
        <div className="absolute -right-36 top-[55%] h-[460px] w-[460px] rounded-full border border-[#d698a4]/13" />
      </div>

      <nav className="fixed left-1/2 top-3 z-50 w-[calc(100%-18px)] max-w-[1040px] -translate-x-1/2 sm:top-4 sm:w-[calc(100%-32px)]">
        <div className="flex h-[62px] items-center rounded-[24px] border border-white/85 bg-white/68 px-3 shadow-[0_16px_50px_rgba(110,65,72,.10)] backdrop-blur-[30px] sm:px-5">
          <a href="#acasa" className="hidden min-w-[145px] sm:block">
            <p className="font-[family-name:var(--font-baptism-editorial)] text-[19px] font-semibold leading-none tracking-[-0.04em]">Anastasia ♡</p>
            <p className="mt-1 text-[6px] font-bold uppercase tracking-[0.18em] text-[#b17984]">un început frumos</p>
          </a>

          <div className="mx-auto flex items-center gap-0.5 text-[9px] font-bold text-[#765d62] sm:text-[10px]">
            {[
              ["Acasă", "#acasa"],
              ["Poveste", "#poveste"],
              ["Nașii", "#nasi"],
              ["Program", "#program"],
              ["Galerie", "#galerie"],
              ["RSVP", "#rsvp"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="rounded-full px-2 py-2.5 transition hover:bg-white/85 hover:text-[#542831] md:px-3">
                {label}
              </a>
            ))}
          </div>

          <a
            href="#rsvp"
            className="hidden min-w-[145px] justify-end sm:flex"
          >
            <span className="rounded-full bg-[#d87587] px-4 py-2 text-[9px] font-bold text-white shadow-[0_8px_24px_rgba(205,105,124,.22)]">
              Confirmă prezența
            </span>
          </a>
        </div>
      </nav>

      <div className="relative z-10">
        <section id="acasa" className="flex min-h-screen scroll-mt-24 items-center px-4 pb-12 pt-24 sm:px-6">
          <div className="mx-auto w-full max-w-[1280px]">
            <div className="relative overflow-hidden rounded-[38px] border border-white/90 bg-white/35 shadow-[0_38px_110px_rgba(119,72,80,.14)] backdrop-blur-[20px] md:rounded-[54px]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/64 via-white/12 to-[#df9eaa]/10" />
              <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full border border-[#c99a54]/18" />
              <div className="absolute -bottom-28 right-[22%] h-80 w-80 rounded-full bg-[#f2c8ce]/18 blur-3xl" />

              <div className="relative grid min-h-[80vh] items-center gap-8 px-7 py-16 md:grid-cols-[1.05fr_.95fr] md:px-14 lg:px-20">
                <div className="max-w-2xl">
                  <SectionLabel>Cu iubire</SectionLabel>
                  <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.24em] text-[#9f7d63]">O zi mică pentru o iubire fără margini</p>
                  <h1 className="mt-5 font-[family-name:var(--font-baptism-editorial)] text-[clamp(58px,8vw,112px)] font-medium leading-[0.78] tracking-[-0.072em]">
                    Botezul micuței
                    <span className="mt-2 block italic text-[#d46f82]">Anastasia</span>
                  </h1>
                  <p className="mt-7 max-w-xl text-[15px] leading-7 text-[#705b60] md:text-[17px]">
                    Vă invităm cu drag să fiți alături de noi într-o zi luminoasă, plină de emoție și oameni dragi.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-2">
                    {[
                      ["15 Mai 2027", "Data"],
                      ["12:00", "Ora"],
                      ["București", "Locația"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-[18px] border border-[#bd7f8a]/10 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl">
                        <p className="text-[7px] font-bold uppercase tracking-[.18em] text-[#b18a69]">{label}</p>
                        <p className="mt-1 text-[11px] font-bold text-[#63343d]">{value}</p>
                      </div>
                    ))}
                  </div>

                  <a href="#rsvp" className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#d67284] px-7 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(200,96,115,.22)] transition hover:-translate-y-0.5 hover:bg-[#c86073]">
                    Confirmă prezența →
                  </a>
                </div>

                <div className="relative mx-auto w-full max-w-[500px]">
                  <div className="absolute -left-5 top-10 hidden h-20 w-20 rounded-full bg-white/75 text-center shadow-xl md:grid md:place-items-center">
                    <div>
                      <p className="text-[20px] text-[#c89850]">✦</p>
                      <p className="mt-1 text-[7px] font-bold uppercase tracking-[.16em] text-[#b97884]">suflet mic</p>
                    </div>
                  </div>
                  <div
                    className="aspect-square rounded-full border-[10px] border-white/80 bg-cover bg-center shadow-[0_30px_90px_rgba(127,74,84,.20)]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,238,239,.08),rgba(240,185,194,.10)),url('https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1100&q=82')",
                    }}
                    role="img"
                    aria-label="Fotografie demo cu un bebeluș"
                  >
                    <div className="h-full w-full rounded-full border border-[#c99b58]/52" />
                  </div>
                  <div className="absolute -bottom-4 right-0 rounded-[22px] border border-white/80 bg-white/76 px-5 py-4 shadow-[0_18px_50px_rgba(111,63,72,.13)] backdrop-blur-xl">
                    <p className="font-[family-name:var(--font-baptism-editorial)] text-[22px] italic text-[#884a56]">Suflet mic.</p>
                    <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[#b58a63]">Iubire mare ♡</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="poveste" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <div className="grid gap-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
              <div className="relative min-h-[420px] overflow-hidden rounded-[36px] border border-white/85 bg-[#f7dfe2]/58 p-8 shadow-[0_24px_70px_rgba(119,75,82,.10)] backdrop-blur-xl">
                <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full border border-[#c69752]/22" />
                <div className="absolute bottom-8 left-8 text-[66px] font-[family-name:var(--font-baptism-editorial)] italic text-[#cc7d8a]/20">A</div>
                <div className="relative flex min-h-[350px] flex-col justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#a6785c]">01 · Povestea ei</p>
                  <div>
                    <p className="font-[family-name:var(--font-baptism-editorial)] text-[38px] italic leading-[1.05] tracking-[-.04em] text-[#7e4550]">
                      „Din iubire s-au născut aripi mici, care fac lumea mai frumoasă.”
                    </p>
                    <div className="mt-7 h-px w-20 bg-[#bc8e4b]/55" />
                  </div>
                </div>
              </div>

              <div className="lg:pl-8">
                <SectionLabel>Mica noastră minune</SectionLabel>
                <h2 className="mt-6 font-[family-name:var(--font-baptism-editorial)] text-[clamp(50px,7vw,88px)] font-medium leading-[0.88] tracking-[-0.065em]">
                  O poveste care abia începe.
                </h2>
                <p className="mt-7 max-w-2xl text-[15px] leading-8 text-[#735f63]">
                  Anastasia a adus în viața noastră cea mai frumoasă lumină. Cu zâmbetul ei, fiecare zi a devenit mai blândă. Acum o încredințăm lui Dumnezeu, înconjurați de cei dragi.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-white/85 bg-white/58 p-5">
                    <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[#ad8262]">Un moment</p>
                    <p className="mt-2 font-[family-name:var(--font-baptism-editorial)] text-[24px] text-[#6e3944]">Plin de lumină</p>
                  </div>
                  <div className="rounded-[22px] border border-white/85 bg-white/58 p-5">
                    <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[#ad8262]">O amintire</p>
                    <p className="mt-2 font-[family-name:var(--font-baptism-editorial)] text-[24px] text-[#6e3944]">Pentru o viață</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="nasi" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[40px] bg-[#633741] px-7 py-14 text-white shadow-[0_30px_90px_rgba(90,47,56,.20)] sm:px-10 md:px-14 md:py-18">
            <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.25em] text-[#e5bd79]">Alături de ea</p>
                <h2 className="mt-5 font-[family-name:var(--font-baptism-editorial)] text-[clamp(54px,7vw,88px)] font-medium leading-[0.86] tracking-[-.065em]">
                  Nașii
                </h2>
              </div>
              <div>
                <p className="max-w-2xl text-[15px] leading-8 text-white/62">
                  Ne vor fi alături cu iubire, sprijin și ocrotire în acest drum frumos.
                </p>
                <p className="mt-6 font-[family-name:var(--font-baptism-editorial)] text-[clamp(36px,5vw,58px)] italic leading-none text-[#f2d09a]">
                  Andreea & Mihai Popescu
                </p>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-white/38">Nași astăzi · ghiduri mereu</p>
              </div>
            </div>
          </div>
        </section>

        <section id="countdown" className="scroll-mt-24 px-5 py-20 text-center sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionLabel>Numărăm zilele</SectionLabel>
            <h2 className="mt-6 font-[family-name:var(--font-baptism-editorial)] text-[clamp(48px,7vw,82px)] font-medium tracking-[-0.06em]">Până la botezul Anastasiei</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#7a666a]">Fiecare secundă ne aduce mai aproape de ziua în care ne bucurăm împreună.</p>
            <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
              {countdownItems.map(([value, label]) => (
                <div key={label} className="rounded-[28px] border border-white/85 bg-white/58 px-4 py-8 shadow-[0_18px_55px_rgba(116,71,79,.08)] backdrop-blur-xl">
                  <div className="font-[family-name:var(--font-baptism-editorial)] text-[54px] font-medium tracking-[-0.07em] text-[#854653] md:text-[68px]">{value}</div>
                  <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.22em] text-[#a17f83]">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="program" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <SectionLabel>Program</SectionLabel>
              <h2 className="mt-6 font-[family-name:var(--font-baptism-editorial)] text-[clamp(50px,7vw,84px)] font-medium leading-[0.9] tracking-[-0.06em]">O zi. Trei momente.</h2>
              <p className="mt-5 text-sm leading-7 text-[#776367]">Tot ce trebuie să știi, fără să cauți prin pagină.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {schedule.map((item, index) => (
                <article key={item.title} className="group rounded-[30px] border border-white/90 bg-white/58 p-6 shadow-[0_20px_60px_rgba(112,68,77,.08)] backdrop-blur-xl transition hover:-translate-y-1 md:p-7">
                  <div className="flex items-start justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f7dfe2] text-[17px] text-[#b96c79]">{item.icon}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[.2em] text-[#b08a65]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-8 font-[family-name:var(--font-baptism-editorial)] text-[34px] font-medium tracking-[-.04em]">{item.title}</h3>
                  <p className="mt-3 text-[28px] font-semibold tracking-[-.04em] text-[#d06d7f]">{item.time}</p>
                  <div className="mt-7 border-t border-[#6f3942]/8 pt-5">
                    <p className="text-sm font-semibold text-[#633842]">{item.place}</p>
                    <p className="mt-1 text-xs text-[#8b7478]">{item.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="galerie" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <SectionLabel>Galerie</SectionLabel>
                <h2 className="mt-6 font-[family-name:var(--font-baptism-editorial)] text-[clamp(50px,7vw,84px)] font-medium leading-[0.9] tracking-[-0.06em]">Momente mici. Amintiri mari.</h2>
              </div>
              <p className="max-w-sm text-sm leading-7 text-[#7b686b]">În proiectul clientului, cardurile se înlocuiesc cu fotografiile familiei.</p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {gallery.map((item, index) => (
                <article key={item.label} className={"relative aspect-[4/5] overflow-hidden rounded-[32px] border border-white/85 shadow-[0_24px_70px_rgba(112,68,77,.10)] " + item.className}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#6a3741]/28 via-transparent to-white/18" />
                  <div className="absolute left-6 top-6 grid h-10 w-10 place-items-center rounded-full border border-white/75 bg-white/55 font-[family-name:var(--font-baptism-editorial)] text-[18px] text-[#9b5662] backdrop-blur-xl">{item.mark}</div>
                  <div className="absolute bottom-6 left-6 right-6 rounded-[20px] border border-white/70 bg-white/58 p-4 backdrop-blur-xl">
                    <p className="text-[8px] font-bold uppercase tracking-[.19em] text-[#ad8066]">0{index + 1}</p>
                    <p className="mt-2 font-[family-name:var(--font-baptism-editorial)] text-[27px] text-[#6d3842]">{item.label}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="rsvp" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto grid max-w-[1180px] gap-9 rounded-[40px] border border-white/90 bg-white/62 p-6 shadow-[0_28px_90px_rgba(112,68,77,.11)] backdrop-blur-xl md:grid-cols-[.82fr_1.18fr] md:p-10 lg:p-14">
            <div>
              <SectionLabel>Confirmă prezența</SectionLabel>
              <h2 className="mt-6 font-[family-name:var(--font-baptism-editorial)] text-[clamp(48px,6vw,76px)] font-medium leading-[0.88] tracking-[-0.06em]">Ne-ar bucura să fii cu noi.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-[#766367]">Formular compact și clar. În proiectul final poate fi conectat la baza de date ORBYVEN / Supabase.</p>
              <p className="mt-8 font-[family-name:var(--font-baptism-editorial)] text-[27px] italic text-[#c56d7c]">Prezența voastră înseamnă mult pentru noi ♡</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Nume și prenume" className="w-full rounded-2xl border border-[#703945]/10 bg-white/78 px-4 py-4 text-sm outline-none transition focus:border-[#cc7080]/45" />
              <div className="grid gap-4 sm:grid-cols-2">
                <select className="rounded-2xl border border-[#703945]/10 bg-white/78 px-4 py-4 text-sm outline-none focus:border-[#cc7080]/45" defaultValue="Particip">
                  <option>Particip</option>
                  <option>Nu particip</option>
                </select>
                <select className="rounded-2xl border border-[#703945]/10 bg-white/78 px-4 py-4 text-sm outline-none focus:border-[#cc7080]/45" defaultValue="2 persoane">
                  <option>1 persoană</option>
                  <option>2 persoane</option>
                  <option>3 persoane</option>
                  <option>4 persoane</option>
                </select>
              </div>
              <textarea placeholder="Un mesaj pentru Anastasia (opțional)" className="min-h-32 w-full resize-y rounded-2xl border border-[#703945]/10 bg-white/78 px-4 py-4 text-sm outline-none focus:border-[#cc7080]/45" />
              <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#d36f81] px-7 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(201,96,115,.20)] transition hover:-translate-y-0.5 sm:w-auto">
                Trimite confirmarea →
              </button>
              {submitted && (
                <p className="rounded-2xl border border-[#ca7281]/14 bg-[#f7e3e6] px-4 py-3 text-sm text-[#74424c]">
                  Demo: confirmarea a fost simulată cu succes.
                </p>
              )}
            </form>
          </div>
        </section>

        <section id="locatie" className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <SectionLabel>Locație</SectionLabel>
              <h2 className="mt-6 font-[family-name:var(--font-baptism-editorial)] text-[clamp(48px,7vw,82px)] font-medium tracking-[-0.06em]">Ne vedem în București.</h2>
            </div>

            <div className="grid overflow-hidden rounded-[36px] border border-white/90 bg-white/64 shadow-[0_26px_80px_rgba(112,68,77,.10)] md:grid-cols-[1.25fr_.75fr]">
              <iframe
                title="Hartă demo București"
                src="https://www.google.com/maps?q=Bucuresti%2C%20Romania&output=embed"
                className="min-h-[360px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="flex flex-col justify-center p-8 md:p-10">
                <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#b18462]">Ceremonie</p>
                <h3 className="mt-3 font-[family-name:var(--font-baptism-editorial)] text-[34px] leading-[1.05] text-[#653640]">Biserica Sf. Nicolae</h3>
                <p className="mt-3 text-sm leading-7 text-[#7a6669]">Str. Exemplu nr. 10 · București</p>
                <div className="my-7 h-px bg-[#713a45]/8" />
                <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#b18462]">Petrecere</p>
                <h3 className="mt-3 font-[family-name:var(--font-baptism-editorial)] text-[34px] leading-[1.05] text-[#653640]">Grand Ballrooms</h3>
                <p className="mt-3 text-sm leading-7 text-[#7a6669]">Calea Victoriei nr. 100 · București</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="px-5 pb-28 pt-14 text-center sm:px-6 md:pb-36">
          <div className="mx-auto max-w-[1080px] rounded-[42px] border border-white/90 bg-[#f5dfe2]/62 px-7 py-16 shadow-[0_26px_80px_rgba(111,68,76,.09)] backdrop-blur-xl md:px-12 md:py-20">
            <p className="text-[9px] font-bold uppercase tracking-[.25em] text-[#ad8061]">Cu iubire, întotdeauna</p>
            <h2 className="mt-5 font-[family-name:var(--font-baptism-editorial)] text-[clamp(54px,8vw,104px)] font-medium leading-[0.82] tracking-[-0.07em] text-[#6d3943]">
              Vă așteptăm<br /><span className="italic text-[#ce6f80]">cu drag.</span>
            </h2>
            <p className="mx-auto mt-7 max-w-xl text-sm leading-7 text-[#786469]">Să ne fiți alături la botezul micuței noastre Anastasia.</p>
            <div className="mx-auto mt-9 flex max-w-lg items-center justify-center gap-4 text-[8px] font-bold uppercase tracking-[.18em] text-[#a37d65]">
              <span>15 Mai 2027</span><span className="text-[#ca7180]">♡</span><span>Anastasia</span><span className="text-[#ca7180]">♡</span><span>București</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
