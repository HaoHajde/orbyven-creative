"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import LiveAvailabilityCalendar from "./LiveAvailabilityCalendar";

const phoneHref = "tel:0729753760";
const whatsappBase = "https://wa.me/40729753760";
const eventTypes = ["Nuntă", "Botez", "Aniversare", "Corporate", "Alt eveniment"];
const coreServices = ["Platformă 360°", "Oglindă Foto", "Efecte Speciale"];
const serviceOptions = [...coreServices, "Pachet complet", "Nu sunt sigur încă"];

type FormState = {
  name: string;
  email: string;
  phone: string;
  date: string;
  location: string;
  event: string;
  message: string;
};

function displayDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "Alege data din calendar";
  return `${match[3]}.${match[2]}.${match[1]}`;
}

export default function ObsidianContactPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    date: "",
    location: "",
    event: "Nuntă",
    message: "",
  });
  const [services, setServices] = useState<string[]>(["Platformă 360°"]);

  const ready = Boolean(
    form.name.trim() && form.date && (form.email.trim() || form.phone.trim()) && services.length
  );

  const setField = (field: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const fullPackageSelected = coreServices.every((service) => services.includes(service));

  const toggleService = (service: string) => {
    if (service === "Nu sunt sigur încă") {
      setServices((current) => current.length === 1 && current[0] === service ? [] : [service]);
      return;
    }

    if (service === "Pachet complet") {
      setServices((current) =>
        coreServices.every((item) => current.includes(item)) ? [] : [...coreServices]
      );
      return;
    }

    setServices((current) => {
      const withoutUnsure = current.filter((item) => item !== "Nu sunt sigur încă");
      return withoutUnsure.includes(service)
        ? withoutUnsure.filter((item) => item !== service)
        : [...withoutUnsure, service];
    });
  };

  const isServiceSelected = (service: string) => {
    if (service === "Pachet complet") return fullPackageSelected;
    return services.includes(service);
  };

  const whatsappHref = useMemo(() => {
    const text = [
      "Salut! Aș vrea să verific / rezerv disponibilitatea Obsidian Moments 360.",
      "",
      `Nume: ${form.name || "-"}`,
      `Data: ${form.date || "-"}`,
      `Eveniment: ${form.event}`,
      `Locație: ${form.location || "-"}`,
      `Servicii: ${services.length ? services.join(", ") : "-"}`,
      `Telefon: ${form.phone || "-"}`,
      `Email: ${form.email || "-"}`,
      form.message ? `Detalii: ${form.message}` : "",
    ].filter(Boolean).join("\n");
    return `${whatsappBase}?text=${encodeURIComponent(text)}`;
  }, [form, services]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0b0b0b] text-[#f5f1e7]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif" }}>
      <header className="sticky top-0 z-50 border-b border-[#d8b438]/12 bg-[#0b0b0b]/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-9">
          <Link href="/templates/obsidian-moments" className="flex items-center gap-3">
            <Image src="/obsidian/mark.svg" alt="Obsidian Moments" width={44} height={44} className="h-11 w-11 rounded-full" />
            <div className="hidden sm:block">
              <p className="text-[13px] font-semibold tracking-[-0.035em]">Obsidian Moments 360</p>
              <p className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.2em] text-[#d8b438]/62">contact & disponibilitate</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-[10px] font-semibold text-white/45 md:flex">
            <Link href="/templates/obsidian-moments">Acasă</Link>
            <Link href="/templates/obsidian-moments#servicii">Servicii</Link>
            <Link href="/templates/obsidian-moments/preturi">Prețuri</Link>
            <span className="text-[#e4c34f]">Contact</span>
          </nav>
          <a href={phoneHref} className="rounded-full bg-[#d8b438] px-4 py-2.5 text-[10px] font-bold text-[#111]">Sună</a>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-10 pt-12 sm:px-6 md:px-9 md:pb-14 md:pt-20">
        <div aria-hidden="true" className="absolute inset-x-0 top-[-55%] h-[760px] bg-[radial-gradient(circle_at_60%_50%,rgba(216,180,56,.18),transparent_48%)]" />
        <div className="relative mx-auto max-w-[1480px]">
          <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-[#d8b438]">Disponibilitate live</p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mt-5 max-w-5xl text-[clamp(50px,8vw,108px)] font-semibold leading-[0.89] tracking-[-0.07em]">
            Alegi ziua.<br /><span className="text-[#d8b438]">Noi verificăm restul.</span>
          </motion.h1>
          <p className="mt-5 max-w-xl text-[13px] leading-6 text-white/50">Alege data, serviciile care te interesează și trimite cererea direct pe WhatsApp.</p>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 md:px-9 md:pb-20">
        <div className="mx-auto grid max-w-[1480px] gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="grid gap-3 self-start">
            <ContactCard label="Telefon" value="0729 753 760" href={phoneHref} />
            <ContactCard label="WhatsApp" value="Rezervare rapidă" href={whatsappBase} external />
            <div className="rounded-[24px] border border-[#d8b438]/14 bg-[#14120d] p-5">
              <p className="text-[8px] font-bold uppercase tracking-[0.19em] text-[#d8b438]/68">Simplu și privat</p>
              <p className="mt-3 text-[18px] font-semibold leading-[1.08] tracking-[-0.04em]">Calendarul arată doar liber / ocupat. Detaliile evenimentelor rămân private.</p>
            </div>
          </aside>

          <div id="disponibilitate" className="rounded-[30px] border border-[#d8b438]/14 bg-[#111] p-5 sm:p-7 md:p-9">
            <div className="flex flex-col gap-2 border-b border-[#d8b438]/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.19em] text-[#d8b438]/62">Verificare disponibilitate</p>
                <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.055em] sm:text-[40px]">Alege data evenimentului.</h2>
              </div>
              <span className="w-fit rounded-full border border-[#d8b438]/20 bg-[#d8b438]/[0.08] px-3 py-2 text-[8px] font-semibold text-[#e8cb68]">calendar live</span>
            </div>

            <div className="mt-5"><LiveAvailabilityCalendar selectedDate={form.date} onSelect={(date) => setField("date", date)} /></div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-[18px] border border-[#d8b438]/12 bg-[#d8b438]/[0.045] px-4 py-3.5">
              <div><p className="text-[7px] font-bold uppercase tracking-[0.18em] text-white/30">Data selectată</p><p className="mt-1.5 text-[15px] font-semibold text-[#ead06d]">{displayDate(form.date)}</p></div>
              {form.date ? <button type="button" onClick={() => setField("date", "")} className="text-[8px] font-semibold text-white/40">Schimbă</button> : null}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Nume" value={form.name} onChange={(value) => setField("name", value)} placeholder="Numele tău" required />
              <Field label="Email" value={form.email} onChange={(value) => setField("email", value)} placeholder="nume@email.ro" type="email" />
              <Field label="Telefon" value={form.phone} onChange={(value) => setField("phone", value)} placeholder="07xx xxx xxx" type="tel" />
              <Field label="Locație" value={form.location} onChange={(value) => setField("location", value)} placeholder="București / locație" />
              <SelectField label="Tip eveniment" value={form.event} onChange={(value) => setField("event", value)} options={eventTypes} />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3"><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/35">Ce te interesează?</p><span className="text-[8px] text-[#d8b438]/68">poți alege mai multe</span></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {serviceOptions.map((service) => {
                  const selected = isServiceSelected(service);
                  return (
                    <button key={service} type="button" onClick={() => toggleService(service)} aria-pressed={selected} className={`rounded-[16px] border px-4 py-3 text-left text-[10px] font-semibold transition ${selected ? "border-[#d8b438]/55 bg-[#d8b438]/12 text-[#efd77a]" : "border-white/[0.08] bg-black/25 text-white/50 hover:border-[#d8b438]/24"}`}>
                      <span className="mr-2 text-[#d8b438]">{selected ? "●" : "○"}</span>{service}
                    </button>
                  );
                })}
              </div>
              {services.length ? <p className="mt-3 text-[9px] text-white/35">Selectat: {services.join(" · ")}</p> : null}
            </div>

            <div className="mt-5">
              <label className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/35">Detalii opționale</label>
              <textarea value={form.message} onChange={(event) => setField("message", event.target.value)} placeholder="Număr invitați, interval, întrebări..." className="mt-3 min-h-28 w-full resize-none rounded-[18px] border border-white/[0.08] bg-black/30 px-4 py-4 text-[11px] text-white outline-none placeholder:text-white/25 focus:border-[#d8b438]/40" />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href={ready ? whatsappHref : undefined} target={ready ? "_blank" : undefined} rel={ready ? "noreferrer" : undefined} aria-disabled={!ready} className={`inline-flex min-h-13 flex-1 items-center justify-center rounded-full px-6 py-4 text-[11px] font-bold transition ${ready ? "bg-[#d8b438] text-[#111] shadow-[0_12px_32px_rgba(216,180,56,.15)] hover:-translate-y-0.5" : "cursor-not-allowed bg-white/[0.06] text-white/25"}`}>
                Trimite cererea →
              </a>
              <a href={phoneHref} className="inline-flex min-h-13 items-center justify-center rounded-full border border-[#d8b438]/20 px-6 py-4 text-[11px] font-bold text-[#e5c963]">Prefer să sun</a>
            </div>
            {!ready ? <p className="mt-3 text-center text-[8px] leading-4 text-white/30">Completează numele, data, cel puțin un contact și un serviciu.</p> : null}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d8b438]/10 px-4 py-7 sm:px-6 md:px-9">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 text-[9px] text-white/30 sm:flex-row sm:items-center sm:justify-between"><span>Obsidian Moments 360 · Contact</span><div className="flex gap-5"><Link href="/templates/obsidian-moments">Acasă</Link><Link href="/templates/obsidian-moments/preturi">Prețuri</Link><a href={phoneHref}>Sună</a></div></div>
      </footer>
    </main>
  );
}

function ContactCard({ label, value, href, external = false }: { label: string; value: string; href: string; external?: boolean }) {
  return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="rounded-[24px] border border-[#d8b438]/12 bg-[#101010] p-5 transition hover:border-[#d8b438]/30"><p className="text-[8px] font-bold uppercase tracking-[0.19em] text-[#d8b438]/60">{label}</p><p className="mt-3 text-[20px] font-semibold tracking-[-0.04em]">{value}</p></a>;
}

function Field({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return <label><span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/35">{label}{required ? " *" : ""}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2.5 min-h-13 w-full rounded-[16px] border border-white/[0.08] bg-black/30 px-4 py-3.5 text-[11px] text-white outline-none placeholder:text-white/25 focus:border-[#d8b438]/40" /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label><span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/35">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2.5 min-h-13 w-full rounded-[16px] border border-white/[0.08] bg-black/30 px-4 py-3.5 text-[11px] text-white outline-none focus:border-[#d8b438]/40">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
