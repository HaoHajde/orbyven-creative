import Link from "next/link";

type Preview = { href: string; title: string; description: string };

export default function InvitationServiceLanding({
  label,
  title,
  introduction,
  highlights,
  previews,
  relatedHref,
  relatedLabel,
}: {
  label: string;
  title: string;
  introduction: string;
  highlights: { title: string; description: string }[];
  previews: Preview[];
  relatedHref: string;
  relatedLabel: string;
}) {
  return (
    <main className="min-h-screen bg-[#080912] text-[#f5f5fc]">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-8 sm:px-8">
        <Link href="/" className="text-sm font-semibold tracking-[.16em]" aria-label="ORBYVEN CREATIVE — Acasă">
          ORBYVEN <span className="text-[#ada7ff]">CREATIVE</span>
        </Link>
        <nav aria-label="Navigație" className="flex items-center gap-5 text-xs text-white/70 sm:gap-8 sm:text-sm">
          <Link href="/servicii" className="hover:text-white">Web design</Link>
          <Link href="/templates" className="hover:text-white">Modele</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </nav>
      </header>

      <section className="relative isolate overflow-hidden border-y border-white/10 px-5 py-24 sm:px-8 sm:py-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_20%,rgba(92,75,238,.23),transparent_55%),radial-gradient(ellipse_at_15%_85%,rgba(87,44,144,.20),transparent_55%)]" />
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[.24em] text-[#bcb6ff]">{label} · ORBYVEN CREATIVE</p>
          <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-7xl">{title}</h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">{introduction}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="#modele" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#080912] hover:bg-[#ebe9ff]">
              Vezi modelele ↓
            </Link>
            <Link href="/contact" className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold hover:border-white">
              Solicită personalizare ↗
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="ce-primesti" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#bcb6ff]">Simplu și personal</p>
        <h2 id="ce-primesti" className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Invitația voastră, nu un model generic.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="rounded-[28px] border border-white/10 bg-white/[.045] p-7">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/60">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="modele" aria-labelledby="modele-titlu" className="border-y border-white/10 bg-white/[.025] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#bcb6ff]">Exemple de invitații digitale</p>
          <h2 id="modele-titlu" className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Descoperă o direcție vizuală.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {previews.map((preview) => (
              <Link key={preview.href} href={preview.href} className="group flex min-h-48 flex-col justify-between rounded-[28px] border border-white/10 bg-[#141529] p-7 hover:border-[#ada7ff]/60">
                <span className="text-xs uppercase tracking-[.2em] text-[#bcb6ff]">Model interactiv</span>
                <span className="mt-8 block">
                  <span className="block text-2xl font-semibold">{preview.title} <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">↗</span></span>
                  <span className="mt-2 block text-sm leading-6 text-white/60">{preview.description}</span>
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-sm leading-7 text-white/60">
            Cauți și alte opțiuni? <Link href={relatedHref} className="font-semibold text-[#c9c5ff] underline underline-offset-4">{relatedLabel}</Link>.
          </p>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-7 px-5 py-20 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Vrei ceva creat pentru evenimentul tău?</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">Spune-ne ce ai în minte și stabilim împreună aspectul și funcțiile invitației.</p>
        </div>
        <Link href="/contact" className="shrink-0 self-start rounded-full bg-white px-7 py-4 text-sm font-semibold text-[#080912] md:self-auto">Discută cu ORBYVEN ↗</Link>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 border-t border-white/10 px-5 py-8 text-sm text-white/55 sm:px-8">
        <Link href="/">© 2026 ORBYVEN CREATIVE</Link>
        <nav aria-label="Alte servicii" className="flex flex-wrap gap-5">
          <Link href="/invitatii-nunta">Invitații de nuntă</Link>
          <Link href="/invitatii-botez">Invitații de botez</Link>
          <Link href="/servicii">Web design</Link>
          <Link href="/legal/privacy">Confidențialitate</Link>
        </nav>
      </footer>
    </main>
  );
}
