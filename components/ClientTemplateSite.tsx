import Link from "next/link";

import type { ClientTemplateConfig } from "@/lib/client-template-catalog";

export default function ClientTemplateSite({ template }: { template: ClientTemplateConfig }) {
  if (template.style === "technical") return <TechnicalSite template={template} />;
  if (template.style === "editorial") return <EditorialSite template={template} />;
  if (template.style === "airy") return <AirySite template={template} />;
  return <MedicalSite template={template} />;
}

function DemoBar({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`border-b px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${dark ? "border-white/10 bg-[#14191f] text-white/55" : "border-black/[0.06] bg-white text-black/40"}`}>
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-5">
        <span>Demo fictiv · ORBYVEN client template</span>
        <Link href="/templates" className="transition hover:opacity-70">Înapoi la template-uri ↗</Link>
      </div>
    </div>
  );
}

function TechnicalSite({ template }: { template: ClientTemplateConfig }) {
  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#121820]" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <DemoBar />

      <section className="border-b border-[#121820]/10 bg-[#f7f8fa]">
        <div className="mx-auto max-w-[1480px] px-5 md:px-9">
          <div className="flex items-center justify-between gap-4 border-b border-[#121820]/10 py-3 text-[11px] text-[#121820]/55">
            <span>Intervenții în București & Ilfov · L–V 08:00–18:00</span>
            <span className="hidden sm:block">Urgențe tehnice demo · 0700 000 000</span>
          </div>

          <header className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#315ee8] text-sm font-black text-white">NF</span>
              <div>
                <p className="text-[17px] font-black tracking-[-0.04em]">{template.title}</p>
                <p className="text-[9px] uppercase tracking-[0.16em] text-[#121820]/40">instalații tehnice</p>
              </div>
            </div>
            <nav className="hidden items-center gap-7 text-[12px] font-semibold text-[#121820]/58 md:flex">
              <a href="#servicii">Servicii</a>
              <a href="#lucrari">Lucrări</a>
              <a href="#proces">Cum lucrăm</a>
              <a href="#recenzii">Recenzii</a>
            </nav>
            <a href="#contact" className="rounded-[12px] bg-[#121820] px-5 py-3 text-[12px] font-bold text-white">Solicită ofertă</a>
          </header>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f7f8fa]">
        <div aria-hidden="true" className="absolute right-[-12%] top-[-30%] h-[680px] w-[680px] rounded-full bg-[#dfe7ff] blur-[150px]" />
        <div className="relative mx-auto grid max-w-[1480px] gap-12 px-5 py-16 md:px-9 md:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#315ee8]">
              <span className="rounded-full border border-[#315ee8]/20 bg-white px-3 py-2">Autorizat</span>
              <span className="rounded-full border border-[#315ee8]/20 bg-white px-3 py-2">Garanție lucrare</span>
              <span className="rounded-full border border-[#315ee8]/20 bg-white px-3 py-2">Ofertă transparentă</span>
            </div>
            <h1 className="mt-7 max-w-[840px] text-[clamp(52px,7vw,102px)] font-black leading-[0.9] tracking-[-0.068em]">{template.heroTitle}</h1>
            <p className="mt-7 max-w-2xl text-[16px] leading-7 text-[#121820]/58 md:text-[18px] md:leading-8">{template.heroCopy}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contact" className="rounded-[12px] bg-[#315ee8] px-6 py-3.5 text-sm font-bold text-white">{template.primaryAction}</a>
              <a href="#servicii" className="rounded-[12px] border border-[#121820]/12 bg-white px-6 py-3.5 text-sm font-bold">{template.secondaryAction}</a>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 border-y border-[#121820]/10 py-5">
              {template.stats.map((stat) => (
                <div key={stat.label} className="border-r border-[#121820]/10 px-4 first:pl-0 last:border-r-0">
                  <p className="text-[24px] font-black tracking-[-0.05em] md:text-[31px]">{stat.value}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.13em] text-[#121820]/38">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#121820]/10 bg-[#161c24] p-3 shadow-[0_32px_100px_rgba(18,24,32,0.18)]">
            <div className="rounded-[18px] border border-white/10 bg-[#1e2631] p-6 text-white md:p-8">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/44">Evaluare rapidă · demo</p>
                <span className="h-2.5 w-2.5 rounded-full bg-[#61d18b] shadow-[0_0_0_5px_rgba(97,209,139,0.10)]" />
              </div>
              <h2 className="mt-6 text-[32px] font-black leading-[0.98] tracking-[-0.05em]">Spune-ne ce trebuie rezolvat.</h2>
              <div className="mt-7 grid gap-3">
                {["Tip lucrare · Instalație termică", "Locație · București", "Urgență · Programare normală"].map((label) => (
                  <div key={label} className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/[0.045] px-4 py-4 text-[12px] text-white/68">
                    <span>{label}</span><span className="text-white/30">⌄</span>
                  </div>
                ))}
                <div className="rounded-[12px] border border-white/10 bg-white/[0.045] px-4 py-5 text-[12px] text-white/35">Descrie pe scurt lucrarea…</div>
                <div className="rounded-[12px] bg-[#315ee8] px-5 py-4 text-center text-[12px] font-bold">Trimite solicitarea</div>
              </div>
              <p className="mt-4 text-[10px] leading-4 text-white/30">Interfață demonstrativă. Formularul nu trimite date și nu implementează un modul ORBYVEN.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="servicii" className="bg-white">
        <div className="mx-auto max-w-[1480px] px-5 py-20 md:px-9 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#315ee8]">Servicii</p>
              <h2 className="mt-5 text-[44px] font-black leading-[0.94] tracking-[-0.055em] md:text-[64px]">Clar de la primul scroll.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-[#121820]/52">Clientul găsește rapid serviciul de care are nevoie, fără meniuri tehnice inutile.</p>
            </div>
            <div className="grid border-t border-[#121820]/10 sm:grid-cols-2">
              {template.services.map((service, index) => (
                <article key={service.title} className="border-b border-[#121820]/10 p-6 sm:border-r md:p-8 sm:[&:nth-child(2n)]:border-r-0">
                  <div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#eaf0ff] text-[11px] font-black text-[#315ee8]">{service.icon}</span><span className="text-[10px] font-bold text-[#121820]/25">0{index + 1}</span></div>
                  <h3 className="mt-10 text-[24px] font-black tracking-[-0.04em]">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#121820]/50">{service.copy}</p>
                  <p className="mt-6 text-[11px] font-bold text-[#315ee8]">Detalii serviciu →</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#121820]/10 bg-[#eef2f5]">
        <div className="mx-auto grid max-w-[1480px] gap-4 px-5 py-16 md:grid-cols-3 md:px-9 md:py-20">
          {template.benefits.map((benefit, index) => (
            <div key={benefit.title} className="rounded-[18px] border border-[#121820]/9 bg-white p-6 md:p-7">
              <span className="text-[10px] font-black text-[#315ee8]">0{index + 1}</span>
              <h3 className="mt-8 text-[22px] font-black tracking-[-0.035em]">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#121820]/50">{benefit.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="lucrari" className="bg-[#161c24] text-white">
        <div className="mx-auto max-w-[1480px] px-5 py-20 md:px-9 md:py-28">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#84a2ff]">Lucrări selectate</p><h2 className="mt-5 text-[46px] font-black tracking-[-0.055em] md:text-[66px]">Munca vorbește înaintea ofertei.</h2></div>
            <p className="max-w-md text-sm leading-6 text-white/45">Exemple demonstrative care arată cum un business tehnic își poate transforma portofoliul în dovadă de încredere.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {template.gallery.map((item, index) => (
              <article key={item.title} className="overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04]">
                <div className={`h-52 ${index === 0 ? "bg-[linear-gradient(145deg,#45576b,#18222d)]" : index === 1 ? "bg-[linear-gradient(145deg,#d2d7dc,#697682)]" : index === 2 ? "bg-[linear-gradient(145deg,#718499,#273745)]" : "bg-[linear-gradient(145deg,#c2c8cc,#4c5965)]"}`}>
                  <div className="flex h-full items-end p-5"><span className="rounded-full bg-black/30 px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] backdrop-blur">foto demo · proiect {index + 1}</span></div>
                </div>
                <div className="p-5"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#84a2ff]">{item.label}</p><h3 className="mt-3 text-[19px] font-black tracking-[-0.035em]">{item.title}</h3><p className="mt-2 text-xs leading-5 text-white/42">{item.copy}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proces" className="bg-white">
        <div className="mx-auto max-w-[1480px] px-5 py-20 md:px-9 md:py-28">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#315ee8]">Cum lucrăm</p>
          <div className="mt-5 grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <h2 className="text-[46px] font-black leading-[0.94] tracking-[-0.055em] md:text-[68px]">Trei pași. Nicio surpriză.</h2>
            <div className="border-t border-[#121820]/10">
              {template.process.map((step) => (
                <div key={step.number} className="grid gap-5 border-b border-[#121820]/10 py-7 sm:grid-cols-[70px_0.45fr_1fr] sm:items-start">
                  <span className="text-[11px] font-black text-[#315ee8]">{step.number}</span><h3 className="text-[20px] font-black tracking-[-0.03em]">{step.title}</h3><p className="text-sm leading-6 text-[#121820]/50">{step.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ReviewsSection template={template} mode="technical" />
      <TechnicalContact template={template} />
    </main>
  );
}

function EditorialSite({ template }: { template: ClientTemplateConfig }) {
  return (
    <main className="min-h-screen bg-[#f7f1e9] text-[#2b211d]">
      <DemoBar />
      <header className="mx-auto flex max-w-[1460px] items-center justify-between px-5 py-7 md:px-10">
        <div><p className="font-serif text-[25px] italic tracking-[-0.04em]">Lumière</p><p className="mt-0.5 text-[8px] uppercase tracking-[0.26em] text-[#2b211d]/42">events atelier</p></div>
        <nav className="hidden items-center gap-8 text-[11px] uppercase tracking-[0.13em] text-[#2b211d]/55 md:flex"><a href="#poveste">Experiență</a><a href="#momente">Povești</a><a href="#proces">Proces</a><a href="#contact">Contact</a></nav>
        <a href="#contact" className="border-b border-[#2b211d] pb-1 text-[11px] font-semibold uppercase tracking-[0.12em]">Începe povestea</a>
      </header>

      <section className="mx-auto max-w-[1460px] px-5 pb-20 pt-8 md:px-10 md:pb-28 md:pt-14">
        <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#9f5e4b]">{template.eyebrow}</p>
            <h1 className="mt-7 max-w-[760px] font-serif text-[clamp(58px,7.4vw,112px)] leading-[0.87] tracking-[-0.055em]">{template.heroTitle}</h1>
            <p className="mt-8 max-w-xl text-[16px] leading-8 text-[#2b211d]/58">{template.heroCopy}</p>
            <div className="mt-9 flex items-center gap-5"><a href="#contact" className="rounded-full bg-[#2b211d] px-6 py-3.5 text-[12px] font-semibold text-[#fffaf5]">{template.primaryAction}</a><a href="#poveste" className="text-[11px] uppercase tracking-[0.13em] text-[#2b211d]/62">{template.secondaryAction} ↓</a></div>
          </div>
          <div className="relative min-h-[560px] md:min-h-[650px]">
            <div className="absolute left-[5%] top-[2%] h-[66%] w-[66%] overflow-hidden rounded-t-[160px] bg-[linear-gradient(145deg,#d5b6a5,#79564c)] shadow-[0_30px_90px_rgba(74,47,37,0.16)]"><div className="flex h-full items-end p-6 text-[#fff8f1]"><span className="font-serif text-2xl italic">garden dinner · 2026</span></div></div>
            <div className="absolute bottom-[3%] right-[2%] h-[48%] w-[48%] overflow-hidden border-[8px] border-[#f7f1e9] bg-[linear-gradient(145deg,#efe3d5,#a77c67)]"><div className="flex h-full items-end p-5"><span className="text-[9px] uppercase tracking-[0.18em] text-white/80">flowers · candlelight · texture</span></div></div>
            <div className="absolute right-[4%] top-[4%] rotate-6 border border-[#2b211d]/15 bg-[#fffaf5] px-5 py-4 text-center shadow-sm"><p className="font-serif text-[32px] italic">120+</p><p className="text-[8px] uppercase tracking-[0.18em] text-[#2b211d]/42">stories shaped</p></div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#2b211d]/10 bg-[#fffaf5]">
        <div className="mx-auto grid max-w-[1460px] grid-cols-3 px-5 md:px-10">
          {template.stats.map((stat) => <div key={stat.label} className="border-r border-[#2b211d]/10 py-7 text-center last:border-r-0"><p className="font-serif text-[30px] italic tracking-[-0.04em] md:text-[38px]">{stat.value}</p><p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-[#2b211d]/36">{stat.label}</p></div>)}
        </div>
      </section>

      <section id="poveste" className="mx-auto max-w-[1460px] px-5 py-24 md:px-10 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="lg:sticky lg:top-10 lg:self-start"><p className="text-[9px] uppercase tracking-[0.22em] text-[#9f5e4b]">Ce construim</p><h2 className="mt-5 font-serif text-[50px] leading-[0.92] tracking-[-0.045em] md:text-[70px]">Nu vindem pachete.<br /><em>Construim atmosferă.</em></h2></div>
          <div className="border-t border-[#2b211d]/12">
            {template.services.map((service) => <article key={service.title} className="grid gap-5 border-b border-[#2b211d]/12 py-8 md:grid-cols-[80px_0.7fr_1fr]"><span className="font-serif text-[18px] italic text-[#9f5e4b]">{service.icon}</span><h3 className="font-serif text-[31px] tracking-[-0.035em]">{service.title}</h3><p className="max-w-md text-sm leading-7 text-[#2b211d]/52">{service.copy}</p></article>)}
          </div>
        </div>
      </section>

      <section id="momente" className="bg-[#2b211d] text-[#fff9f3]">
        <div className="mx-auto max-w-[1460px] px-5 py-24 md:px-10 md:py-32">
          <p className="text-[9px] uppercase tracking-[0.22em] text-[#d99c86]">Selected stories</p>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><h2 className="max-w-3xl font-serif text-[52px] leading-[0.92] tracking-[-0.045em] md:text-[76px]">Patru evenimente.<br /><em>Patru lumi diferite.</em></h2><p className="max-w-sm text-sm leading-6 text-white/42">Galeria are rolul de a vinde gustul și atmosfera, nu doar lista de servicii.</p></div>
          <div className="mt-14 grid auto-rows-[240px] gap-3 md:grid-cols-12 md:auto-rows-[270px]">
            {template.gallery.map((item, index) => <article key={item.title} className={`relative overflow-hidden ${index === 0 ? "md:col-span-7 md:row-span-2" : index === 1 ? "md:col-span-5" : index === 2 ? "md:col-span-5" : "md:col-span-12"} ${index === 0 ? "bg-[linear-gradient(145deg,#b98269,#51372f)]" : index === 1 ? "bg-[linear-gradient(145deg,#dcc3ad,#856657)]" : index === 2 ? "bg-[linear-gradient(145deg,#a47f6a,#332522)]" : "bg-[linear-gradient(110deg,#c7a38d,#6e4d43,#332522)]"}`}><div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" /><div className="absolute bottom-0 p-6"><p className="text-[8px] uppercase tracking-[0.18em] text-white/55">{item.label}</p><h3 className="mt-2 font-serif text-[30px] italic">{item.title}</h3><p className="mt-1 text-xs text-white/58">{item.copy}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf5]">
        <div className="mx-auto grid max-w-[1460px] gap-4 px-5 py-20 md:grid-cols-3 md:px-10 md:py-24">
          {template.benefits.map((item, index) => <article key={item.title} className="border-t border-[#2b211d]/14 pt-5"><span className="font-serif text-xl italic text-[#9f5e4b]">0{index + 1}</span><h3 className="mt-8 font-serif text-[30px] tracking-[-0.03em]">{item.title}</h3><p className="mt-4 max-w-sm text-sm leading-7 text-[#2b211d]/50">{item.copy}</p></article>)}
        </div>
      </section>

      <section id="proces" className="mx-auto max-w-[1460px] px-5 py-24 md:px-10 md:py-32">
        <div className="text-center"><p className="text-[9px] uppercase tracking-[0.22em] text-[#9f5e4b]">The process</p><h2 className="mx-auto mt-5 max-w-4xl font-serif text-[52px] leading-[0.92] tracking-[-0.045em] md:text-[76px]">Dintr-o conversație,<br /><em>într-o zi care curge firesc.</em></h2></div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">{template.process.map((step) => <article key={step.number} className="text-center"><span className="font-serif text-[18px] italic text-[#9f5e4b]">{step.number}</span><div className="mx-auto my-6 h-px w-14 bg-[#2b211d]/14" /><h3 className="font-serif text-[28px]">{step.title}</h3><p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[#2b211d]/50">{step.copy}</p></article>)}</div>
      </section>

      <ReviewsSection template={template} mode="editorial" />
      <EditorialContact template={template} />
    </main>
  );
}

function AirySite({ template }: { template: ClientTemplateConfig }) {
  return (
    <main className="min-h-screen bg-[#fffdfc] text-[#30282c]" style={{ fontFamily: "'Avenir Next', Avenir, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <DemoBar />
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-7 md:px-10">
        <div><p className="text-[22px] font-medium tracking-[-0.045em]">atelier <span className="font-serif italic">élan</span></p></div>
        <nav className="hidden items-center gap-8 text-[11px] text-[#30282c]/52 md:flex"><a href="#ritualuri">Ritualuri</a><a href="#rezultate">Rezultate</a><a href="#experienta">Experiență</a><a href="#contact">Contact</a></nav>
        <a href="#contact" className="rounded-full bg-[#30282c] px-5 py-3 text-[11px] font-semibold text-white">Programare</a>
      </header>

      <section className="relative overflow-hidden px-5 pb-20 pt-10 md:px-10 md:pb-28 md:pt-16">
        <div className="absolute left-[8%] top-[8%] h-[360px] w-[360px] rounded-full bg-[#f2e4e8] blur-[110px]" />
        <div className="relative mx-auto max-w-[1440px] text-center">
          <p className="text-[9px] uppercase tracking-[0.26em] text-[#8b6a75]">{template.eyebrow}</p>
          <h1 className="mx-auto mt-7 max-w-[1040px] text-[clamp(54px,7vw,102px)] font-medium leading-[0.91] tracking-[-0.065em]">{template.heroTitle}</h1>
          <p className="mx-auto mt-7 max-w-2xl text-[16px] leading-8 text-[#30282c]/52">{template.heroCopy}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><a href="#contact" className="rounded-full bg-[#30282c] px-6 py-3.5 text-[12px] font-semibold text-white">{template.primaryAction}</a><a href="#ritualuri" className="rounded-full border border-[#30282c]/12 bg-white px-6 py-3.5 text-[12px] font-semibold">{template.secondaryAction}</a></div>
          <div className="mx-auto mt-14 grid max-w-[1120px] gap-3 sm:grid-cols-[0.85fr_1.3fr_0.85fr] sm:items-center">
            <div className="h-[260px] rounded-t-[120px] rounded-b-[28px] bg-[linear-gradient(145deg,#ead7d8,#9b7478)] sm:h-[330px]" />
            <div className="relative h-[330px] overflow-hidden rounded-[34px] bg-[linear-gradient(145deg,#f0e3dc,#b78d82)] sm:h-[450px]"><div className="absolute inset-x-8 bottom-8 rounded-[22px] bg-white/72 p-5 text-left backdrop-blur-xl"><p className="text-[8px] uppercase tracking-[0.18em] text-[#8b6a75]">Signature ritual</p><p className="mt-2 text-[19px] font-medium tracking-[-0.03em]">Calm + Glow · 75 min</p><p className="mt-2 text-[11px] leading-5 text-[#30282c]/48">consultație · curățare · hidratare · masaj facial</p></div></div>
            <div className="h-[260px] rounded-t-[120px] rounded-b-[28px] bg-[linear-gradient(145deg,#d8c5bd,#8f706a)] sm:h-[330px]" />
          </div>
        </div>
      </section>

      <section className="border-y border-[#30282c]/8 bg-[#faf6f4]">
        <div className="mx-auto grid max-w-[1100px] grid-cols-3 px-5 md:px-10">{template.stats.map((stat) => <div key={stat.label} className="py-6 text-center"><p className="text-[27px] font-medium tracking-[-0.04em]">{stat.value}</p><p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-[#30282c]/35">{stat.label}</p></div>)}</div>
      </section>

      <section id="ritualuri" className="mx-auto max-w-[1320px] px-5 py-24 md:px-10 md:py-32">
        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between"><div><p className="text-[9px] uppercase tracking-[0.22em] text-[#8b6a75]">Ritualuri</p><h2 className="mt-5 text-[48px] font-medium tracking-[-0.06em] md:text-[68px]">Mai puține opțiuni.<br />Mai ușor de ales.</h2></div><p className="max-w-sm text-sm leading-7 text-[#30282c]/48">Meniul este construit în jurul nevoii clientei, nu în jurul jargonului de salon.</p></div>
        <div className="mt-12 border-t border-[#30282c]/10">{template.services.map((service, index) => <article key={service.title} className="group grid gap-4 border-b border-[#30282c]/10 py-7 md:grid-cols-[70px_0.6fr_1fr_auto] md:items-center"><span className="text-[9px] text-[#8b6a75]">0{index + 1}</span><h3 className="text-[25px] font-medium tracking-[-0.04em]">{service.title}</h3><p className="max-w-lg text-sm leading-6 text-[#30282c]/48">{service.copy}</p><span className="text-[18px] text-[#30282c]/25 transition group-hover:translate-x-1">→</span></article>)}</div>
      </section>

      <section id="rezultate" className="bg-[#f5eeeb] px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="text-center"><p className="text-[9px] uppercase tracking-[0.22em] text-[#8b6a75]">Real work · demo gallery</p><h2 className="mt-5 text-[47px] font-medium tracking-[-0.055em] md:text-[66px]">Rezultate care nu au nevoie de filtre.</h2></div>
          <div className="mt-12 grid gap-3 md:grid-cols-4">{template.gallery.map((item, index) => <article key={item.title} className={`overflow-hidden rounded-[28px] bg-white ${index % 2 === 1 ? "md:translate-y-8" : ""}`}><div className={`h-[330px] ${index === 0 ? "bg-[linear-gradient(145deg,#efdcd7,#ad7d74)]" : index === 1 ? "bg-[linear-gradient(145deg,#e7d6d0,#8c6b64)]" : index === 2 ? "bg-[linear-gradient(145deg,#f3e8e0,#b68f84)]" : "bg-[linear-gradient(145deg,#dac5c5,#80636b)]"}`} /><div className="p-5"><p className="text-[8px] uppercase tracking-[0.16em] text-[#8b6a75]">{item.label}</p><h3 className="mt-2 text-[19px] font-medium tracking-[-0.03em]">{item.title}</h3><p className="mt-2 text-[11px] leading-5 text-[#30282c]/42">{item.copy}</p></div></article>)}</div>
        </div>
      </section>

      <section id="experienta" className="mx-auto max-w-[1320px] px-5 py-24 md:px-10 md:py-32">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div><p className="text-[9px] uppercase tracking-[0.22em] text-[#8b6a75]">De ce Élan</p><h2 className="mt-5 text-[49px] font-medium leading-[0.95] tracking-[-0.055em] md:text-[68px]">Beauty care care începe cu <span className="font-serif italic">a asculta.</span></h2></div>
          <div className="grid gap-3 sm:grid-cols-3">{template.benefits.map((benefit) => <article key={benefit.title} className="rounded-[26px] bg-[#faf6f4] p-6"><div className="h-9 w-9 rounded-full bg-[#efe4e7]" /><h3 className="mt-8 text-[20px] font-medium tracking-[-0.035em]">{benefit.title}</h3><p className="mt-3 text-xs leading-6 text-[#30282c]/46">{benefit.copy}</p></article>)}</div>
        </div>
      </section>

      <section className="bg-[#30282c] text-white">
        <div className="mx-auto max-w-[1320px] px-5 py-20 md:px-10 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center"><div><p className="text-[9px] uppercase tracking-[0.22em] text-[#d6b4bf]">Booking preview · demo</p><h2 className="mt-5 max-w-2xl text-[48px] font-medium leading-[0.94] tracking-[-0.055em] md:text-[66px]">Alege timpul potrivit. Restul îl pregătim noi.</h2><div className="mt-10 grid gap-5 sm:grid-cols-3">{template.process.map((step) => <div key={step.number}><span className="text-[9px] text-[#d6b4bf]">{step.number}</span><h3 className="mt-3 text-[17px] font-medium">{step.title}</h3><p className="mt-2 text-xs leading-5 text-white/42">{step.copy}</p></div>)}</div></div><div className="rounded-[30px] bg-white p-5 text-[#30282c]"><p className="text-[9px] uppercase tracking-[0.16em] text-[#8b6a75]">Disponibilitate demonstrativă</p><h3 className="mt-4 text-[28px] font-medium tracking-[-0.045em]">Skin Ritual · 75 min</h3><div className="mt-6 grid grid-cols-3 gap-2">{["10:00","12:30","14:00","16:30","17:45","19:00"].map((time, index) => <span key={time} className={`rounded-full border px-3 py-3 text-center text-[11px] ${index === 3 ? "border-[#8b6a75] bg-[#efe4e7]" : "border-[#30282c]/10"}`}>{time}</span>)}</div><div className="mt-5 rounded-full bg-[#30282c] px-5 py-3.5 text-center text-[11px] font-semibold text-white">Continuă programarea</div><p className="mt-3 text-center text-[9px] text-[#30282c]/35">Doar prezentare vizuală. Nu există logică de booking în acest demo.</p></div></div>
        </div>
      </section>

      <ReviewsSection template={template} mode="airy" />
      <AiryContact template={template} />
    </main>
  );
}

function MedicalSite({ template }: { template: ClientTemplateConfig }) {
  return (
    <main className="min-h-screen bg-[#f2f7f6] text-[#172627]" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <DemoBar />
      <div className="bg-[#286d73] px-5 py-2.5 text-center text-[10px] font-semibold text-white/80">Ai o urgență dentară? Demo clinică · 0700 000 000 · L–S 08:00–20:00</div>
      <header className="mx-auto flex max-w-[1450px] items-center justify-between px-5 py-5 md:px-10">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#286d73] text-[18px] font-semibold text-white">+</span><div><p className="text-[18px] font-bold tracking-[-0.035em]">NovaSmile</p><p className="text-[8px] uppercase tracking-[0.15em] text-[#172627]/38">dental clinic</p></div></div>
        <nav className="hidden items-center gap-7 text-[11px] font-semibold text-[#172627]/50 md:flex"><a href="#tratamente">Tratamente</a><a href="#echipa">Echipă</a><a href="#proces">Prima vizită</a><a href="#recenzii">Recenzii</a></nav>
        <a href="#contact" className="rounded-full bg-[#286d73] px-5 py-3 text-[11px] font-semibold text-white">Programare</a>
      </header>

      <section className="px-5 pb-16 pt-8 md:px-10 md:pb-24 md:pt-12">
        <div className="mx-auto grid max-w-[1450px] gap-10 overflow-hidden rounded-[34px] bg-white p-6 shadow-[0_28px_100px_rgba(30,77,79,0.08)] md:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="py-6 md:py-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#dfeeee] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#286d73]"><span className="h-2 w-2 rounded-full bg-[#43a393]" />{template.eyebrow}</div>
            <h1 className="mt-7 max-w-[790px] text-[clamp(50px,6.6vw,94px)] font-semibold leading-[0.91] tracking-[-0.065em]">{template.heroTitle}</h1>
            <p className="mt-7 max-w-2xl text-[16px] leading-8 text-[#172627]/52">{template.heroCopy}</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="#contact" className="rounded-full bg-[#286d73] px-6 py-3.5 text-[12px] font-semibold text-white">{template.primaryAction}</a><a href="#tratamente" className="rounded-full border border-[#172627]/10 px-6 py-3.5 text-[12px] font-semibold">{template.secondaryAction}</a></div>
            <div className="mt-9 flex flex-wrap items-center gap-5 text-[10px] font-semibold text-[#172627]/45"><span>✓ plan de tratament clar</span><span>✓ costuri explicate</span><span>✓ opțiuni pentru anxietate</span></div>
          </div>
          <div className="relative min-h-[480px] overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#d8e9e7,#7ea9a6)] md:min-h-[560px]">
            <div className="absolute left-[16%] top-[12%] h-[250px] w-[250px] rounded-full bg-[#edf6f5]/80" />
            <div className="absolute bottom-0 left-1/2 h-[72%] w-[58%] -translate-x-1/2 rounded-t-[160px] bg-[linear-gradient(180deg,#f4f8f8,#b9d0ce)]" />
            <div className="absolute inset-x-5 bottom-5 rounded-[20px] bg-white/88 p-5 backdrop-blur-xl"><div className="flex items-center justify-between"><div><p className="text-[9px] uppercase tracking-[0.14em] text-[#286d73]">Medic coordonator · demo</p><p className="mt-2 text-[20px] font-semibold tracking-[-0.035em]">Dr. Ana Popescu</p><p className="mt-1 text-[11px] text-[#172627]/45">stomatologie generală · protetică</p></div><span className="grid h-10 w-10 place-items-center rounded-full bg-[#dfeeee] text-[#286d73]">+</span></div></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pb-16 md:px-10 md:pb-24"><div className="grid grid-cols-3 overflow-hidden rounded-[22px] border border-[#172627]/8 bg-white">{template.stats.map((stat) => <div key={stat.label} className="border-r border-[#172627]/8 px-3 py-5 text-center last:border-r-0 md:py-6"><p className="text-[26px] font-semibold tracking-[-0.045em] md:text-[32px]">{stat.value}</p><p className="mt-1 text-[8px] uppercase tracking-[0.13em] text-[#172627]/35">{stat.label}</p></div>)}</div></section>

      <section id="tratamente" className="bg-white">
        <div className="mx-auto max-w-[1450px] px-5 py-20 md:px-10 md:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#286d73]">Tratamente</p><h2 className="mt-5 text-[48px] font-semibold leading-[0.95] tracking-[-0.055em] md:text-[68px]">Totul explicat pe limba pacientului.</h2><p className="mt-6 max-w-md text-sm leading-7 text-[#172627]/48">Fiecare categorie răspunde unei nevoi reale, fără să transforme pagina într-un dicționar medical.</p></div><div className="grid gap-3 sm:grid-cols-2">{template.services.map((service) => <article key={service.title} className="rounded-[22px] border border-[#172627]/8 bg-[#f7faf9] p-6"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#dfeeee] text-[11px] font-bold text-[#286d73]">{service.icon}</span><h3 className="mt-8 text-[22px] font-semibold tracking-[-0.035em]">{service.title}</h3><p className="mt-3 text-sm leading-6 text-[#172627]/48">{service.copy}</p><p className="mt-5 text-[10px] font-semibold text-[#286d73]">Când este recomandat →</p></article>)}</div></div>
        </div>
      </section>

      <section className="border-y border-[#172627]/8 bg-[#eaf3f2]">
        <div className="mx-auto max-w-[1450px] px-5 py-18 md:px-10 md:py-20"><div className="grid gap-4 md:grid-cols-3">{template.benefits.map((benefit, index) => <article key={benefit.title} className="rounded-[22px] bg-white p-6"><span className="text-[9px] font-bold text-[#286d73]">0{index + 1}</span><h3 className="mt-7 text-[21px] font-semibold tracking-[-0.03em]">{benefit.title}</h3><p className="mt-3 text-sm leading-6 text-[#172627]/46">{benefit.copy}</p></article>)}</div></div>
      </section>

      <section id="echipa" className="mx-auto max-w-[1450px] px-5 py-24 md:px-10 md:py-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#286d73]">Echipă & clinică</p><h2 className="mt-5 text-[47px] font-semibold tracking-[-0.055em] md:text-[68px]">Oameni înainte de halate.</h2></div><p className="max-w-sm text-sm leading-6 text-[#172627]/45">Secțiunea umanizează clinica și reduce anxietatea înainte de prima vizită.</p></div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{template.gallery.map((item, index) => <article key={item.title} className="overflow-hidden rounded-[24px] border border-[#172627]/8 bg-white"><div className={`h-[290px] ${index === 0 ? "bg-[linear-gradient(145deg,#dcebea,#91b2af)]" : index === 1 ? "bg-[linear-gradient(145deg,#e8f1f0,#a1bfbc)]" : index === 2 ? "bg-[linear-gradient(145deg,#d4e5e3,#789f9b)]" : "bg-[linear-gradient(145deg,#e8f4f3,#80aba7)]"}`}><div className="flex h-full items-end p-5"><span className="rounded-full bg-white/70 px-3 py-1.5 text-[8px] uppercase tracking-[0.13em] text-[#286d73] backdrop-blur">vizual demo</span></div></div><div className="p-5"><p className="text-[8px] uppercase tracking-[0.14em] text-[#286d73]">{item.label}</p><h3 className="mt-2 text-[19px] font-semibold tracking-[-0.03em]">{item.title}</h3><p className="mt-2 text-[11px] leading-5 text-[#172627]/42">{item.copy}</p></div></article>)}</div>
      </section>

      <section id="proces" className="bg-[#172627] text-white">
        <div className="mx-auto max-w-[1450px] px-5 py-20 md:px-10 md:py-28"><div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="text-[9px] uppercase tracking-[0.18em] text-[#79bbb7]">Prima vizită</p><h2 className="mt-5 text-[49px] font-semibold leading-[0.95] tracking-[-0.055em] md:text-[68px]">Știi ce urmează.<br />Pas cu pas.</h2></div><div className="border-t border-white/12">{template.process.map((step) => <div key={step.number} className="grid gap-5 border-b border-white/12 py-7 sm:grid-cols-[60px_0.45fr_1fr]"><span className="text-[10px] font-bold text-[#79bbb7]">{step.number}</span><h3 className="text-[19px] font-semibold">{step.title}</h3><p className="text-sm leading-6 text-white/45">{step.copy}</p></div>)}</div></div></div>
      </section>

      <ReviewsSection template={template} mode="medical" />
      <MedicalContact template={template} />
    </main>
  );
}

function ReviewsSection({ template, mode }: { template: ClientTemplateConfig; mode: "technical" | "editorial" | "airy" | "medical" }) {
  const styles = {
    technical: { section: "bg-[#eef2f5] text-[#121820]", accent: "text-[#315ee8]", card: "bg-white border-[#121820]/8", body: "text-[#121820]/48" },
    editorial: { section: "bg-[#efe3d7] text-[#2b211d]", accent: "text-[#9f5e4b]", card: "bg-[#fffaf5] border-[#2b211d]/8", body: "text-[#2b211d]/48" },
    airy: { section: "bg-[#fffdfc] text-[#30282c]", accent: "text-[#8b6a75]", card: "bg-[#faf6f4] border-[#30282c]/8", body: "text-[#30282c]/45" },
    medical: { section: "bg-[#f2f7f6] text-[#172627]", accent: "text-[#286d73]", card: "bg-white border-[#172627]/8", body: "text-[#172627]/45" },
  }[mode];
  return (
    <section id="recenzii" className={styles.section}>
      <div className="mx-auto max-w-[1450px] px-5 py-20 md:px-10 md:py-28">
        <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${styles.accent}`}>Social proof · recenzii demo</p>
        <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><h2 className={`max-w-3xl text-[45px] leading-[0.96] tracking-[-0.055em] md:text-[64px] ${mode === "editorial" ? "font-serif" : mode === "technical" ? "font-black" : "font-medium"}`}>Încrederea vine din experiențe concrete.</h2><span className="text-sm">4.9 ★★★★★</span></div>
        <div className="mt-10 grid gap-3 md:grid-cols-3">{template.reviews.map((review) => <article key={review.name} className={`rounded-[22px] border p-6 md:p-7 ${styles.card}`}><p className="text-[18px] leading-7 tracking-[-0.025em]">“{review.quote}”</p><div className="mt-10 border-t border-current/10 pt-4"><p className="text-[12px] font-semibold">{review.name}</p><p className={`mt-1 text-[10px] ${styles.body}`}>{review.meta}</p></div></article>)}</div>
      </div>
    </section>
  );
}

function TechnicalContact({ template }: { template: ClientTemplateConfig }) {
  return <section id="contact" className="bg-[#161c24] px-5 pb-0 pt-5 text-white md:px-9"><div className="mx-auto max-w-[1480px] rounded-t-[28px] border border-white/10 bg-[#10151b] px-6 py-16 md:px-10 md:py-20"><div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-[9px] uppercase tracking-[0.16em] text-[#84a2ff]">{template.contactLine}</p><h2 className="mt-5 max-w-4xl text-[48px] font-black leading-[0.93] tracking-[-0.055em] md:text-[72px]">Ai o lucrare? Începem cu o evaluare clară.</h2><p className="mt-5 max-w-xl text-sm leading-6 text-white/42">Date, formular și ofertare afișate demonstrativ. Implementarea reală poate consuma ulterior modulele ORBYVEN fără ca acest template să le dubleze logica.</p></div><Link href="/contact" className="rounded-[12px] bg-[#315ee8] px-6 py-4 text-sm font-bold">Construiește cu ORBYVEN ↗</Link></div></div></section>;
}

function EditorialContact({ template }: { template: ClientTemplateConfig }) {
  return <section id="contact" className="bg-[#2b211d] px-5 py-20 text-[#fff9f3] md:px-10 md:py-28"><div className="mx-auto max-w-[1200px] text-center"><p className="text-[9px] uppercase tracking-[0.2em] text-[#d99c86]">{template.contactLine}</p><h2 className="mx-auto mt-6 max-w-4xl font-serif text-[52px] leading-[0.9] tracking-[-0.045em] md:text-[80px]">Aveți o poveste.<br /><em>Hai să-i dăm o formă.</em></h2><p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/42">Toate informațiile sunt fictive. Acest demo prezintă doar experiența publică, fără booking, CRM sau module business implementate.</p><Link href="/contact" className="mt-9 inline-flex rounded-full bg-[#fff9f3] px-7 py-4 text-[12px] font-semibold text-[#2b211d]">Creează o direcție ORBYVEN ↗</Link></div></section>;
}

function AiryContact({ template }: { template: ClientTemplateConfig }) {
  return <section id="contact" className="px-5 pb-0 pt-12 md:px-10"><div className="mx-auto max-w-[1320px] rounded-t-[42px] bg-[#efe4e7] px-6 py-18 text-center md:px-12 md:py-24"><p className="text-[9px] uppercase tracking-[0.2em] text-[#8b6a75]">{template.contactLine}</p><h2 className="mx-auto mt-5 max-w-4xl text-[49px] font-medium leading-[0.94] tracking-[-0.055em] md:text-[72px]">Un site care se simte la fel de atent ca experiența din salon.</h2><p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[#30282c]/48">Programarea afișată este doar un preview vizual. Integrarea reală rămâne separată și poate fi conectată la produsul ORBYVEN atunci când este disponibilă.</p><Link href="/contact" className="mt-8 inline-flex rounded-full bg-[#30282c] px-7 py-4 text-[12px] font-semibold text-white">Personalizează cu ORBYVEN ↗</Link></div></section>;
}

function MedicalContact({ template }: { template: ClientTemplateConfig }) {
  return <section id="contact" className="bg-[#f2f7f6] px-5 pb-0 pt-10 md:px-10"><div className="mx-auto max-w-[1450px] rounded-t-[34px] bg-[#286d73] px-6 py-16 text-white md:px-10 md:py-20"><div className="grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-center"><div><p className="text-[9px] uppercase tracking-[0.16em] text-white/55">{template.contactLine}</p><h2 className="mt-5 max-w-4xl text-[48px] font-semibold leading-[0.94] tracking-[-0.055em] md:text-[70px]">Prima vizită poate începe cu mai puțină incertitudine.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-white/58">Programarea și datele medicale sunt prezentate doar vizual. Demo-ul nu colectează date și nu implementează fluxuri medicale sau module ORBYVEN.</p></div><div className="rounded-[24px] bg-white p-5 text-[#172627]"><p className="text-[9px] uppercase tracking-[0.14em] text-[#286d73]">Programare demo</p><div className="mt-5 space-y-2">{["Consultație inițială", "Mâine · 11:30", "Dr. Ana Popescu"].map((item) => <div key={item} className="rounded-[12px] bg-[#f2f7f6] px-4 py-3 text-[11px]">{item}</div>)}</div><Link href="/contact" className="mt-4 block rounded-full bg-[#172627] px-5 py-3.5 text-center text-[11px] font-semibold text-white">Construiește cu ORBYVEN ↗</Link></div></div></div></section>;
}
