"use client";

import ClientTemplatePreview from "@/components/ClientTemplatePreview";
import FeaturedTemplatePreview from "@/components/FeaturedTemplatePreview";
import TemplateCardPreviewFrame from "@/components/TemplateCardPreviewFrame";
import type { FeaturedTemplate } from "@/lib/featured-templates";
import { featuredTemplatesEn as featured, clientTemplateListEn } from "@/lib/public-catalog-en";
import SiteFooter from "@/components/SiteFooterEn";
import SiteHeader from "@/components/SiteHeaderEn";
import type { ClientTemplateConfig } from "@/lib/client-template-catalog";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type Theme = "light" | "dark";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

function useHydrationSafeReducedMotion() {
  const prefersReducedMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHydrated(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return hydrated ? Boolean(prefersReducedMotion) : false;
}



const templateCategories = [
  {
    id: "construction-installation",
    short: "Construction",
    kicker: "Construction · systems · infrastructure",
    title: "Construction & building systems",
    description: "For companies that deliver physical projects and need to build trust before the first quote.",
    featuredHrefs: ["/templates/asfaltari-bucuresti", "/templates/pilot-013-construction"],
    catalogSlugs: ["pilot-002", "instalatii"],
  },
  {
    id: "events-invitations",
    short: "Events",
    kicker: "Events · digital invitations",
    title: "Events & invitations",
    description: "From event services to complete digital invitations, with strong atmosphere and clear actions.",
    featuredHrefs: ["/templates/obsidian-moments", "/demo/nunta/elegant", "/templates/botez-fetita", "/templates/botez-baietel", "/templates/majorat"],
    catalogSlugs: ["evenimente"],
  },
  {
    id: "auto-detailing",
    short: "Auto",
    kicker: "Auto · detailing",
    title: "Auto & detailing",
    description: "Visual experiences for automotive services where the result needs to be obvious at a glance.",
    featuredHrefs: ["/templates/haos-customs", "/templates/pilot-009-auto-service"],
    catalogSlugs: [],
  },
  {
    id: "retail-beauty",
    short: "Lifestyle",
    kicker: "Retail · beauty · lifestyle",
    title: "Retail, beauty & lifestyle",
    description: "Products and services bought with the eyes: strong visuals, simple selection and fast conversion.",
    featuredHrefs: ["/templates/florarie-bragadiru", "/templates/barbershop", "/templates/pilot-006-barbershop"],
    catalogSlugs: ["beauty"],
  },
  {
    id: "restaurants-cafes",
    short: "Food & drink",
    kicker: "Food · restaurant · café",
    title: "Restaurants & cafés",
    description: "Menu, products, reservations and a clear path to ordering.",
    featuredHrefs: ["/templates/pilot-007-restaurant"],
    catalogSlugs: [],
  },
  {
    id: "real-estate",
    short: "Real estate",
    kicker: "Listings · filters · viewings",
    title: "Real estate",
    description: "Easy-to-explore listings, useful filters and comparison before a viewing.",
    featuredHrefs: ["/templates/pilot-008-real-estate"],
    catalogSlugs: [],
  },
  {
    id: "hospitality",
    short: "Hospitality",
    kicker: "Boutique hotel · stays · retreats",
    title: "Hospitality & stays",
    description: "Rooms, dates, capacity and stay totals before confirmation.",
    featuredHrefs: ["/templates/pilot-011-retreat"],
    catalogSlugs: [],
  },
  {
    id: "sports-fitness",
    short: "Fitness",
    kicker: "Fitness · classes · memberships",
    title: "Sports & fitness",
    description: "Recurring experiences for classes, coaches and memberships.",
    featuredHrefs: ["/templates/pilot-012-movement"],
    catalogSlugs: [],
  },
  {
    id: "medical",
    short: "Medical",
    kicker: "Medical · professional services",
    title: "Medical",
    description: "Clear information, trust and simple booking for services where comfort matters.",
    featuredHrefs: ["/templates/pilot-010-dental-clinic"],
    catalogSlugs: ["clinica-dentara"],
  },
] as const;


function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduceMotion = useHydrationSafeReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.992 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.72, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AccentTitle({ text }: { text: string }) {
  const splitAt = text.lastIndexOf(" ");
  if (splitAt < 0) return <span className="text-[var(--home-violet)]">{text}</span>;
  return (
    <>
      {text.slice(0, splitAt + 1)}
      <span className="relative z-10 -mx-[0.018em] text-[var(--home-violet)]">{text.slice(splitAt + 1)}</span>
    </>
  );
}

function FeaturedCard({ item, delay = 0 }: { item: FeaturedTemplate; delay?: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Link
        href={item.href}
        className="group flex min-h-[590px] h-full flex-col overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_20px_70px_rgba(0,0,0,.055)] transition duration-500 hover:-translate-y-1 hover:border-[var(--home-violet)]/35 hover:shadow-[0_30px_100px_rgba(0,0,0,.12)] sm:h-[610px]"
      >
        <div className="flex flex-1 items-start justify-between gap-5 px-3 pb-5 pt-3 sm:px-4 sm:pt-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">{item.label}</p>
              <span className="text-[8px] text-[var(--muted)]/65">· {item.meta}</span>
            </div>
            <h3 className="mt-3 text-[30px] font-semibold leading-[.96] tracking-[-.05em] sm:text-[34px]">{item.title}</h3>
            <p className="mt-3 max-w-xl text-[11px] leading-5 text-[var(--muted)]">{item.subtitle}</p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--button)] text-[var(--button-text)] transition duration-300 group-hover:rotate-45">↗</span>
        </div>

        <TemplateCardPreviewFrame>
          <FeaturedTemplatePreview kind={item.kind} />
        </TemplateCardPreviewFrame>
      </Link>
    </Reveal>
  );
}

function CatalogCard({ template, delay = 0 }: { template: ClientTemplateConfig; delay?: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Link
        href={`/templates/${template.slug}`}
        className="group flex min-h-[590px] h-full flex-col overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_20px_70px_rgba(0,0,0,.055)] transition duration-500 hover:-translate-y-1 hover:border-[var(--home-violet)]/35 hover:shadow-[0_30px_100px_rgba(0,0,0,.12)] sm:h-[610px]"
      >
        <div className="flex flex-1 items-start justify-between gap-5 px-3 pb-5 pt-3 sm:px-4 sm:pt-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">{template.category}</p>
              <span className="text-[8px] text-[var(--muted)]/65">· ORBYVEN template</span>
            </div>
            <h3 className="mt-3 text-[30px] font-semibold leading-[.96] tracking-[-.05em] sm:text-[34px]">{template.title}</h3>
            <p className="mt-3 max-w-xl text-[11px] leading-5 text-[var(--muted)]">{template.description}</p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--button)] text-[var(--button-text)] transition duration-300 group-hover:rotate-45">↗</span>
        </div>

        <TemplateCardPreviewFrame>
          <ClientTemplatePreview template={template} compact />
        </TemplateCardPreviewFrame>
      </Link>
    </Reveal>
  );
}

export default function TemplatesPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const reduceMotion = useHydrationSafeReducedMotion();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("studio-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextTheme: Theme = saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";
      setTheme(nextTheme);
      document.documentElement.style.colorScheme = nextTheme;
      document.body.style.backgroundColor = nextTheme === "dark" ? "#000000" : "#ffffff";
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#000000" : "#ffffff";
      return next;
    });
  };

  const vars = {
    "--bg": theme === "dark" ? "#050506" : "#f7f7f8",
    "--surface": theme === "dark" ? "#0d0d0f" : "#ffffff",
    "--surface-2": theme === "dark" ? "#151518" : "#eeeeF1",
    "--text": theme === "dark" ? "#f5f5f7" : "#111114",
    "--muted": theme === "dark" ? "#9a9aa0" : "#6b6b72",
    "--border": theme === "dark" ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.08)",
    "--button": theme === "dark" ? "#f5f5f7" : "#111114",
    "--button-text": theme === "dark" ? "#050506" : "#ffffff",
    "--home-violet": "#a58bff",
    "--accent-soft": theme === "dark" ? "rgba(123,92,255,.16)" : "rgba(111,78,255,.10)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.15)",
    "--template-canvas": theme === "dark" ? "#09090d" : "#f8f8fa",
  } as CSSProperties;

  const templateGroups = templateCategories.map((category) => {
    const categoryFeatured = category.featuredHrefs.flatMap((href) => {
      const item = featured.find((entry) => entry.href === href);
      return item ? [item] : [];
    });
    const categoryCatalog = category.catalogSlugs.flatMap((slug) => {
      const item = clientTemplateListEn.find((entry) => entry.slug === slug);
      return item ? [item] : [];
    });

    return {
      ...category,
      featured: categoryFeatured,
      catalog: categoryCatalog,
      count: categoryFeatured.length + categoryCatalog.length,
    };
  });

  return (
    <main
      lang="en"
      style={{ ...vars, fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif" }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--template-canvas)] text-[var(--text)] antialiased"
    >
      <SiteHeader theme={theme} compact={false} activePage="templates" onToggleTheme={toggleTheme} />

      <section className="relative isolate flex min-h-[94svh] items-end overflow-hidden px-5 pb-10 pt-32 text-white sm:px-6 md:px-10 md:pb-16 md:pt-40">
        <div className="absolute inset-0 -z-40 bg-[#07070a]" />
        <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_68%_25%,rgba(115,83,255,.35),transparent_26%),radial-gradient(circle_at_24%_68%,rgba(70,51,150,.24),transparent_32%),linear-gradient(180deg,#161027_0%,#09080f_68%,#07070a_100%)]" />
        <div className="absolute inset-0 -z-20 opacity-[.12] [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-[240px] bg-[linear-gradient(to_bottom,transparent,var(--template-canvas))]" />

        {!reduceMotion ? (
          <>
            <motion.div
              aria-hidden="true"
              className="absolute left-[8%] top-[22%] h-52 w-52 rounded-full bg-violet-500/12 blur-[90px]"
              animate={{ x: [0, 46, -12, 0], y: [0, 22, 42, 0], scale: [1, 1.18, .96, 1] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute right-[11%] top-[16%] h-72 w-72 rounded-full border border-white/8"
              animate={{ rotate: 360, scale: [1, 1.08, 1] }}
              transition={{ rotate: { duration: 32, repeat: Infinity, ease: "linear" }, scale: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
            />
          </>
        ) : null}

        <div className="relative mx-auto grid w-full max-w-[1520px] gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: .6 }}
              className="text-[9px] font-semibold uppercase tracking-[.27em] text-white/46"
            >
              ORBYVEN · Template system
            </motion.p>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 34 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: .9, delay: .06, ease }}
              className="mt-6 max-w-[1120px] text-[clamp(62px,10vw,150px)] font-semibold leading-[.78] tracking-[-.078em]"
            >
              See it.
              <br />
              <span className="text-white/35">Understand it.</span>
              <br />
              Choose it.
            </motion.h1>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: .75, delay: .18, ease }}
            className="lg:pb-2"
          >
            <p className="max-w-md text-[15px] leading-7 text-white/55">
              No endless explanations. Open a template and see immediately whether the direction fits.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["01 · enter", "02 · explore", "03 · choose"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[.045] px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[.13em] text-white/55 backdrop-blur">
                  {item}
                </span>
              ))}
            </div>
            <a href="#templates-library" className="mt-8 inline-flex h-12 items-center rounded-full bg-white px-6 text-[12px] font-semibold text-black transition hover:-translate-y-0.5">
              Explore templates ↓
            </a>
          </motion.div>
        </div>
      </section>

      <section id="templates-library" className="mx-auto max-w-[1520px] px-5 pb-8 pt-14 sm:px-6 md:px-10 md:pb-10 md:pt-20">
        <div className="flex flex-col gap-7 pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="orbyven-home-kicker"><span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span><span>The ORBYVEN library</span><span aria-hidden="true" className="orbyven-home-kicker-line" /></p>
            <h2 className="mt-4 text-[clamp(42px,6vw,76px)] font-semibold leading-[.9] tracking-[-.062em]">
              Choose the <span className="relative z-10 -mx-[0.018em] text-[var(--home-violet)]">industry.</span>
              <br />
              Then choose the direction.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">
            Templates are grouped by business type so you can reach relevant examples quickly.
          </p>
        </div>

        <div className="sticky top-[72px] z-30 -mx-1 mt-5 overflow-x-auto px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
            {templateGroups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 text-[10px] font-semibold shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[var(--text)]/20"
              >
                <span>{group.short}</span>
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--surface-2)] px-1.5 text-[8px] text-[var(--muted)]">{group.count}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {templateGroups.map((group) => (
        <section
          key={group.id}
          id={group.id}
          className="mx-auto max-w-[1520px] scroll-mt-28 px-5 py-12 sm:px-6 md:px-10 md:py-16"
        >
          <div className="mb-8 grid gap-5 pt-5 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
            <div>
              <p className="orbyven-home-kicker"><span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span><span>{group.kicker}</span><span aria-hidden="true" className="orbyven-home-kicker-line" /></p>
              <h2 className="mt-4 text-[clamp(38px,5vw,62px)] font-semibold leading-[.92] tracking-[-.058em]"><AccentTitle text={group.title} /></h2>
            </div>
            <div className="flex items-end justify-between gap-5">
              <p className="max-w-xl text-[13px] leading-6 text-[var(--muted)]">{group.description}</p>
              <span className="hidden shrink-0 text-[9px] font-semibold uppercase tracking-[.14em] text-[var(--muted)] md:block">
                {group.count} {group.count === 1 ? "template" : "templates"}
              </span>
            </div>
          </div>

          {group.id === "events-invitations" ? (
            <nav aria-label="ORBYVEN digital invitations" className="mb-7 flex flex-wrap gap-2">
              <Link href="/contact?service=digital-invitation&type=wedding" className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs font-semibold">Wedding invitations ↗</Link>
              <Link href="/contact?service=digital-invitation&type=celebration" className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs font-semibold">Celebration invitations ↗</Link>
              <Link href="/contact?service=digital-invitation&type=birthday" className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs font-semibold">Birthday invitations ↗</Link>
            </nav>
          ) : null}

          <div className="grid auto-rows-fr gap-4 xl:grid-cols-2">
            {group.featured.map((item, index) => (
              <FeaturedCard key={item.href} item={item} delay={Math.min(index * .035, .12)} />
            ))}
            {group.catalog.map((template, index) => (
              <CatalogCard
                key={template.slug}
                template={template}
                delay={Math.min((group.featured.length + index) * .035, .12)}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="px-5 pb-8 sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1520px] overflow-hidden rounded-[36px] bg-[var(--button)] px-7 py-14 text-[var(--button-text)] sm:px-9 md:px-12 md:py-16">
          <p className="text-[9px] font-bold uppercase tracking-[.2em] opacity-45">Make it yours from here</p>
          <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-4xl text-[clamp(44px,6vw,74px)] font-semibold leading-[.9] tracking-[-.06em]">Like the direction?<br />We adapt it to your business.</h2>
            <Link href="/contact" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] px-6 text-[12px] font-semibold text-[var(--text)]">Get started →</Link>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="templates" />
    </main>
  );
}
