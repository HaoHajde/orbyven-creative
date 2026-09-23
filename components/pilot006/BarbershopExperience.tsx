"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { barberImages, barberServices, barberTeam, type BarberServiceId, type BarberTeamId } from "./barberData";

const palette = {
  ink: "#10100f",
  paper: "#f0ece3",
  acid: "#c7dc84",
};

const buttonClass = "inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#c7dc84] px-6 text-[11px] font-bold uppercase tracking-[.11em] text-[#11130d] transition hover:bg-[#e0f4a2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c7dc84]";

function BookingModal({ onClose, initialService }: { onClose: () => void; initialService: BarberServiceId }) {
  const [serviceId, setServiceId] = useState<BarberServiceId>(initialService);
  const [staffId, setStaffId] = useState<BarberTeamId>("any");
  const [dates, setDates] = useState<{ iso: string; short: string; day: string }[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const today = new Date();
      const options: { iso: string; short: string; day: string }[] = [];
      for (let index = 0; index < 18 && options.length < 12; index++) {
        const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index + 1);
        if (day.getDay() === 0) continue;
        options.push({
          iso: [day.getFullYear(), String(day.getMonth() + 1).padStart(2, "0"), String(day.getDate()).padStart(2, "0")].join("-"),
          short: day.toLocaleDateString("ro-RO", { day: "numeric", month: "short" }),
          day: day.toLocaleDateString("ro-RO", { weekday: "short" }),
        });
      }
      setDates(options);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const service = barberServices.find((item) => item.id === serviceId) ?? barberServices[0];
  const slots = useMemo(() => {
    if (!date) return [];
    const results: string[] = [];
    for (let hour = 10; hour < 20; hour++) {
      for (const minute of [0, 30]) {
        if (hour * 60 + minute + service.duration > 20 * 60) continue;
        const label = [String(hour).padStart(2, "0"), String(minute).padStart(2, "0")].join(":");
        const hash = [...(date + label + staffId)].reduce((acc, char) => acc + char.charCodeAt(0), 0);
        if (hash % 5 !== 0) results.push(label);
      }
    }
    return results;
  }, [date, service.duration, staffId]);

  const staff = barberTeam.find((member) => member.id === staffId) ?? barberTeam[2];
  const selectedDate = dates.find((item) => item.iso === date);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/85 p-0 backdrop-blur-md sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="barber-booking-heading" className="flex max-h-[94dvh] w-full max-w-[800px] flex-col overflow-hidden rounded-t-[28px] border border-white/15 bg-[#1a1a17] text-[#f0ece3] shadow-[0_30px_120px_rgba(0,0,0,.55)] sm:rounded-[28px]">
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-white/10 px-5 py-5 sm:px-8 sm:py-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#c7dc84]">Booking studio · pilot #006</p>
            <h2 id="barber-booking-heading" className="mt-2 text-[31px] font-black uppercase leading-none tracking-[-.06em] sm:text-[40px]">{complete ? "Selecție salvată." : "Locul tău în scaun."}</h2>
            <p className="mt-2 max-w-lg text-[12px] leading-5 text-white/45">Demo interactiv. Nu rezervă un slot real și nu trimite date către un salon.</p>
          </div>
          <button type="button" aria-label="Închide programarea" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20 text-xl hover:bg-white/10">×</button>
        </header>

        {complete ? (
          <div className="overflow-y-auto px-5 py-10 sm:px-8">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#c7dc84] text-3xl text-black">✓</div>
            <h3 className="mt-6 text-[clamp(30px,5vw,48px)] font-black uppercase leading-[.95] tracking-[-.06em]">Așa ar arăta o programare.</h3>
            <p className="mt-4 text-sm leading-6 text-white/55">Ai parcurs fluxul complet. În versiunea de producție, aici vom confirma doar după validarea disponibilității în calendar și salvarea programării.</p>
            <div className="mt-7 grid gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-5 text-sm">
              <p><span className="text-white/45">Serviciu:</span> {service.name} · {service.price} lei</p>
              <p><span className="text-white/45">Barber:</span> {staff.name}</p>
              <p><span className="text-white/45">Când:</span> {selectedDate?.short} · {time}</p>
            </div>
            <button type="button" onClick={onClose} className={`${buttonClass} mt-8`}>Înapoi la site ↗</button>
          </div>
        ) : (
          <>
            <div className="space-y-7 overflow-y-auto px-5 py-6 sm:px-8">
              <fieldset>
                <legend className="mb-3 text-[10px] font-bold uppercase tracking-[.20em] text-white/45">01 / Ce facem?</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {barberServices.map((item) => (
                    <button type="button" key={item.id} aria-pressed={serviceId === item.id} onClick={() => { setServiceId(item.id); setTime(""); }} className={`flex items-center justify-between gap-4 rounded-[16px] border p-4 text-left transition ${serviceId === item.id ? "border-[#c7dc84] bg-[#c7dc84]/10" : "border-white/10 bg-white/[.025] hover:border-white/30"}`}>
                      <span><strong className="block text-[13px]">{item.name}</strong><small className="mt-1 block text-[10px] text-white/45">{item.duration} min</small></span>
                      <strong className="shrink-0 text-[12px] text-[#c7dc84]">{item.price} lei</strong>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-3 text-[10px] font-bold uppercase tracking-[.20em] text-white/45">02 / Cu cine?</legend>
                <div className="grid grid-cols-3 gap-2">
                  {barberTeam.map((member) => (
                    <button type="button" key={member.id} aria-pressed={staffId === member.id} onClick={() => { setStaffId(member.id); setTime(""); }} className={`min-h-[104px] rounded-[16px] border px-2 py-3 text-center transition ${staffId === member.id ? "border-[#c7dc84] bg-[#c7dc84]/10" : "border-white/10 bg-white/[.025] hover:border-white/30"}`}>
                      <span className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full bg-[#c7dc84]/14 text-xs font-black text-[#c7dc84]">{member.initials}</span>
                      <span className="block text-[11px] font-bold">{member.name}</span>
                      <span className="mt-1 block text-[9px] text-white/40">{member.tag}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-3 text-[10px] font-bold uppercase tracking-[.20em] text-white/45">03 / Ce zi?</legend>
                <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
                  {dates.length ? dates.map((item) => (
                    <button type="button" key={item.iso} aria-pressed={date === item.iso} onClick={() => { setDate(item.iso); setTime(""); }} className={`min-h-20 min-w-[84px] shrink-0 rounded-[16px] border p-3 text-center transition ${date === item.iso ? "border-[#c7dc84] bg-[#c7dc84] text-black" : "border-white/10 bg-white/[.025] hover:border-white/30"}`}>
                      <span className="block text-[11px] font-bold capitalize">{item.day}</span><span className="mt-2 block text-[10px]">{item.short}</span>
                    </button>
                  )) : <p className="text-xs text-white/45">Pregătim datele…</p>}
                </div>
              </fieldset>
              {date && (
                <fieldset>
                  <legend className="mb-3 text-[10px] font-bold uppercase tracking-[.20em] text-white/45">04 / La ce oră?</legend>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {slots.map((slot) => (
                      <button type="button" key={slot} aria-pressed={time === slot} onClick={() => setTime(slot)} className={`rounded-xl border px-2 py-3 text-[11px] font-bold transition ${time === slot ? "border-[#c7dc84] bg-[#c7dc84] text-black" : "border-white/10 hover:border-white/30"}`}>{slot}</button>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] leading-5 text-white/35">Ore simulate pentru a testa experiența. Nu reprezintă disponibilitate reală.</p>
                </fieldset>
              )}
            </div>
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-[#20201c] px-5 py-4 sm:px-8">
              <div><p className="text-[10px] text-white/40">{service.duration} min · {staff.name}</p><p className="mt-1 text-[25px] font-black tracking-[-.06em]">{service.price} lei</p></div>
              <button type="button" disabled={!date || !time} onClick={() => setComplete(true)} className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-35`}>Simulează confirmarea ↗</button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

export function BarberHero({ compact = false, onBook }: { compact?: boolean; onBook?: () => void }) {
  if (compact) {
    return (
      <div className="relative h-[338px] overflow-hidden bg-[#181713] font-sans text-[#f0ece3] sm:h-[372px]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${barberImages.hero}")` }} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,8,.95)_0%,rgba(9,9,8,.72)_48%,rgba(9,9,8,.10)_100%)]" />
        <div className="relative flex items-center justify-between border-b border-white/15 px-5 py-3">
          <span className="text-[10px] font-black uppercase tracking-[-.07em]">NOIR<span className="text-[#c7dc84]">.</span> CUTS</span>
          <span className="rounded-full bg-[#c7dc84] px-3 py-2 text-[6px] font-black uppercase tracking-widest text-[#10100f]">Book now ↗</span>
        </div>
        <div className="relative flex h-[290px] flex-col justify-center px-6 sm:h-[320px]">
          <span className="text-[6px] font-bold uppercase tracking-[.28em] text-[#c7dc84]">Barbershop · booking first</span>
          <h2 className="mt-5 max-w-[320px] text-[clamp(50px,7vw,76px)] font-black uppercase leading-[.78] tracking-[-.09em]">LOOK<br/>SHARP<span className="text-[#c7dc84]">.</span><br/>FEEL<br/>DIFFERENT.</h2>
          <p className="mt-5 max-w-[245px] text-[7px] leading-3 text-white/60">Tunsoare, barbă, ritual. Tu alegi ora. Noi ne ocupăm de restul.</p>
          <span className="mt-5 w-fit rounded-full bg-[#c7dc84] px-4 py-2 text-[7px] font-bold uppercase tracking-wide text-[#10100f]">Programează-te ↗</span>
        </div>
        <div className="absolute bottom-4 right-4 border-l border-[#c7dc84] pl-2 text-[6px] uppercase tracking-[.16em] text-white/70">Demo / 006</div>
      </div>
    );
  }

  return (
    <section id="acasa" className="relative isolate flex min-h-[780px] flex-col overflow-hidden bg-[#13120f] text-[#f0ece3] sm:min-h-[850px] lg:min-h-[92svh]">
      <div className="absolute inset-0 -z-30 bg-cover bg-[center_40%]" style={{ backgroundImage: `url("${barberImages.hero}")` }} />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(11,11,10,.96)_0%,rgba(11,11,10,.79)_42%,rgba(11,11,10,.25)_74%,rgba(11,11,10,.40)_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[.10] [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:62px_62px]" />
      <div className="relative z-20 mx-auto flex w-full max-w-[1550px] items-center justify-between gap-5 px-5 py-6 sm:px-8 md:px-12">
        <Link href="/templates" aria-label="Înapoi la biblioteca ORBYVEN" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-[16px] font-black">N<span className="text-[#c7dc84]">.</span></span>
          <span className="text-lg font-black uppercase tracking-[-.08em] sm:text-xl">NOIR<span className="text-[#c7dc84]">.</span> CUTS</span>
        </Link>
        <nav aria-label="Navigare barbershop" className="hidden items-center gap-7 text-[10px] font-bold uppercase tracking-[.15em] text-white/75 md:flex">
          <a href="#servicii" className="hover:text-[#c7dc84]">Servicii</a><a href="#echipa" className="hover:text-[#c7dc84]">Echipă</a><a href="#lookbook" className="hover:text-[#c7dc84]">Lookbook</a>
        </nav>
        <button type="button" onClick={onBook} className={buttonClass}>Programează-te <span aria-hidden="true">↗</span></button>
      </div>
      <div className="mx-auto flex w-full max-w-[1550px] flex-1 flex-col justify-center px-5 pb-12 pt-20 sm:px-8 md:px-12 lg:pt-14">
        <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.27em] text-[#c7dc84]"><span className="h-px w-8 bg-[#c7dc84]"/> A better kind of barbershop</p>
        <h1 className="mt-10 max-w-5xl text-[clamp(72px,12vw,176px)] font-black uppercase leading-[.76] tracking-[-.105em]">LOOK<br />SHARP<span className="text-[#c7dc84]">.</span><br />FEEL<br />DIFFERENT.</h1>
        <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="max-w-md text-[14px] leading-6 text-white/65 sm:text-[16px]">Tunsoare, barbă, ritual. Tu alegi ora.<br />Noi ne ocupăm de restul.</p>
            <button type="button" onClick={onBook} className={`${buttonClass} mt-6`}>Rezervă-ți locul <span aria-hidden="true">↗</span></button>
          </div>
          <div className="flex items-center gap-7 border-t border-white/25 pt-5 text-white/60 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <div><strong className="block text-[30px] font-black leading-none text-[#c7dc84]">04</strong><span className="mt-1 block text-[9px] uppercase tracking-widest">ritualuri</span></div>
            <div><strong className="block text-[30px] font-black leading-none text-[#c7dc84]">02</strong><span className="mt-1 block text-[9px] uppercase tracking-widest">barberi demo</span></div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 bg-black/35 px-5 py-4 text-[9px] font-bold uppercase tracking-[.19em] text-white/60 backdrop-blur-sm sm:px-8 md:px-12">
        <span>NOIR CUTS — YOUR NEXT GOOD HAIR DAY</span><span className="text-[#c7dc84]">Scroll to discover ↓</span>
      </div>
    </section>
  );
}

export default function BarbershopExperience() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<BarberServiceId>("cut");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [category, setCategory] = useState("Toate");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const categories = ["Toate", "Tunsoare", "Barbă", "Pachet"];
  const shownServices = barberServices.filter((service) => category === "Toate" || service.category === category);
  const openBooking = (id: BarberServiceId = "cut") => {
    setSelectedService(id);
    setBookingOpen(true);
  };
  const closeBooking = () => setBookingOpen(false);

  return (
    <main style={{ background: palette.ink, color: palette.paper, fontFamily: "Arial, Helvetica, sans-serif" }} className="min-h-screen overflow-x-hidden antialiased selection:bg-[#c7dc84] selection:text-black">
      <BarberHero onBook={() => openBooking()} />

      <div className="sticky top-0 z-30 flex items-center justify-between border-y border-[#c7dc84]/25 bg-[#151612]/95 px-5 py-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/75 backdrop-blur-lg sm:px-8 md:hidden">
        <Link href="/templates" className="text-[#c7dc84]">← ORBYVEN</Link>
        <button type="button" aria-expanded={mobileMenu} onClick={() => setMobileMenu((value) => !value)}>Meniu {mobileMenu ? "×" : "+"}</button>
        {mobileMenu && <div className="absolute inset-x-0 top-full grid gap-1 border-b border-white/15 bg-[#151612] p-4">
          {[["#servicii", "Servicii"], ["#echipa", "Echipă"], ["#lookbook", "Lookbook"]].map(([href, title]) => <a key={href} href={href} onClick={() => setMobileMenu(false)} className="py-3">{title} ↗</a>)}
          <button type="button" onClick={() => { setMobileMenu(false); openBooking(); }} className="py-3 text-left text-[#c7dc84]">Programează-te ↗</button>
        </div>}
      </div>

      <section id="servicii" className="scroll-mt-16 bg-[#f0ece3] px-5 py-20 text-[#171811] sm:px-8 md:px-12 md:py-28">
        <div className="mx-auto max-w-[1450px]">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div><p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#67743f]">01 / The menu</p><h2 className="mt-6 text-[clamp(62px,9vw,130px)] font-black uppercase leading-[.78] tracking-[-.09em]">ZERO<br />COMPROMISE.</h2></div>
            <p className="max-w-sm text-[14px] leading-7 text-black/60">Tot ce ai nevoie. Fără pachete inutile, fără prețuri ascunse. Alege serviciul și rezervă în câteva secunde.</p>
          </div>
          <div className="mt-12 flex flex-wrap gap-2">
            {categories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)} className={`rounded-full border px-5 py-3 text-[11px] font-bold transition ${category === item ? "border-[#202419] bg-[#202419] text-white" : "border-black/15 hover:border-black/65"}`}>{item}</button>)}
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {shownServices.map((service, index) => (
              <article key={service.id} className="group flex min-h-[260px] flex-col justify-between rounded-[24px] border border-black/15 bg-white/40 p-6 transition hover:border-[#67743f]/60 hover:bg-white/75 sm:p-8">
                <div className="flex items-start justify-between gap-4"><span className="text-[11px] font-bold uppercase tracking-[.16em] text-black/40">0{index + 1} / {service.category}</span><span className="text-[11px] font-bold uppercase text-[#4d6021]">{service.duration} min</span></div>
                <div><h3 className="text-[clamp(28px,4vw,45px)] font-black uppercase tracking-[-.06em]">{service.name}</h3><p className="mt-3 text-sm text-black/50">{service.details}</p></div>
                <div className="mt-6 flex items-end justify-between gap-4"><span className="text-[32px] font-black tracking-[-.05em]">{service.price} <small className="text-base">LEI</small></span><button type="button" onClick={() => openBooking(service.id)} className="grid h-12 w-12 place-items-center rounded-full bg-[#171811] text-xl text-[#c7dc84] transition group-hover:rotate-45" aria-label={`Alege ${service.name} pentru programare`}>↗</button></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="echipa" className="scroll-mt-16 px-5 py-20 sm:px-8 md:px-12 md:py-28">
        <div className="mx-auto grid max-w-[1450px] gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="relative min-h-[450px] overflow-hidden rounded-[22px] bg-[#27251d] sm:min-h-[600px]">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${barberImages.detail}")` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            <span className="absolute bottom-7 left-7 text-[10px] font-black uppercase tracking-[.21em] text-[#c7dc84]">Craft is the culture.</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#c7dc84]">02 / The people</p>
            <h2 className="mt-7 text-[clamp(62px,8vw,116px)] font-black uppercase leading-[.78] tracking-[-.095em]">GOOD<br />HANDS.<br /><span className="text-[#c7dc84]">GOOD</span><br />ENERGY.</h2>
            <p className="mt-7 max-w-md text-[14px] leading-7 text-white/52">Alege specialistul sau lasă-ne pe noi să-ți propunem primul slot. Profilurile de mai jos sunt demonstrative și se personalizează pentru salonul real.</p>
            <div className="mt-9 grid gap-2 sm:grid-cols-2">
              {barberTeam.filter((person) => person.id !== "any").map((person) => (
                <article key={person.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[.035] p-4">
                  <div className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#c7dc84]/15 text-sm font-bold text-[#c7dc84]">{person.initials}</span><div><strong className="text-[14px]">{person.name}</strong><p className="mt-1 text-[10px] text-white/40">{person.tag}</p></div></div>
                  <button type="button" onClick={() => openBooking()} className="text-2xl text-[#c7dc84]" aria-label={`Programează-te cu ${person.name}`}>↗</button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="lookbook" className="scroll-mt-16 bg-[#1e2019] px-5 py-20 sm:px-8 md:px-12 md:py-28">
        <div className="mx-auto max-w-[1450px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div><p className="text-[10px] font-bold uppercase tracking-[.27em] text-[#c7dc84]">03 / Lookbook</p><h2 className="mt-5 text-[clamp(60px,9vw,125px)] font-black uppercase leading-[.78] tracking-[-.09em]">THE WORK<br /><span className="text-[#c7dc84]">SPEAKS.</span></h2></div>
            <p className="max-w-xs text-xs leading-6 text-white/45">Selecție foto ilustrativă pentru demo. Fotografiile reale ale salonului vor înlocui aceste imagini la personalizare.</p>
          </div>
          <div className="mt-12 grid gap-3 md:grid-cols-[1.25fr_.85fr_.85fr]">
            {barberImages.gallery.map((url, index) => (
              <button type="button" key={url} aria-label={`Mărește fotografia ilustrativă ${index + 1}`} onClick={() => setLightbox(index)} className="group relative min-h-[280px] overflow-hidden rounded-[18px] bg-[#393b2a] md:min-h-[440px]">
                <span className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.04]" style={{ backgroundImage: `url("${url}")` }} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-5 left-6 text-[10px] font-bold uppercase tracking-[.18em] text-white">NOIR / 0{index + 1}</span><span className="absolute bottom-5 right-6 text-xl text-[#c7dc84]">↗</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#c7dc84] px-5 py-20 text-[#171811] sm:px-8 md:px-12 md:py-28">
        <div className="mx-auto flex max-w-[1450px] flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div><p className="text-[10px] font-bold uppercase tracking-[.27em]">04 / Your turn</p><h2 className="mt-6 text-[clamp(70px,12vw,170px)] font-black uppercase leading-[.73] tracking-[-.105em]">SAME YOU.<br />BETTER CUT.</h2></div>
          <div className="max-w-xs"><p className="text-[14px] leading-7 text-black/65">Alegi serviciul, specialistul și ora. Restul durează mai puțin decât un espresso.</p><button type="button" onClick={() => openBooking()} className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#171811] px-7 text-[11px] font-bold uppercase tracking-[.11em] text-[#c7dc84] hover:bg-black">Încearcă rezervarea ↗</button></div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-6 border-t border-white/15 bg-[#10100f] px-5 py-9 text-[11px] text-white/45 sm:px-8 md:px-12">
        <div><strong className="block text-2xl font-black uppercase tracking-[-.09em] text-[#f0ece3]">NOIR<span className="text-[#c7dc84]">.</span> CUTS</strong><p className="mt-1">Template demo ORBYVEN · Pilot #006</p></div>
        <div className="flex flex-wrap items-center gap-5"><a href="#acasa" className="hover:text-[#c7dc84]">↑ Înapoi sus</a><Link href="/templates" className="hover:text-[#c7dc84]">← Toate template-urile</Link></div>
      </footer>

      {bookingOpen && <BookingModal initialService={selectedService} onClose={closeBooking} />}
      {lightbox !== null && (
        <div role="dialog" aria-modal="true" aria-label="Fotografie demonstrativă mărită" className="fixed inset-0 z-[210] flex items-center justify-center bg-black/95 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setLightbox(null); }}>
          <button type="button" onClick={() => setLightbox(null)} className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/35 text-2xl text-white" aria-label="Închide fotografia">×</button>
          <div className="relative h-[75svh] w-full max-w-[1200px] bg-contain bg-center bg-no-repeat" role="img" aria-label={`Fotografie de prezentare ${lightbox + 1}`} style={{ backgroundImage: `url("${barberImages.gallery[lightbox]}")` }} />
        </div>
      )}
    </main>
  );
}
