import Link from "next/link";

import SeoShell from "@/components/seo/SeoShell";
import { buildSeoMetadata } from "@/lib/seo-foundation";

export const metadata = buildSeoMetadata({
  path: "/despre",
  title: "Despre ORBYVEN CREATIVE",
  description: "ORBYVEN construiește site-uri și un workspace modular pentru firme care vor o experiență digitală simplă, premium și conectată cu munca reală.",
});

export default function AboutPage() {
  return (
    <SeoShell>
      <section className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#4b46ee]">Despre ORBYVEN</p>
          <h1 className="mt-5 max-w-6xl text-[clamp(56px,8vw,108px)] font-semibold leading-[.87] tracking-[-.073em]">
            Site public la exterior. Un sistem simplu în spate.
          </h1>
          <p className="mt-8 max-w-3xl text-[17px] leading-8 text-black/55">
            ORBYVEN (ORBYVEN CREATIVE) este un studio de web design și dezvoltare software pentru afaceri din România. Construim website-uri, landing pages și un workspace modular pentru firme mici și medii, pornind de la o idee simplă: o firmă nu ar trebui să folosească zece aplicații greoaie ca să își prezinte serviciile și să urmărească munca de zi cu zi.
          </p>

          <div className="mt-14 grid gap-3 md:grid-cols-3">
            {[
              ["Public", "Website-uri și pagini care explică oferta fără zgomot inutil."],
              ["Workspace", "Module pentru lead-uri, task-uri, calendar, devize, documente, cheltuieli și echipă."],
              ["Modular", "Activezi doar ce are sens pentru firmă și păstrezi aceeași fundație când crești."],
            ].map(([title, copy], index) => (
              <article key={title} className="rounded-[26px] border border-black/[.07] bg-[#f7f7f9] p-6">
                <span className="text-[9px] font-bold tracking-[.16em] text-black/28">0{index + 1}</span>
                <h2 className="mt-8 text-[28px] font-semibold tracking-[-.045em]">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-black/50">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/[.07] bg-[#0d0d0f] px-5 py-20 text-white sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1380px] gap-10 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Principiul produsului</p>
            <h2 className="mt-4 text-[42px] font-semibold leading-[.95] tracking-[-.055em]">Complexitatea rămâne în sistem, nu în fața clientului.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Noob friendly", "O acțiune importantă trebuie să fie ușor de găsit și explicată în limbaj normal."],
              ["Maximum de claritate", "Puțin text acolo unde contextul vizual poate explica mai repede."],
              ["Module conectate", "Lead-ul, calendarul, devizul și cheltuiala trebuie să păstreze același context."],
              ["Piloți înainte de scalare", "Testăm verticale reale înainte să multiplicăm funcționalități."],
            ].map(([title, copy]) => (
              <article key={title} className="rounded-[22px] border border-white/[.08] p-6">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/45">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-7 md:px-10">
        <div className="mx-auto flex max-w-[1380px] flex-wrap gap-3">
          <Link href="/studii-de-caz" className="rounded-full bg-[#171719] px-5 py-3 text-sm font-semibold text-white">Vezi piloții</Link>
          <Link href="/solutii" className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold">Vezi soluțiile</Link>
          <Link href="/contact" className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold">Contact</Link>
        </div>
      </section>
    </SeoShell>
  );
}
