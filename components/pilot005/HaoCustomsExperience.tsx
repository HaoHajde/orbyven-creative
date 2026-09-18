"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

export const haoImages = {
  hero: "https://images.unsplash.com/photo-1746593934498-b335e4e04845?auto=format&fit=crop&w=1800&q=76",
  exteriorBefore: "https://images.unsplash.com/photo-1761312834150-4beefff097a7?auto=format&fit=crop&w=1600&q=72",
  exteriorAfter: "https://images.unsplash.com/photo-1746593934498-b335e4e04845?auto=format&fit=crop&w=1600&q=74",
  interiorBefore: "https://images.unsplash.com/photo-1770936450010-6837d6933caa?auto=format&fit=crop&w=1500&q=72",
  interiorAfter: "https://images.pexels.com/photos/36806220/pexels-photo-36806220/free-photo-of-luxurious-black-car-interior-with-sunlit-detailing.jpeg?auto=compress&dpr=1&w=1500",
  glossAfter: "https://images.unsplash.com/photo-1655811937291-35ccc59036f6?auto=format&fit=crop&w=1600&q=74",
};

const navItems = [
  { href: "/templates/haos-customs", label: "Acasă", meta: "01" },
  { href: "/templates/haos-customs/galerie", label: "Galerie", meta: "02" },
  { href: "/templates/haos-customs/preturi", label: "Prețuri", meta: "03" },
  { href: "/templates/haos-customs/contact", label: "Contact", meta: "04" },
];

const activeMap = {
  home: 0,
  gallery: 1,
  pricing: 2,
  contact: 3,
} as const;

export function HaoShell({
  children,
  active,
}: {
  children: ReactNode;
  active: keyof typeof activeMap;
}) {
  const [open, setOpen] = useState(false);

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#050505] text-[#f6f1e7] selection:bg-[#caa45b] selection:text-black"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif" }}
    >
      <div className="relative z-[70] border-b border-white/[.07] bg-[#050505]/95 px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/34 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#caa45b] shadow-[0_0_16px_rgba(202,164,91,.65)]" />Pilot #005 · ORBYVEN</span>
          <Link href="/templates" className="transition hover:text-[#d9bc82]">Template library ↗</Link>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed left-3 top-14 z-[95] flex h-12 items-center gap-2 rounded-full border border-[#d9bc82]/24 bg-black/62 px-3.5 text-[#d9bc82] shadow-[0_16px_55px_rgba(0,0,0,.45)] backdrop-blur-2xl transition hover:border-[#d9bc82]/55 sm:left-5 sm:top-16"
        aria-label={open ? "Închide meniul" : "Deschide meniul"}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full border border-[#d9bc82]/24 text-[10px] font-black">{open ? "×" : "HC"}</span>
        <span className="hidden text-[9px] font-bold uppercase tracking-[.16em] sm:block">{open ? "Închide" : "Meniu"}</span>
      </button>

      <div
        className={`fixed inset-0 z-[80] transition duration-500 ${open ? "pointer-events-auto bg-black/62 backdrop-blur-[3px]" : "pointer-events-none bg-transparent"}`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-[90] flex w-[min(89vw,390px)] flex-col border-r border-white/[.08] bg-[#080808]/94 px-6 pb-7 pt-24 shadow-[35px_0_110px_rgba(0,0,0,.62)] backdrop-blur-2xl transition-transform duration-500 will-change-transform ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[.24em] text-[#caa45b]">Hao&apos;s Customs</p>
          <h2 className="mt-4 text-[44px] font-semibold leading-[.88] tracking-[-.065em] text-white">Detailing.<br />Fără zgomot.</h2>
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/40">Navigație ascunsă, focus pe imagine și acțiuni scurte. Exact cât trebuie pentru mobil.</p>
        </div>

        <nav className="mt-9 border-t border-white/[.08]">
          {navItems.map((item, index) => {
            const isActive = activeMap[active] === index;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center justify-between border-b border-white/[.08] py-5 transition ${isActive ? "text-[#d9bc82]" : "text-white/55 hover:text-white"}`}
              >
                <span className="text-[17px] font-medium tracking-[-.02em]">{item.label}</span>
                <span className={`text-[9px] font-bold ${isActive ? "text-[#d9bc82]" : "text-white/18 group-hover:text-white/36"}`}>{item.meta}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[24px] border border-[#d9bc82]/14 bg-[linear-gradient(135deg,rgba(217,188,130,.10),rgba(255,255,255,.015))] p-5">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#d9bc82]">Smart booking</p>
            <span className="h-2 w-2 rounded-full bg-emerald-400/80 shadow-[0_0_14px_rgba(52,211,153,.55)]" />
          </div>
          <p className="mt-3 text-sm leading-6 text-white/52">Configurezi serviciul, păstrezi estimarea și alegi un slot disponibil.</p>
          <Link href="/templates/haos-customs/preturi" className="mt-5 inline-flex rounded-full bg-[#d9bc82] px-5 py-3 text-[12px] font-bold text-black transition hover:bg-[#e7ca92]">Începe configurarea →</Link>
        </div>
      </aside>

      {children}
    </main>
  );
}

export function HeroSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current || event.pointerType === "touch") return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--x", `${event.clientX - rect.left}px`);
    ref.current.style.setProperty("--y", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      aria-hidden="true"
      className="pointer-events-auto absolute inset-0 hidden md:block"
      style={{
        background: "radial-gradient(420px circle at var(--x,72%) var(--y,32%), rgba(216,183,116,.13), transparent 58%)",
      } as CSSProperties}
    />
  );
}

export function BeforeAfter({
  beforeImage,
  afterImage,
  title,
  subtitle,
  note,
}: {
  beforeImage: string;
  afterImage: string;
  title: string;
  subtitle: string;
  note?: string;
}) {
  const [position, setPosition] = useState(50);

  return (
    <article className="overflow-hidden rounded-[30px] border border-white/[.09] bg-[#0a0a0a] shadow-[0_28px_90px_rgba(0,0,0,.28)]">
      <div className="relative aspect-[4/3] min-h-[320px] overflow-hidden sm:aspect-[16/10]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.16),rgba(0,0,0,.28)),url("${beforeImage}")` }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,.02),rgba(0,0,0,.10)),url("${afterImage}")`,
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/12" />
        <div className="pointer-events-none absolute inset-y-0 w-px bg-white/90 shadow-[0_0_24px_rgba(255,255,255,.45)]" style={{ left: `${position}%` }}>
          <div className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/28 bg-black/72 text-[13px] text-[#e0c58f] shadow-[0_8px_30px_rgba(0,0,0,.35)] backdrop-blur-xl">↔</div>
        </div>

        <input
          aria-label={`Compară înainte și după pentru ${title}`}
          type="range"
          min="6"
          max="94"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
        />

        <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/12 bg-black/58 px-3 py-2 text-[8px] font-bold uppercase tracking-[.16em] text-white/65 backdrop-blur-xl">Înainte</span>
        <span className="pointer-events-none absolute right-4 top-4 rounded-full border border-[#d9bc82]/24 bg-black/58 px-3 py-2 text-[8px] font-bold uppercase tracking-[.16em] text-[#e2c991] backdrop-blur-xl">După</span>

        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-full border border-white/[.08] bg-black/46 px-4 py-2.5 text-[8px] uppercase tracking-[.13em] text-white/40 backdrop-blur-xl">
          <span>trage sliderul</span><span>{position}%</span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-5 p-5 sm:p-6">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[.17em] text-[#caa45b]">{subtitle}</p>
          <h3 className="mt-2 text-[27px] font-semibold tracking-[-.048em] text-white">{title}</h3>
          {note && <p className="mt-2 max-w-xl text-[11px] leading-5 text-white/34">{note}</p>}
        </div>
        <span className="hidden rounded-full border border-white/[.08] px-3 py-2 text-[8px] uppercase tracking-[.14em] text-white/28 sm:block">interactive</span>
      </div>
    </article>
  );
}

const vehicleOptions = [
  { id: "compact", label: "Compact / sedan", add: 0, tag: "S" },
  { id: "suv", label: "SUV / crossover", add: 120, tag: "M" },
  { id: "premium", label: "Premium / sport", add: 180, tag: "P" },
  { id: "large", label: "7 locuri / van", add: 240, tag: "L" },
];

const packageOptions = [
  { id: "interior", label: "Interior Deep", price: 449, copy: "aspirare, textile, plastice, geamuri, finisaj" },
  { id: "exterior", label: "Exterior Reset", price: 549, copy: "prespălare, decontaminare, jante, protecție" },
  { id: "full", label: "Signature Full", price: 899, copy: "interior + exterior, finisaj complet" },
];

const conditionOptions = [
  { id: "maintained", label: "Întreținută", add: 0, copy: "murdărie normală, întreținere periodică" },
  { id: "used", label: "Utilizare intensă", add: 140, copy: "pete, păr de animale, murdărie persistentă" },
  { id: "restore", label: "Necesită restaurare", add: 280, copy: "stare dificilă, timp suplimentar de lucru" },
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
  const [condition, setCondition] = useState("maintained");
  const [selectedExtras, setSelectedExtras] = useState<string[]>(["ozone"]);

  const total = useMemo(() => {
    const vehicleAdd = vehicleOptions.find((item) => item.id === vehicle)?.add ?? 0;
    const packagePrice = packageOptions.find((item) => item.id === pack)?.price ?? 0;
    const conditionAdd = conditionOptions.find((item) => item.id === condition)?.add ?? 0;
    const extrasPrice = selectedExtras.reduce((sum, id) => sum + (extras.find((item) => item.id === id)?.price ?? 0), 0);
    return packagePrice + vehicleAdd + conditionAdd + extrasPrice;
  }, [vehicle, pack, condition, selectedExtras]);

  const toggleExtra = (id: string) => {
    setSelectedExtras((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const continueToBooking = () => {
    const payload = {
      vehicle: vehicleOptions.find((item) => item.id === vehicle)?.label,
      package: packageOptions.find((item) => item.id === pack)?.label,
      condition: conditionOptions.find((item) => item.id === condition)?.label,
      extras: selectedExtras.map((id) => extras.find((item) => item.id === id)?.label).filter(Boolean),
      total,
    };
    window.sessionStorage.setItem("haos-customs-estimate", JSON.stringify(payload));
    window.location.assign(`/templates/haos-customs/contact?estimate=${total}`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <div className="space-y-4">
        <ConfigSection step="01" title="Tipul mașinii">
          <div className="grid gap-2 sm:grid-cols-2">
            {vehicleOptions.map((item) => (
              <button key={item.id} type="button" onClick={() => setVehicle(item.id)} className={`group flex items-center justify-between rounded-[18px] border p-4 text-left transition ${vehicle === item.id ? "border-[#d9bc82]/50 bg-[#d9bc82]/10" : "border-white/[.08] bg-white/[.018] hover:border-white/[.16]"}`}>
                <div><p className="text-sm font-semibold text-white">{item.label}</p><p className="mt-1.5 text-[10px] text-white/32">{item.add ? `+${item.add} lei` : "bază inclusă"}</p></div>
                <span className={`grid h-8 w-8 place-items-center rounded-full border text-[10px] font-bold ${vehicle === item.id ? "border-[#d9bc82]/45 bg-[#d9bc82] text-black" : "border-white/10 text-white/28"}`}>{item.tag}</span>
              </button>
            ))}
          </div>
        </ConfigSection>

        <ConfigSection step="02" title="Nivelul de detailing">
          <div className="grid gap-2">
            {packageOptions.map((item) => (
              <button key={item.id} type="button" onClick={() => setPack(item.id)} className={`flex items-center justify-between gap-5 rounded-[18px] border p-4 text-left transition sm:p-5 ${pack === item.id ? "border-[#d9bc82]/50 bg-[#d9bc82]/10" : "border-white/[.08] bg-white/[.018] hover:border-white/[.16]"}`}>
                <div><p className="text-sm font-semibold text-white">{item.label}</p><p className="mt-2 text-[11px] leading-5 text-white/34">{item.copy}</p></div>
                <span className="shrink-0 text-[18px] font-semibold tracking-[-.04em] text-[#d9bc82]">{item.price} lei</span>
              </button>
            ))}
          </div>
        </ConfigSection>

        <ConfigSection step="03" title="Starea actuală">
          <div className="grid gap-2 md:grid-cols-3">
            {conditionOptions.map((item) => (
              <button key={item.id} type="button" onClick={() => setCondition(item.id)} className={`rounded-[18px] border p-4 text-left transition ${condition === item.id ? "border-[#d9bc82]/50 bg-[#d9bc82]/10" : "border-white/[.08] bg-white/[.018] hover:border-white/[.16]"}`}>
                <p className="text-[13px] font-semibold text-white">{item.label}</p>
                <p className="mt-2 text-[10px] leading-5 text-white/32">{item.copy}</p>
                <p className="mt-4 text-[10px] font-semibold text-[#d9bc82]">{item.add ? `+${item.add} lei` : "fără supliment"}</p>
              </button>
            ))}
          </div>
        </ConfigSection>

        <ConfigSection step="04" title="Upgrade-uri">
          <div className="grid gap-2 sm:grid-cols-2">
            {extras.map((item) => {
              const selected = selectedExtras.includes(item.id);
              return (
                <button key={item.id} type="button" onClick={() => toggleExtra(item.id)} className={`flex items-center justify-between gap-3 rounded-[18px] border p-4 text-left transition ${selected ? "border-[#d9bc82]/48 bg-[#d9bc82]/9" : "border-white/[.08] bg-white/[.018] hover:border-white/[.16]"}`}>
                  <div><p className="text-[13px] font-semibold text-white">{item.label}</p><p className="mt-1 text-[10px] text-white/32">+{item.price} lei</p></div>
                  <span className={`grid h-7 w-7 place-items-center rounded-full border text-[10px] ${selected ? "border-[#d9bc82] bg-[#d9bc82] text-black" : "border-white/[.14] text-transparent"}`}>✓</span>
                </button>
              );
            })}
          </div>
        </ConfigSection>
      </div>

      <aside className="h-fit overflow-hidden rounded-[30px] border border-[#d9bc82]/18 bg-[radial-gradient(circle_at_85%_5%,rgba(217,188,130,.14),transparent_31%),#0a0a0a] lg:sticky lg:top-6">
        <div className="border-b border-white/[.08] p-6 sm:p-8">
          <div className="flex items-center justify-between"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d9bc82]">Estimare live</p><span className="rounded-full border border-emerald-400/20 bg-emerald-400/8 px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[.12em] text-emerald-300">actualizat</span></div>
          <div className="mt-7 flex items-end gap-2">
            <span className="text-[clamp(64px,10vw,102px)] font-semibold leading-none tracking-[-.08em] text-white">{total}</span>
            <span className="pb-2 text-sm text-white/36">lei</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/38">Estimare orientativă bazată pe selecțiile de mai sus. Confirmarea finală se face după evaluarea mașinii.</p>
        </div>

        <div className="space-y-3 p-6 text-[12px] sm:p-8">
          <SummaryLine label="Mașină" value={vehicleOptions.find((item) => item.id === vehicle)?.label ?? ""} />
          <SummaryLine label="Pachet" value={packageOptions.find((item) => item.id === pack)?.label ?? ""} />
          <SummaryLine label="Stare" value={conditionOptions.find((item) => item.id === condition)?.label ?? ""} />
          <SummaryLine label="Upgrade-uri" value={selectedExtras.length ? `${selectedExtras.length} selectate` : "niciunul"} />
          <div className="pt-4">
            <button type="button" onClick={continueToBooking} className="flex w-full items-center justify-between rounded-full bg-[#d9bc82] px-6 py-4 text-sm font-bold text-black transition hover:bg-[#e7ca92]">
              <span>Continuă la programare</span><span>→</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ConfigSection({ step, title, children }: { step: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/[.08] bg-white/[.025] p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#caa45b]">{step}</p>
        <p className="text-[13px] font-semibold tracking-[-.02em] text-white/72">{title}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-5 border-b border-white/[.07] pb-3"><span className="text-white/30">{label}</span><span className="max-w-[62%] text-right font-medium text-white/72">{value}</span></div>;
}

type DayOption = { iso: string; weekday: string; date: string; full: string };

export function AvailabilityCalendar() {
  const [days, setDays] = useState<DayOption[]>([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [summary, setSummary] = useState<{ vehicle?: string; package?: string; condition?: string; extras?: string[]; total?: number } | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("ro-RO", { weekday: "short", day: "2-digit", month: "short" });
    const fullFormatter = new Intl.DateTimeFormat("ro-RO", { weekday: "long", day: "numeric", month: "long" });
    const nextDays = Array.from({ length: 14 }, (_, index) => {
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
    ["09:30", "14:00", "17:30"],
  ];
  const times = timeSets[selectedIndex % timeSets.length];
  const activeDay = days.find((day) => day.iso === selectedDay);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.08fr_.92fr]">
      <section className="rounded-[30px] border border-white/[.08] bg-white/[.025] p-5 sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#caa45b]">Disponibilitate</p><h2 className="mt-3 text-[34px] font-semibold tracking-[-.05em]">Alege un slot.</h2></div>
          <span className="hidden rounded-full border border-white/[.08] px-3 py-2 text-[8px] uppercase tracking-[.12em] text-white/28 sm:block">14 zile</span>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
          {days.map((day) => (
            <button key={day.iso} type="button" onClick={() => { setSelectedDay(day.iso); setSelectedTime(""); setSent(false); }} className={`rounded-[17px] border px-2 py-4 text-center transition ${selectedDay === day.iso ? "border-[#d9bc82]/55 bg-[#d9bc82]/11" : "border-white/[.07] bg-black/18 hover:border-white/[.14]"}`}>
              <span className="block text-[8px] uppercase tracking-[.12em] text-white/30">{day.weekday}</span>
              <span className="mt-2 block text-[12px] font-semibold text-white">{day.date}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 border-t border-white/[.08] pt-7">
          <div className="flex items-center justify-between"><p className="text-[9px] font-bold uppercase tracking-[.15em] text-white/30">Intervale disponibile</p><span className="text-[9px] text-emerald-300/72">● disponibil</span></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {times.map((time) => (
              <button key={time} type="button" onClick={() => { setSelectedTime(time); setSent(false); }} className={`rounded-full border px-5 py-3 text-[12px] font-semibold transition ${selectedTime === time ? "border-[#d9bc82] bg-[#d9bc82] text-black" : "border-white/[.09] bg-black/20 text-white/62 hover:border-white/[.18]"}`}>{time}</button>
            ))}
          </div>
        </div>
      </section>

      <aside className="overflow-hidden rounded-[30px] border border-[#d9bc82]/18 bg-[radial-gradient(circle_at_90%_0%,rgba(217,188,130,.12),transparent_28%),#0a0a0a]">
        <div className="border-b border-white/[.08] p-6 sm:p-7">
          <div className="flex items-center justify-between"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#d9bc82]">Rezervare</p><span className="text-[8px] uppercase tracking-[.12em] text-white/25">demo flow</span></div>
          {summary && (
            <div className="mt-5 rounded-[18px] border border-[#d9bc82]/12 bg-[#d9bc82]/7 p-4 text-[11px] leading-5 text-white/52">
              <p className="font-semibold text-white/78">{summary.package ?? "Configurație selectată"}</p>
              <p>{summary.vehicle}</p>
              {summary.condition && <p>{summary.condition}</p>}
              {!!summary.extras?.length && <p>{summary.extras.join(" · ")}</p>}
            </div>
          )}

          <div className="mt-5 grid gap-3">
            {["Nume", "Telefon", "Model mașină"].map((placeholder) => <input key={placeholder} aria-label={placeholder} placeholder={placeholder} className="h-12 rounded-[15px] border border-white/[.08] bg-white/[.025] px-4 text-sm text-white outline-none placeholder:text-white/22 focus:border-[#d9bc82]/45" />)}
            <textarea aria-label="Observații" placeholder="Observații despre starea mașinii..." rows={4} className="rounded-[15px] border border-white/[.08] bg-white/[.025] p-4 text-sm text-white outline-none placeholder:text-white/22 focus:border-[#d9bc82]/45" />
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <div className="space-y-3 text-[12px]">
            <SummaryLine label="Data" value={activeDay?.full ?? "Alege data"} />
            <SummaryLine label="Ora" value={selectedTime || "Alege ora"} />
            {estimate && <SummaryLine label="Estimare" value={`${estimate} lei`} />}
          </div>

          <button type="button" disabled={!selectedDay || !selectedTime} onClick={() => setSent(true)} className="mt-6 w-full rounded-full bg-[#d9bc82] px-6 py-4 text-sm font-bold text-black transition enabled:hover:bg-[#e7ca92] disabled:cursor-not-allowed disabled:opacity-35">
            {sent ? "Cerere pregătită ✓" : "Solicită programarea"}
          </button>
          <p className="mt-4 text-[10px] leading-5 text-white/24">În varianta clientului, acest pas se leagă direct de Calendar + Leads ORBYVEN.</p>
        </div>
      </aside>
    </div>
  );
}
