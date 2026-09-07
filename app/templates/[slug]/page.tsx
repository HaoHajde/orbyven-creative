import Link from "next/link";
import { notFound } from "next/navigation";

import { clientTemplateCatalog, type ClientTemplateSlug } from "@/lib/client-template-catalog";

export function generateStaticParams() {
  return Object.keys(clientTemplateCatalog).map((slug) => ({ slug }));
}

export default async function ClientTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = clientTemplateCatalog[slug as ClientTemplateSlug];

  if (!template) notFound();

  return (
    <main className="min-h-screen bg-white text-[#11121a]">
      <section className="relative overflow-hidden border-b border-black/[0.06]" style={{ background: template.surface }}>
        <div
          aria-hidden="true"
          className="absolute right-[-10%] top-[-25%] h-[620px] w-[620px] rounded-full blur-[130px]"
          style={{ background: template.accentSoft }}
        />

        <div className="relative mx-auto max-w-[1440px] px-6 pb-20 pt-6 md:px-10 md:pb-28">
          <header className="flex items-center justify-between rounded-full border border-black/[0.07] bg-white/85 px-5 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-full border-[6px]" style={{ borderColor: template.accent }} />
              <span className="font-semibold tracking-[-0.03em]">{template.title}</span>
            </div>
            <nav className="hidden gap-7 text-xs text-black/50 md:flex">
              <a href="#servicii">Servicii</a>
              <a href="#proces">Cum lucrăm</a>
              <a href="#contact">Contact</a>
            </nav>
            <a
              href="#contact"
              className="rounded-full px-5 py-2.5 text-xs font-semibold text-white"
              style={{ background: template.accent }}
            >
              {template.primaryAction}
            </a>
          </header>

          <div className="grid gap-14 pb-4 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-28">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: template.accent }}>
                {template.eyebrow}
              </p>
              <h1 className="mt-7 max-w-4xl text-[58px] font-semibold leading-[0.91] tracking-[-0.065em] sm:text-[76px] lg:text-[92px]">
                {template.heroTitle}
              </h1>
              <p className="mt-8 max-w-2xl text-[17px] leading-8 text-black/55">{template.heroCopy}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#contact" className="rounded-full px-6 py-3.5 text-sm font-semibold text-white" style={{ background: template.accent }}>
                  {template.primaryAction}
                </a>
                <a href="#servicii" className="rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-medium">
                  {template.secondaryAction}
                </a>
              </div>
            </div>

            <div className="rounded-[36px] border border-black/[0.06] bg-white/80 p-6 shadow-[0_35px_100px_rgba(0,0,0,0.08)] backdrop-blur-xl md:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">Servicii populare</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {template.services.map((service) => (
                  <div key={service.title} className="rounded-[22px] border border-black/[0.06] bg-white p-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm" style={{ background: template.accentSoft, color: template.accent }}>
                      {service.icon}
                    </div>
                    <h2 className="mt-5 text-base font-semibold tracking-[-0.03em]">{service.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-black/48">{service.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-[26px] border border-black/[0.06] bg-white/80">
            {template.stats.map((stat) => (
              <div key={stat.label} className="border-r border-black/[0.06] px-5 py-6 last:border-r-0 md:px-8">
                <p className="text-2xl font-semibold tracking-[-0.04em] md:text-3xl">{stat.value}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.15em] text-black/35 md:text-[10px]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="servicii" className="mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-32">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: template.accent }}>Servicii</p>
            <h2 className="mt-5 text-[48px] font-semibold leading-[0.96] tracking-[-0.055em] md:text-[68px]">Tot ce are nevoie clientul, fără zgomot.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {template.services.map((service, index) => (
              <article key={service.title} className="rounded-[28px] border border-black/[0.07] p-6 md:p-7">
                <div className="flex items-center justify-between">
                  <span className="text-2xl" style={{ color: template.accent }}>{service.icon}</span>
                  <span className="text-[10px] text-black/30">0{index + 1}</span>
                </div>
                <h3 className="mt-12 text-2xl font-semibold tracking-[-0.04em]">{service.title}</h3>
                <p className="mt-4 text-sm leading-6 text-black/50">{service.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proces" className="border-y border-black/[0.06]" style={{ background: template.surface }}>
        <div className="mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-32">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: template.accent }}>Cum lucrăm</p>
          <h2 className="mt-5 max-w-3xl text-[48px] font-semibold leading-[0.96] tracking-[-0.055em] md:text-[68px]">Simplu pentru client. Puternic în spate.</h2>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {template.process.map((step) => (
              <div key={step.number} className="rounded-[28px] border border-black/[0.06] bg-white p-7">
                <span className="text-[10px] font-semibold" style={{ color: template.accent }}>{step.number}</span>
                <h3 className="mt-12 text-2xl font-semibold tracking-[-0.04em]">{step.title}</h3>
                <p className="mt-4 text-sm leading-6 text-black/50">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-32">
        <div className="grid gap-8 rounded-[36px] p-8 md:grid-cols-[1fr_auto] md:items-end md:p-12" style={{ background: template.accentSoft }}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: template.accent }}>Recenzie</p>
            <blockquote className="mt-7 max-w-4xl text-[34px] font-medium leading-[1.05] tracking-[-0.045em] md:text-[52px]">“{template.testimonial}”</blockquote>
          </div>
          <div className="text-sm text-black/45">Client verificat · 5.0 ★</div>
        </div>
      </section>

      <section id="contact" className="px-6 pb-0 md:px-10">
        <div className="mx-auto max-w-[1440px] rounded-t-[42px] bg-[#101014] px-7 py-20 text-white md:px-12 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{template.contactLine}</p>
              <h2 className="mt-6 max-w-4xl text-[48px] font-semibold leading-[0.96] tracking-[-0.055em] md:text-[72px]">Hai să transformăm vizita în următorul client.</h2>
              <p className="mt-6 max-w-xl text-sm leading-6 text-white/50">Acesta este un demo ORBYVEN. Structura, textele, culorile, modulele și integrările pot fi adaptate complet pentru fiecare business.</p>
            </div>
            <Link href="/contact" className="rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black">Construiește cu ORBYVEN ↗</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
