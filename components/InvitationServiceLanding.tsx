import Link from "next/link";
import LanguageSwitch from "@/components/LanguageSwitch";

type Preview = { href: string; title: string; description: string };

const invitationCategories = {
  ro: [
    { href: "/invitatii-nunta", label: "Invitații de nuntă", copy: "Poveste, program, locații și RSVP într-un singur link." },
    { href: "/invitatii-botez", label: "Invitații de botez", copy: "Modele personalizabile pentru fetiță sau băiețel." },
    { href: "/invitatii-majorat", label: "Invitații de majorat", copy: "Concept digital pentru 18 ani, cu program, locație și RSVP." },
  ],
  en: [
    { href: "/invitatii-nunta", label: "Wedding invitations", copy: "Story, schedule, locations and RSVP in one link." },
    { href: "/invitatii-botez", label: "Christening invitations", copy: "Customizable designs for your family and event." },
    { href: "/invitatii-majorat", label: "18th birthday invitations", copy: "A digital concept with schedule, location and RSVP." },
  ],
} as const;

export default function InvitationServiceLanding({
  label,
  title,
  introduction,
  highlights,
  previews,
  relatedHref,
  relatedLabel,
  faq,
  locale = "ro",
}: {
  label: string;
  title: string;
  introduction: string;
  highlights: { title: string; description: string }[];
  previews: Preview[];
  relatedHref: string;
  relatedLabel: string;
  faq: { question: string; answer: string }[];
  locale?: "ro" | "en";
}) {
  const categories = invitationCategories[locale];
  const currentInvitationPath = categories.find((item) => item.label === label)?.href;
  const relatedInvitationCategories = categories.filter((item) => item.href !== currentInvitationPath);
  const copy = locale === "en"
    ? {
        homeAria: "ORBYVEN CREATIVE — Home",
        navAria: "Navigation",
        models: "Templates",
        contact: "Contact",
        viewModels: "View templates ↓",
        request: "Request customization ↗",
        simple: "Simple and personal",
        yours: "Your invitation, not a generic template.",
        examples: "Digital invitation examples",
        direction: "Explore a visual direction.",
        interactive: "Interactive template",
        more: "Looking for more options?",
        collection: "ORBYVEN collection",
        other: "Other types of digital invitations.",
        faq: "Frequently asked questions",
        know: "What is worth knowing before you choose.",
        finalTitle: "Want something designed for your event?",
        finalCopy: "Tell us what you have in mind and we will shape the look and features together.",
        finalCta: "Talk to ORBYVEN ↗",
        otherServices: "Other services",
        privacy: "Privacy",
      }
    : {
        homeAria: "ORBYVEN CREATIVE — Acasă",
        navAria: "Navigație",
        models: "Modele",
        contact: "Contact",
        viewModels: "Vezi modelele ↓",
        request: "Solicită personalizare ↗",
        simple: "Simplu și personal",
        yours: "Invitația voastră, nu un model generic.",
        examples: "Exemple de invitații digitale",
        direction: "Descoperă o direcție vizuală.",
        interactive: "Model interactiv",
        more: "Cauți și alte opțiuni?",
        collection: "Colecția ORBYVEN",
        other: "Alte tipuri de invitații digitale.",
        faq: "Întrebări frecvente",
        know: "Ce merită să știi înainte să alegi.",
        finalTitle: "Vrei ceva creat pentru evenimentul tău?",
        finalCopy: "Spune-ne ce ai în minte și stabilim împreună aspectul și funcțiile invitației.",
        finalCta: "Discută cu ORBYVEN ↗",
        otherServices: "Alte servicii",
        privacy: "Confidențialitate",
      };

  return (
    <main className="min-h-screen bg-[#080912] text-[#f5f5fc]">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-8 sm:px-8">
        <Link href="/" className="text-sm font-semibold tracking-[.16em]" aria-label={copy.homeAria}>
          ORBYVEN <span className="text-[#ada7ff]">CREATIVE</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <nav aria-label={copy.navAria} className="hidden items-center gap-5 text-xs text-white/70 sm:flex sm:gap-8 sm:text-sm">
            <Link href="/servicii" className="hover:text-white">Web design</Link>
            <Link href="/templates" className="hover:text-white">{copy.models}</Link>
            <Link href="/contact" className="hover:text-white">{copy.contact}</Link>
          </nav>
          <LanguageSwitch initialLocale={locale} />
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-y border-white/10 px-5 py-24 sm:px-8 sm:py-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_20%,rgba(92,75,238,.23),transparent_55%),radial-gradient(ellipse_at_15%_85%,rgba(87,44,144,.20),transparent_55%)]" />
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-white/55"><Link href="/" className="hover:text-white">ORBYVEN CREATIVE</Link><span aria-hidden="true">/</span><span aria-current="page">{label}</span></nav>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[.24em] text-[#bcb6ff]">{label} · ORBYVEN CREATIVE</p>
          <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-7xl">{title}</h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">{introduction}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="#modele" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#080912] hover:bg-[#ebe9ff]">
              {copy.viewModels}
            </Link>
            <Link href="/contact" className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold hover:border-white">
              {copy.request}
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="ce-primesti" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#bcb6ff]">{copy.simple}</p>
        <h2 id="ce-primesti" className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">{copy.yours}</h2>
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
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#bcb6ff]">{copy.examples}</p>
          <h2 id="modele-titlu" className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">{copy.direction}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {previews.map((preview) => (
              <Link key={preview.href} href={preview.href} className="group flex min-h-48 flex-col justify-between rounded-[28px] border border-white/10 bg-[#141529] p-7 hover:border-[#ada7ff]/60">
                <span className="text-xs uppercase tracking-[.2em] text-[#bcb6ff]">{copy.interactive}</span>
                <span className="mt-8 block">
                  <span className="block text-2xl font-semibold">{preview.title} <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">↗</span></span>
                  <span className="mt-2 block text-sm leading-6 text-white/60">{preview.description}</span>
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-sm leading-7 text-white/60">
            {copy.more} <Link href={relatedHref} className="font-semibold text-[#c9c5ff] underline underline-offset-4">{relatedLabel}</Link>.
          </p>
        </div>
      </section>

      <section aria-labelledby="alte-invitatii" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#bcb6ff]">{copy.collection}</p>
        <h2 id="alte-invitatii" className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">{copy.other}</h2>
        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {relatedInvitationCategories.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[26px] border border-white/10 bg-white/[.04] p-6 transition hover:border-[#ada7ff]/55"
            >
              <span className="text-xl font-semibold">{item.label} <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span></span>
              <span className="mt-3 block text-sm leading-6 text-white/58">{item.copy}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="intrebari-frecvente" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#bcb6ff]">{copy.faq}</p>
        <h2 id="intrebari-frecvente" className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">{copy.know}</h2>
        <div className="mt-9 divide-y divide-white/10 border-y border-white/10">
          {faq.map(({ question, answer }) => (
            <article key={question} className="grid gap-3 py-6 md:grid-cols-[.9fr_1.1fr] md:gap-10">
              <h3 className="text-base font-semibold">{question}</h3>
              <p className="text-sm leading-7 text-white/65">{answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-7 px-5 py-20 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">{copy.finalTitle}</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">{copy.finalCopy}</p>
        </div>
        <Link href="/contact" className="shrink-0 self-start rounded-full bg-white px-7 py-4 text-sm font-semibold text-[#080912] md:self-auto">{copy.finalCta}</Link>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 border-t border-white/10 px-5 py-8 text-sm text-white/55 sm:px-8">
        <Link href="/">© 2026 ORBYVEN CREATIVE</Link>
        <nav aria-label={copy.otherServices} className="flex flex-wrap gap-5">
          {categories.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
          <Link href="/servicii">Web design</Link>
          <Link href="/legal/privacy">{copy.privacy}</Link>
        </nav>
      </footer>
    </main>
  );
}
