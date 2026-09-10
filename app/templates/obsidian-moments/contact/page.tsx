"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import LiveAvailabilityCalendar from "./LiveAvailabilityCalendar";

const phoneHref = "tel:0729753760";
const whatsappBase = "https://wa.me/40729753760";
const eventTypes = ["Nuntă", "Botez", "Aniversare", "Corporate", "Alt eveniment"];
const serviceTypes = ["Platformă 360°", "Oglindă Foto", "Efecte Speciale", "Pachet complet", "Nu sunt sigur încă"];

type FormState = {
  name: string;
  email: string;
  phone: string;
  date: string;
  location: string;
  event: string;
  service: string;
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
    service: "Platformă 360°",
    message: "",
  });

  const ready = Boolean(form.name.trim() && form.date && (form.email.trim() || form.phone.trim()));
  const setField = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const whatsappHref = useMemo(() => {
    const text = [
      "Salut! Aș vrea să verific / rezerv disponibilitatea Obsidian Moments 360.",
      "",
      `Nume: ${form.name || "-"}`,
      `Data: ${form.date || "-"}`,
      `Eveniment: ${form.event}`,
      `Locație: ${form.location || "-"}`,
      `Serviciu: ${form.service}`,
      `Telefon: ${form.phone || "-"}`,
      `Email: ${form.email || "-"}`,
      form.message ? `Detalii: ${form.message}` : "",
    ].filter(Boolean).join("\n");
    return `${whatsappBase}?text=${encodeURIComponent(text)}`;
  }, [form]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090909] text-[#f5f1e7]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif" }}>
      <header className="sticky top-0 z-50 border-b border-[#d8b438]/10 bg-[#090909]/88 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-9">
          <Link href="/templates/obsidian-moments" className="flex items-center gap-3">
            <Image src="/obsidian/mark.svg" alt="Obsidian Moments" width={44} height={44} className="h-11 w-11 rounded-full" />
            <div>
              <p className="text-[13px] font-semibold tracking-[-0.035em]">Obsidian Moments 360</p>
              <p className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.2em] text-[#d8b438]/62">contact & disponibilitate</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-[10px] font-semibold text-white/45 md:flex">
            <Link href="/templates/obsidian-moments" className="transition hover:text-[#e4c34f]">Acasă</Link>
            <Link href="/templates/obsidian-moments#servicii" className="transition hover:text-[#e4c34f]">Servicii</Link>
            <Link href="/templates/obsidian-moments/preturi" className="transition hover:text-[#e4c34f]">Prețuri</Link>
            <span className="text-[#e4c34f]">Contact</span>
          </nav>
          <a href={phoneHref} className="rounded-full bg-[#d8b438] px-4 py-2.5 text-[10px] font-bold text-[#111] sm:px-5">Sună</a>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-12 pt-14 sm:px-6 md:px-9 md:pb-18 md:pt-22">
        <div aria-hidden="true" className="absolute inset-x-0 top-[-45%] h-[760px] bg-[radial-gradient(circle_at_60%_50%,rgba(216,180,56,.15),transparent_48%)]" />
        <div className="relative mx-auto max-w-[1480px]">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-[#d8b438]">Disponibilitate live</p>
            <span className="rounded-full border border-[#d8b438]/18 bg-[#d8b438]/[0.05] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-[#dfc156]">ORBYVEN Calendar</span>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mt-5 max-w-5xl text-[clamp(54px,8vw,112px)] font-semibold leading-[0.88] tracking-[-0.072em]">
            Alegi ziua.<br /><span className="text-[#d8b438]">Vezi dacă e liberă.</span>
          </motion.h1>
          <p className="mt-6 max-w-xl text-[13px] leading-6 text-white/48">Calendarul verifică instant rezervările firmei. Dacă ziua este liberă, continui direct cu cererea.</p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 md:px-9 md:pb-28">
        <div className="mx-auto grid max-w-[1480px] gap-3 lg:grid-cols-[.72fr_1.28fr]">
          <div className="grid gap-3 self-start">
            <ContactCard hero="TEL" label="Telefon" value="0729 753 760" href={phoneHref} />
            <ContactCard hero="WA" label="WhatsApp" value="Rezervare rapidă" href={whatsappBase} external />
            <div className="relative overflow-hidden rounded-[24px] border border-[#d8b438]/10 bg-[#101010] p-6">
              <div aria-hidden="true" className="absolute -right-3 bottom-[-16px] text-[64px] font-black leading-none tracking-[-0.08em] text-[#d8b438]/[0.045]">MAIL</div>
              <p className="relative text-[8px] font-bold uppercase tracking-[0.19em] text-[#d8b438]/58">Răspuns pe email</p>
              <p className="relative mt-4 max-w-sm text-[20px] font-semibold leading-[1.05] tracking-[-0.045em]">Lasă emailul în cerere pentru răspuns și confirmare.</p>
            </div>
            <div className="relative overflow-hidden rounded-[24px] border border-[#d8b438]/14 bg-[#15130d] p-6">
              <div aria-hidden="true" className="absolute -right-4 bottom-[-16px] text-[64px] font-black leading-none tracking-[-0.08em] text-[#d8b438]/[0.07]">LIVE</div>
              <p className="relative text-[8px] font-bold uppercase tracking-[0.19em] text-[#d8b438]/68">Calendar sincronizat</p>
              <p className="relative mt-4 max-w-sm text-[20px] font-semibold leading-[1.05] tracking-[-0.045em]">Publicul vede doar liber / ocupat. Detaliile evenimentelor rămân private.</p>
            </div>
          </div>

          <div id="disponibilitate" className="rounded-[30px] border border-[#d8b438]/12 bg-[#0f0f0f] p-5 sm:p-7 md:p-9">
            <div className="flex flex-col gap-3 border-b border-[#d8b438]/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.19em] text-[#d8b438]/62">Verificare disponibilitate</p>
                <h2 className="mt-3 text-[31px] font-semibold tracking-[-0.055em] sm:text-[40px]">Alege data evenimentului.</h2>
              </div>
              <span className="w-fit rounded-full border border-[#d8b438]/20 bg-[#d8b438]/[0.08] px-3 py-2 text-[8px] font-semibold text-[#e8cb68]">calendar live</span>
            </div>

            <div className="mt-6">
              <LiveAvailabilityCalendar selectedDate={form.date} onSelect={(date) => setField("date", date)} />
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-[18px] border border-[#d8b438]/10 bg-[#d8b438]/[0.035] px-4 py-3.5">
              <div>
                <p className="text-[7px] font-bold uppercase tracking-[0.18em] text-white/28">Data selectată</p>
                <p className="mt-1.5 text-[15px] font-semibold tracking-[-0.035em] text-[#ead06d]">{displayDate(form.date)}</p>
              </div>
              {form.date && <button type="button" onClick={() => setField("date", "")} className="text-[8px] font-semibold text-white/32 transition hover:text-white">Schimbă</button>}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Nume" value={form.name} onChange={(value) => setField("name", value)} placeholder="Numele tău" required />
              <Field label="Email" value={form.email} onChange={(value) => setField("email", value)} placeholder="nume@email.ro" type="email" />
              <Field label="Telefon" value={form.phone} onChange={(value) => setField("phone", value)} placeholder="07xx xxx xxx" type="tel" />
              <Field label="Locație" value={form.location} onChange={(value) => setField("location", value)} placeholder="București / locație" />
              <SelectField label="Tip eveniment" value={form.event} onChange={(value) => setField("event", value)} options={eventTypes} />
            </div>

            <div className="mt-5">
              <p className="mb-3 text-[8px] font-bold uppercase tracking-[0.18em] text-white/32">Ce te interesează?</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {serviceTypes.map((service) => (
                  <button key={service} type="button" onClick={() => setField("service", service)} className={`rounded-[16px] border px-4 py-3 text-left text-[10px] font-semibold transition ${form.service === service ? "border-[#d8b438]/45 bg-[#d8b438]/10 text-[#efd77a]" : "border-white/[0.07] bg-black/25 text-white/48 hover:border-[#d8b438]/20"}`}>
                    <span className="mr-2 text-[#d8b438]">{form.service === service ? "●" : "○"}</span>{service}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/32">Detalii opționale</label>
              <textarea value={form.message} onChange={(event) => setField("message", event.target.value)} placeholder="Număr invitați, interval, întrebări..." className="mt-3 min-h-28 w-full resize-none rounded-[18px] border border-white/[0.07] bg-black/30 px-4 py-4 text-[11px] text-white outline-none placeholder:text-white/24 focus:border-[#d8b438]/35" />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href={ready ? whatsappHref : undefined} target={ready ? "_blank" : undefined} rel={ready ? "noreferrer" : undefined} aria-disabled={!ready} className={`inline-flex min-h-13 flex-1 items-center justify-center rounded-full px-6 py-4 text-[11px] font-bold transition ${ready ? "bg-[#d8b438] text-[#111] shadow-[0_12px_32px_rgba(216,180,56,.14)] hover:-translate-y-0.5" : "cursor-not-allowed bg-white/[0.06] text-white/24"}`}>
                Trimite cererea pentru data asta →
              </a>
              <a href={phoneHref} className="inline-flex min-h-13 items-center justify-center rounded-full border border-[#d8b438]/18 px-6 py-4 text-[11px] font-bold text-[#e5c963]">Prefer să sun</a>
            </div>
            <p className="mt-4 text-center text-[8px] leading-4 text-white/28">Statusul live vine din Calendarul ORBYVEN al firmei. Confirmarea finală a rezervării este făcută de echipă.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d8b438]/10 px-4 py-7 sm:px-6 md:px-9">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 text-[9px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>Obsidian Moments 360 · Contact</span>
          <div className="flex gap-5"><Link href="/templates/obsidian-moments">Acasă</Link><Link href="/templates/obsidian-moments/preturi">Prețuri</Link><a href={phoneHref}>Sună</a><a href={whatsappBase} target="_blank" rel="noreferrer">WhatsApp</a></div>
        </div>
      </footer>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return <label><span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/32">{label}{required ? " *" : ""}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2.5 min-h-13 w-full rounded-[16px] border border-white/[0.07] bg-black/30 px-4 py-3.5 text-[11px] text-white outline-none placeholder:text-white/24 focus:border-[#d8b438]/35" /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label><span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/32">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2.5 min-h-13 w-full rounded-[16px] border border-white/[0.07] bg-[#0b0b0b] px-4 py-3.5 text-[11px] text-white outline-none focus:border-[#d8b438]/35">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function ContactCard({ hero, label, value, href, external = false }: { hero: string; label: string; value: string; href: string; external?: boolean }) {
  return <motion.a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} whileHover={{ x: 5 }} className="group relative min-h-[126px] overflow-hidden rounded-[24px] border border-[#d8b438]/10 bg-[#101010] p-6"><div aria-hidden="true" className="absolute -right-2 bottom-[-14px] text-[62px] font-black leading-none tracking-[-0.08em] text-[#d8b438]/[0.045] transition group-hover:text-[#d8b438]/[0.09]">{hero}</div><p className="relative text-[8px] font-bold uppercase tracking-[0.19em] text-[#d8b438]/58">{label}</p><p className="relative mt-5 text-[22px] font-semibold tracking-[-0.045em]">{value}</p></motion.a>;
}
