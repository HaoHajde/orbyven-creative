"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

export const haoImages = {
  hero: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1800&q=78",
  coupe: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1600&q=76",
  interior: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1600&q=76",
  suv: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1600&q=76",
};

const navItems = [
  { href: "/templates/haos-customs", label: "Acasă" },
  { href: "/templates/haos-customs/galerie", label: "Galerie" },
  { href: "/templates/haos-customs/preturi", label: "Prețuri" },
  { href: "/templates/haos-customs/contact", label: "Contact" },
];

export function HaoShell({
  children,
  active,
}: {
  children: ReactNode;
  active: "home" | "gallery" | "pricing" | "contact";
}) {
  const [open, setOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-[#f5f1e7]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif" }}>
      <div className="relative z-[70] border-b border-white/8 bg-black px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <span>Pilot #005 · demo ORBYVEN</span>
          <Link href="/templates" className="transition hover:text-[#d2ad62]">Înapoi la templates ↗</Link>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed left-3 top-14 z-[90] grid h-12 w-12 place-items-center rounded-full border border-[#d2ad62]/30 bg-black/70 text-[#d2ad62] shadow-[0_15px_50px_rgba(0,0,0,.42)] backdrop-blur-xl transition hover:border-[#d2ad62]/70 sm:left-5 sm:top-16"
        aria-label={open ? "Închide meniul" : "Deschide meniul"}
      >
        <span className="text-[13px] font-black tracking-[-.04em]">{open ? "×" : "HC"}</span>
      </button>

      <div className={`fixed inset-0 z-[80] transition ${open ? "pointer-events-auto bg-black/60 backdrop-blur-sm" : "pointer-events-none bg-transparent"}`} onClick={() => setOpen(false)} />
      <aside className={`fixed inset-y-0 left-0 z-[85] flex w-[min(88vw,360px)] flex-col border-r border-white/10 bg-[#080808]/96 px-6 pb-7 pt-24 shadow-[35px_0_100px_rgba(0,0,0,.55)] backdrop-blur-2xl transition duration-500 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d2ad62]">Hao&apos;s Customs</p>
          <h2 className="mt-4 text-[42px] font-semibold leading-[.92] tracking-[-.06em] text-white">Detailing fără compromis.</h2>
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/42">Interior, exterior, polish și protecție ceramică într-o experiență premium construită pentru mobil.</p>
        </div>

        <nav className="mt-10 border-t border-white/10">
          {navItems.map((item, index) => {
            const isActive =
              (active === "home" && index === 0) ||
              (active === "gallery" && index === 1) ||
              (active === "pricing" && index === 2) ||
              (active === "contact" && index === 3);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between border-b border-white/10 py-5 text-[16px] font-medium transition ${isActive ? "text-[#d2ad62]" : "text-white/62 hover:text-white"}`}
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-white/24">0{index + 1}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[22px] border border-[#d2ad62]/18 bg-[#d2ad62]/8 p-5">
          <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[#d2ad62]">Programări demo</p>
          <p className="mt-3 text-sm leading-6 text-white/58">Alege serviciile, vezi estimarea și continuă direct în calendar.</p>
          <Link href="/templates/haos-customs/preturi" className="mt-5 inline-flex rounded-full bg-[#d2ad62] px-5 py-3 text-[12px] font-bold text-black">Configurează →</Link>
        </div>
      </aside>

      {children}
    </main>
  );
}

export function BeforeAfter({
  image,
  title,
  subtitle,
}: {
  image: string;
  title: string;
  subtitle: string;
}) {
  const [position, setPosition] = useState(58);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0b]">
      <div className="relative aspect-[4/3] min-h-[330px] overflow-hidden sm:aspect-[16/10]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(25,18,8,.26),rgba(18,12,5,.30)),url("${image}")`,
            filter: "brightness(.52) saturate(.48) contrast(.86)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_30%,rgba(216,188,130,.16),transparent_27%),linear-gradient(120deg,rgba(255,255,255,.05),transparent_45%)]" />

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,.02),rgba(0,0,0,.12)),url("${image}")`,
            clipPath: `inset(0 ${100 - position}% 0 0)`,
            filter: "brightness(1.04) saturate(1.08) contrast(1.06)",
          }}
        />

        <div className="pointer-events-none absolute inset-y-0 w-px bg-white/90 shadow-[0_0_20px_rgba(255,255,255,.6)]" style={{ left: `${position}%` }}>
          <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/72 text-[12px] text-[#d2ad62] backdrop-blur-md">↔</div>
        </div>

        <input
          aria-label={`Compară înainte și după pentru ${title}`}
          type="range"
          min="8"
          max="92"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />

        <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/12 bg-black/55 px-3 py-2 text-[8px] font-bold uppercase tracking-[.16em] text-white/58 backdrop-blur">Înainte</span>
        <span className="pointer-events-none absolute right-4 top-4 rounded-full border border-[#d2ad62]/30 bg-black/55 px-3 py-2 text-[8px] font-bold uppercase tracking-[.16em] text-[#d2ad62] backdrop-blur">După</span>
      </div>
      <div className="flex items-end justify-between gap-5 p-5 sm:p-6">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#d2ad62]">{subtitle}</p>
          <h3 className="mt-2 text-[26px] font-semibold tracking-[-.045em] text-white">{title}</h3>
        </div>
        <span className="hidden rounded-full border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.14em] text-white/34 sm:block">slide ↔</span>
      </div>
    </div>
  );
}

const vehicleOptions = [
  { id: "compact", label: "Compact / sedan", add: 0 },
  { id: "suv", label: "SUV / crossover", add: 120 },
  { id: "premium", label: "Premium / sport", add: 160 },
  { id: "large", label: "7 locuri / van", add: 220 },
];

const packageOptions = [
  { id: "interior", label: "Interior Deep", price: 449, copy: "aspirare, textile, plastice, geamuri, finisaj" },
  { id: "exterior", label: "Exterior Reset", price: 549, copy: "spumă activă, decontaminare, jante, protecție" },
  { id: "full", label: "Signature Full", price: 899, copy: "interior + exterior, finisaj premium complet" },
];

const extras = [
  { id: "polish", label: "Polish corecție", price: 650 },
  { id: "ceramic", label: "Protecție ceramică", price: 1200 },
  { id: "ozone", label: "Igienizare ozon", price: 149 },
  { id: "leather", label: "Tratament piele", price: 249 },
];

export function Configurator() {
  const [vehicle, setVehicle] = useState("compact");
  const [pack, setPack] = useState("full");
  const [selectedExtras, setSelectedExtras] = useState<string[]>(["ozone"]);

  const total = useMemo(() => {
    const vehicleAdd = vehicleOptions.find((item) => item.id === vehicle)?.add ?? 0;
    const packagePrice = packageOptions.find((item) => item.id === pack)?.price ?? 0;
    const extrasPrice = selectedExtras.reduce((sum, id) => sum + (extras.find((item) => item.id === id)?.price ?? 0), 0);
    return packagePrice + vehicleAdd + extrasPrice;
  }, [vehicle, pack, selectedExtras]);

  const toggleExtra = (id: string) => {
    setSelectedExtras((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const continueToBooking = () => {
    const packageLabel = packageOptions.find((item) => item.id === pack)?.label ?? "Pachet";
    const vehicleLabel = vehicleOptions.find((item) => item.id === vehicle)?.label ?? "Mașină";
    const payload = {
      vehicle: vehicleLabel,
      package: packageLabel,
      extras: selectedExtras.map((id) => extras.find((item) => item.id === id)?.label).filter(Boolean),
      total,
    };
    window.sessionStorage.setItem("haos-customs-estimate", JSON.stringify(payload));
    window.location.assign(`/templates/haos-customs/contact?estimate=${total}`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <div className="space-y-4">
        <section className="rounded-[26px] border border-white/10 bg-white/[.035] p-5 sm:p-7">
          <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[#d2ad62]">01 · Mașina</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {vehicleOptions.map((item) => (
              <button key={item.id} type="button" onClick={() => setVehicle(item.id)} className={`rounded-[17px] border p-4 text-left transition ${vehicle === item.id ? "border-[#d2ad62]/60 bg-[#d2ad62]/10" : "border-white/8 bg-black/20 hover:border-white/18"}`}>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-2 text-[11px] text-white/38">{item.add ? `+${item.add} lei` : "preț de bază"}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[26px] border border-white/10 bg-white/[.035] p-5 sm:p-7">
          <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[#d2ad62]">02 · Pachetul</p>
          <div className="mt-5 grid gap-2">
            {packageOptions.map((item) => (
              <button key={item.id} type="button" onClick={() => setPack(item.id)} className={`flex items-center justify-between gap-5 rounded-[17px] border p-4 text-left transition sm:p-5 ${pack === item.id ? "border-[#d2ad62]/60 bg-[#d2ad62]/10" : "border-white/8 bg-black/20 hover:border-white/18"}`}>
                <div><p className="text-sm font-semibold text-white">{item.label}</p><p className="mt-2 text-[11px] leading-5 text-white/38">{item.copy}</p></div>
                <span className="shrink-0 text-[18px] font-semibold tracking-[-.04em] text-[#d2ad62]">{item.price} lei</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[26px] border border-white/10 bg-white/[.035] p-5 sm:p-7">
          <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[#d2ad62]">03 · Extra</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {extras.map((item) => {
              const selected = selectedExtras.includes(item.id);
              return (
                <button key={item.id} type="button" onClick={() => toggleExtra(item.id)} className={`flex items-center justify-between gap-3 rounded-[17px] border p-4 text-left transition ${selected ? "border-[#d2ad62]/55 bg-[#d2ad62]/9" : "border-white/8 bg-black/20 hover:border-white/18"}`}>
                  <div><p className="text-[13px] font-semibold text-white">{item.label}</p><p className="mt-1 text-[10px] text-white/34">+{item.price} lei</p></div>
                  <span className={`grid h-6 w-6 place-items-center rounded-full border text-[10px] ${selected ? "border-[#d2ad62] bg-[#d2ad62] text-black" : "border-white/18 text-transparent"}`}>✓</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-[28px] border border-[#d2ad62]/22 bg-[radial-gradient(circle_at_80%_10%,rgba(210,173,98,.15),transparent_35%),#0a0a0a] p-6 lg:sticky lg:top-6 sm:p-8">
        <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-[#d2ad62]">Estimare instant</p>
        <div className="mt-7 flex items-end gap-2">
          <span className="text-[clamp(58px,9vw,92px)] font-semibold leading-none tracking-[-.075em] text-white">{total}</span>
          <span className="pb-2 text-sm text-white/40">lei</span>
        </div>
        <p className="mt-4 text-sm leading-6 text-white/42">Estimare demo. Prețul final poate varia în funcție de starea mașinii și suprafața reală de lucru.</p>

        <div className="mt-8 space-y-3 border-y border-white/10 py-6 text-[12px]">
          <div className="flex justify-between gap-4"><span className="text-white/38">Mașină</span><span className="text-right font-medium text-white/76">{vehicleOptions.find((item) => item.id === vehicle)?.label}</span></div>
          <div className="flex justify-between gap-4"><span className="text-white/38">Pachet</span><span className="text-right font-medium text-white/76">{packageOptions.find((item) => item.id === pack)?.label}</span></div>
          <div className="flex justify-between gap-4"><span className="text-white/38">Extra</span><span className="text-right font-medium text-white/76">{selectedExtras.length || "—"}</span></div>
        </div>

        <button type="button" onClick={continueToBooking} className="mt-7 flex w-full items-center justify-between rounded-full bg-[#d2ad62] px-6 py-4 text-sm font-bold text-black transition hover:bg-[#e5c57d]">
          <span>Continuă la programare</span><span>→</span>
        </button>
      </aside>
    </div>
  );
}

type DayOption = { iso: string; weekday: string; date: string; full: string };

export function AvailabilityCalendar() {
  const [days, setDays] = useState<DayOption[]>([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [summary, setSummary] = useState<{ vehicle?: string; package?: string; extras?: string[]; total?: number } | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("ro-RO", { weekday: "short", day: "2-digit", month: "short" });
    const fullFormatter = new Intl.DateTimeFormat("ro-RO", { weekday: "long", day: "numeric", month: "long" });
    const nextDays = Array.from({ length: 12 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index + 1);
      const parts = formatter.formatToParts(date);
      return {
        iso: date.toISOString().slice(0, 10),
        weekday: parts.find((part) => part.type === "weekday")?.value ?? "",
        date: parts.filter((part) => part.type === "day" || part.type === "month").map((part) => part.value).join(" "),
        full: fullFormatter.format(date),
      };
    });
    setDays(nextDays);
    setSelectedDay(nextDays[0]?.iso ?? "");

    const params = new URLSearchParams(window.location.search);
    const estimateParam = Number(params.get("estimate"));
    if (Number.isFinite(estimateParam) && estimateParam > 0) setEstimate(estimateParam);

    const stored = window.sessionStorage.getItem("haos-customs-estimate");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSummary(parsed);
        if (typeof parsed.total === "number") setEstimate(parsed.total);
      } catch {
        setSummary(null);
      }
    }
  }, []);

  const selectedIndex = Math.max(0, days.findIndex((day) => day.iso === selectedDay));
  const timeSets = [
    ["09:00", "11:30", "15:30"],
    ["10:00", "13:00", "17:00"],
    ["08:30", "12:30", "16:00"],
  ];
  const times = timeSets[selectedIndex % timeSets.length];

  const activeDay = days.find((day) => day.iso === selectedDay);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.08fr_.92fr]">
      <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5 sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[#d2ad62]">Disponibilitate demo</p><h2 className="mt-3 text-[32px] font-semibold tracking-[-.05em]">Alege ziua potrivită.</h2></div>
          <span className="hidden rounded-full border border-white/10 px-3 py-2 text-[9px] text-white/35 sm:block">următoarele 12 zile</span>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {days.map((day) => (
            <button key={day.iso} type="button" onClick={() => { setSelectedDay(day.iso); setSelectedTime(""); }} className={`rounded-[16px] border px-2 py-4 text-center transition ${selectedDay === day.iso ? "border-[#d2ad62]/70 bg-[#d2ad62]/12" : "border-white/8 bg-black/18 hover:border-white/18"}`}>
              <span className="block text-[9px] uppercase tracking-[.12em] text-white/34">{day.weekday}</span>
              <span className="mt-2 block text-[13px] font-semibold text-white">{day.date}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 border-t border-white/10 pt-7">
          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-white/35">Ore disponibile</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {times.map((time) => (
              <button key={time} type="button" onClick={() => setSelectedTime(time)} className={`rounded-full border px-5 py-3 text-[12px] font-semibold transition ${selectedTime === time ? "border-[#d2ad62] bg-[#d2ad62] text-black" : "border-white/10 bg-black/20 text-white/66 hover:border-white/22"}`}>{time}</button>
            ))}
          </div>
        </div>
      </section>

      <aside className="rounded-[28px] border border-[#d2ad62]/22 bg-[#0a0a0a] p-6 sm:p-7">
        <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[#d2ad62]">Cerere programare</p>
        {summary && (
          <div className="mt-5 rounded-[18px] border border-[#d2ad62]/14 bg-[#d2ad62]/7 p-4 text-[11px] leading-5 text-white/55">
            <p className="font-semibold text-white/80">{summary.package ?? "Configurație selectată"}</p>
            <p>{summary.vehicle}</p>
            {!!summary.extras?.length && <p>{summary.extras.join(" · ")}</p>}
          </div>
        )}

        <div className="mt-5 grid gap-3">
          <input aria-label="Nume" placeholder="Nume" className="h-12 rounded-[14px] border border-white/10 bg-white/[.035] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#d2ad62]/55" />
          <input aria-label="Telefon" placeholder="Telefon" className="h-12 rounded-[14px] border border-white/10 bg-white/[.035] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#d2ad62]/55" />
          <input aria-label="Model mașină" placeholder="Model mașină" className="h-12 rounded-[14px] border border-white/10 bg-white/[.035] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#d2ad62]/55" />
          <textarea aria-label="Observații" placeholder="Observații despre starea mașinii..." rows={4} className="rounded-[14px] border border-white/10 bg-white/[.035] p-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#d2ad62]/55" />
        </div>

        <div className="mt-6 border-y border-white/10 py-5 text-[12px]">
          <div className="flex justify-between gap-4"><span className="text-white/35">Data</span><span className="text-right text-white/74">{activeDay?.full ?? "Alege data"}</span></div>
          <div className="mt-3 flex justify-between gap-4"><span className="text-white/35">Ora</span><span className="text-right text-white/74">{selectedTime || "Alege ora"}</span></div>
          {estimate && <div className="mt-3 flex justify-between gap-4"><span className="text-white/35">Estimare</span><span className="text-right font-semibold text-[#d2ad62]">{estimate} lei</span></div>}
        </div>

        <button type="button" disabled={!selectedDay || !selectedTime} onClick={() => setSent(true)} className="mt-6 w-full rounded-full bg-[#d2ad62] px-6 py-4 text-sm font-bold text-black transition enabled:hover:bg-[#e4c37a] disabled:cursor-not-allowed disabled:opacity-35">
          {sent ? "Cerere pregătită ✓" : "Solicită programarea"}
        </button>
        <p className="mt-4 text-[10px] leading-5 text-white/28">Demo interactiv. În producție, sloturile și trimiterea cererii se conectează la modulul Calendar / Leads ORBYVEN.</p>
      </aside>
    </div>
  );
}
