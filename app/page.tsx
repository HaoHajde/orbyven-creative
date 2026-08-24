"use client";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import OrbitalSystem from "@/components/OrbitalSystem";

import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

type Theme = "light" | "dark";

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

const reveal = {
  initial: { opacity: 0, y: 48 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.22 },
  transition: {
    duration: 0.85,
    ease: easeOut,
  },
};

export default function HomePage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [compactNav, setCompactNav] = useState(false);
  const [desktopMotion, setDesktopMotion] = useState(false);
  const [activeWarpSection, setActiveWarpSection] = useState<
    "intro" | "work" | "services" | "process" | "pricing" | "start" | null
  >(null);

  const heroRef = useRef<HTMLElement | null>(null);
  const statementRef = useRef<HTMLElement | null>(null);
  const workRef = useRef<HTMLElement | null>(null);

  const { scrollY, scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.35,
  });

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const { scrollYProgress: statementProgress } = useScroll({
    target: statementRef,
    offset: ["start end", "end start"],
  });

  // HERO cinematic motion
  const heroY = useTransform(heroProgress, [0, 1], [0, -170]);
  const heroOpacity = useTransform(heroProgress, [0, 0.68], [1, 0]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.955]);
  // Statement cinematic motion
  const statementOpacity = useTransform(
    statementProgress,
    [0.06, 0.24, 0.86, 1],
    [0, 1, 1, 0.55]
  );
  const statementY = useTransform(
    statementProgress,
    [0.06, 0.24, 0.86, 1],
    [90, 0, 0, -38]
  );
  const statementScale = useTransform(
    statementProgress,
    [0.06, 0.24, 0.86, 1],
    [0.94, 1, 1, 0.985]
  );
  const statementBlur = useTransform(
    statementProgress,
    [0.06, 0.24, 0.86, 1],
    [8, 0, 0, 1.5]
  );

  const statementFilter = useTransform(
    statementBlur,
    (value) => `blur(${value}px)`
  );

  useMotionValueEvent(scrollY, "change", (latest) => {
    setCompactNav(latest > 90);
  });

  useEffect(() => {
    const saved = window.localStorage.getItem("studio-theme");

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initialTheme: Theme =
      saved === "dark" || saved === "light"
        ? saved
        : prefersDark
          ? "dark"
          : "light";

    setTheme(initialTheme);
    document.documentElement.style.colorScheme = initialTheme;
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");

    const sync = () => {
      setDesktopMotion(media.matches);
    };

    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);


  useEffect(() => {
    const sectionIds = [
      "intro",
      "work",
      "services",
      "process",
      "pricing",
      "start",
    ] as const;

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio
          );

        if (visible.length > 0) {
          setActiveWarpSection(
            visible[0].target.id as
              | "intro"
              | "work"
              | "services"
              | "process"
              | "pricing"
              | "start"
          );
        }
      },
      {
        rootMargin: "-30% 0px -52% 0px",
        threshold: [0, 0.12, 0.28, 0.5],
      }
    );

    sections.forEach((section) =>
      observer.observe(section)
    );

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      return next;
    });
  };

  const vars = {
    "--bg": theme === "dark" ? "#000000" : "#ffffff",
    "--surface": theme === "dark" ? "#0c0c0e" : "#f5f5f7",
    "--surface-2": theme === "dark" ? "#151518" : "#fbfbfd",
    "--surface-3": theme === "dark" ? "#1d1d21" : "#efeff3",
    "--text": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--muted": theme === "dark" ? "#a1a1a6" : "#6e6e73",
    "--muted-2": theme === "dark" ? "#77777d" : "#86868b",
    "--border":
      theme === "dark"
        ? "rgba(255,255,255,0.09)"
        : "rgba(0,0,0,0.08)",
    "--border-strong":
      theme === "dark"
        ? "rgba(255,255,255,0.16)"
        : "rgba(0,0,0,0.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-2": "#6f42ff",
    "--accent-soft":
      theme === "dark"
        ? "rgba(75,70,238,0.18)"
        : "rgba(75,70,238,0.08)",
    "--accent-soft-2":
      theme === "dark"
        ? "rgba(111,66,255,0.11)"
        : "rgba(111,66,255,0.05)",
  } as CSSProperties;

  return (
    <main
      style={{
        ...vars,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="relative min-h-screen overflow-x-clip bg-[var(--bg)] text-[var(--text)] antialiased transition-colors duration-500"
    >
      {/* CINEMATIC SCROLL PROGRESS */}
      <motion.div
        style={{ scaleY: smoothProgress }}
        className="fixed right-0 top-0 z-[70] hidden h-screen w-[2px] origin-top bg-[var(--accent)] md:block"
      />

      <SiteHeader
        theme={theme}
        compact={compactNav}
        activePage="home"
        onToggleTheme={toggleTheme}
      />

      <WarpMenu activeSection={activeWarpSection} />
      <WarpChapterIndicator activeSection={activeWarpSection} />

      {/* HERO */}
      <section
        ref={heroRef}
        className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[var(--bg)] md:min-h-screen"
      >
        {/* ambient glows */}
        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none absolute left-1/2 top-[-29%] h-[760px] w-[1100px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-[150px]"
        />

        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none absolute right-[12%] top-[22%] h-56 w-56 rounded-full bg-[var(--accent-soft-2)] blur-[110px]"
        />

        {/* subtle grain-ish layer */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle_at_center,currentColor_0.7px,transparent_0.7px)] [background-size:7px_7px]"
        />

        <OrbitalSystem variant="hero" className="top-[48%]" />

        <motion.div
          style={{
            y: desktopMotion ? heroY : 0,
            opacity: desktopMotion ? heroOpacity : 1,
            scale: desktopMotion ? heroScale : 1,
          }}
          className="relative mx-auto flex w-full max-w-[1500px] -translate-y-[1vh] flex-col items-center px-5 text-center sm:px-6 md:-translate-y-[3vh] md:px-10"
        >
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.08, ease: easeOut }}
            className="mb-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-2)] sm:mb-9 sm:text-[11px] sm:tracking-[0.3em]"
          >
            ORBYVEN CREATIVE
          </motion.p>

          <div className="overflow-hidden pb-2">
            <motion.span
              initial={{ y: "115%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.05, delay: 0.16, ease: easeOut }}
              className="block text-[clamp(46px,13vw,56px)] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-[80px] sm:leading-[0.92] sm:tracking-[-0.066em] md:text-[104px] lg:text-[124px] xl:text-[132px]"
            >
              We build
            </motion.span>
          </div>

          <div className="overflow-hidden pb-4">
            <motion.span
              initial={{ y: "115%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.12, delay: 0.27, ease: easeOut }}
              className="block text-[clamp(46px,13vw,56px)] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-[80px] sm:leading-[0.92] sm:tracking-[-0.066em] md:text-[104px] lg:text-[124px] xl:text-[132px]"
            >
              what gets remembered.
            </motion.span>
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: desktopMotion ? heroOpacity : 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.35, duration: 0.8 }}
          className="absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5 text-[10px] text-[var(--muted-2)] sm:bottom-7 sm:gap-3 sm:text-[11px]"
        >
          <span>Scroll to explore</span>

          <motion.span
            animate={{ scaleY: [0.35, 1, 0.35], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-10 w-px origin-top bg-[var(--border-strong)]"
          />
        </motion.div>
      </section>

      {/* PINNED STATEMENT */}
      <section
        ref={statementRef}
        id="intro"
        className="relative min-h-[118svh] scroll-mt-24 overflow-hidden bg-[var(--bg)] sm:min-h-[132vh] md:min-h-[148vh] md:scroll-mt-28"
      >
        <div className="sticky top-0 flex min-h-[100svh] items-center justify-center overflow-hidden bg-[var(--bg)] px-5 sm:px-6 md:min-h-screen md:px-10">
          <div
            aria-hidden="true"
            className="hidden md:block pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-soft)] blur-[150px]"
          />

          <OrbitalSystem variant="accent" className="top-[50%] opacity-55" />

          <motion.div
            style={{
              opacity: desktopMotion ? statementOpacity : 1,
              y: desktopMotion ? statementY : 0,
              scale: desktopMotion ? statementScale : 1,
              filter: desktopMotion ? statementFilter : "none",
            }}
            className="relative mx-auto max-w-[1180px] text-center"
          >
            <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)] sm:mb-8 sm:text-[11px] sm:tracking-[0.25em]">
              Digital presence, rethought.
            </p>

            <h2 className="text-[38px] font-semibold leading-[1.02] tracking-[-0.052em] sm:text-[62px] sm:tracking-[-0.058em] md:text-[82px] lg:text-[98px]">
              Construim experiențe digitale care fac afacerile mai greu de ignorat.
            </h2>
          </motion.div>
        </div>
      </section>

      {/* SELECTED WORK */}
      <section
        ref={workRef}
        id="work"
        className="relative mx-auto max-w-[1500px] scroll-mt-24 bg-[var(--bg)] px-5 py-20 sm:px-6 sm:py-24 md:scroll-mt-28 md:px-10 md:py-36"
      >
        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none absolute right-[-10%] top-[8%] h-[460px] w-[460px] rounded-full bg-[var(--accent-soft-2)] blur-[140px]"
        />

        <motion.div {...reveal} className="relative">
          <SectionHeading
            eyebrow="Selected work"
            title="Proiecte care spun o poveste."
            description="Scroll-ul devine parte din prezentare."
          />
        </motion.div>

        <div className="relative mt-12 sm:mt-16">
          <ProjectCard
            href="/demo/nunta/diana-florin"
            index="01"
            category="Wedding · Interactive"
            title="Diana & Florin"
            description="Invitație digitală premium, cu RSVP, poveste, locații și experiență completă pentru invitați."
            variant="wedding"
          />

          <ProjectCard
            href="/templates/business"
            index="02"
            category="Business · Website"
            title="Business presence"
            description="Website-uri curate, rapide și construite pentru o primă impresie puternică."
            variant="business"
          />
        </div>

        <motion.div
          {...reveal}
          className="relative mt-14 flex justify-start md:justify-end"
        >
          <Link
            href="/templates"
            className="group inline-flex h-12 items-center justify-center gap-3 rounded-full border border-[var(--border-strong)] bg-[var(--bg)] px-6 text-sm font-medium transition duration-300 hover:bg-[var(--surface)]"
          >
            Vezi tot portofoliul

            <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRightIcon />
            </span>
          </Link>
        </motion.div>
      </section>

      {/* SERVICES */}
      <section
        id="services"
        className="relative scroll-mt-24 overflow-hidden border-y md:scroll-mt-28 border-[var(--border)] bg-[var(--surface)]"
      >
        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none absolute left-[-12%] top-[10%] h-[520px] w-[520px] rounded-full bg-[var(--accent-soft-2)] blur-[160px]"
        />

        <div className="relative mx-auto max-w-[1500px] px-5 py-20 sm:px-6 sm:py-24 md:px-10 md:py-40">
          <motion.div {...reveal}>
            <SectionHeading
              eyebrow="Services"
              title="Ce construim."
              description="Patru direcții. Aceeași obsesie pentru claritate, detaliu și experiență."
            />
          </motion.div>

          <div className="relative mt-12 border-t border-[var(--border)] sm:mt-16 md:mt-20">
            <ServiceChapter
              number="01"
              title="Websites"
              text="Site-uri de prezentare moderne pentru firme, servicii și branduri care vor să inspire încredere din prima secundă."
              accent="Digital presence"
            />

            <ServiceChapter
              number="02"
              title="Landing Pages"
              text="Pagini construite pentru campanii, produse sau servicii, unde fiecare element are un rol clar în parcursul utilizatorului."
              accent="Focused conversion"
            />

            <ServiceChapter
              number="03"
              title="Redesign"
              text="Refacem experiențe digitale care au rămas în urmă și le aducem la nivelul actual al brandului și al pieței."
              accent="Rebuild & evolve"
            />

            <ServiceChapter
              number="04"
              title="Digital Experiences"
              text="Invitații digitale și proiecte interactive în care designul, povestea și tehnologia funcționează împreună."
              accent="Beyond websites"
            />
          </div>

          <motion.div
            {...reveal}
            className="mt-12 flex justify-start md:justify-end"
          >
            <Link
              href="/servicii"
              className="group inline-flex h-12 items-center justify-center gap-3 rounded-full border border-[var(--border-strong)] bg-[var(--bg)] px-6 text-sm font-medium transition duration-300 hover:bg-[var(--surface-2)]"
            >
              Explorează toate serviciile

              <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRightIcon />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* BUSINESS MODEL */}
      <section
        id="process"
        className="relative scroll-mt-24 overflow-hidden bg-[var(--bg)] md:scroll-mt-28"
      >
        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none absolute right-[-12%] top-[8%] h-[560px] w-[560px] rounded-full bg-[var(--accent-soft)] blur-[180px]"
        />

        <div className="relative mx-auto max-w-[1500px] px-5 py-20 sm:px-6 sm:py-24 md:px-10 md:py-40">
          <div className="grid gap-12 sm:gap-16 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <motion.div {...reveal}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
                  Cum lucrăm
                </p>

                <h2 className="mt-6 max-w-2xl text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] sm:mt-7 sm:text-[64px] sm:tracking-[-0.06em] md:text-[76px]">
                  De la idee
                  <br />
                  la online.
                </h2>

                <p className="mt-8 max-w-md text-[16px] leading-7 text-[var(--muted)]">
                  Un proces simplu, fără ping-pong inutil și fără să transformăm
                  fiecare proiect într-o întâlnire de două ore.
                </p>
              </motion.div>

              <motion.div
                {...reveal}
                className="mt-10 border-t border-[var(--border)] pt-7"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">
                  Două moduri de a începe
                </p>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <span className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-xs font-medium">
                    Plată integrală
                  </span>

                  <span className="rounded-full bg-[var(--button)] px-4 py-2 text-xs font-medium text-[var(--button-text)]">
                    Abonament lunar
                  </span>
                </div>
              </motion.div>
            </div>

            <div className="relative">
              <div className="absolute bottom-0 left-[20px] top-0 hidden w-px bg-[var(--border)] md:block" />

              <ProcessScene
                number="01"
                label="Discover"
                title="Înțelegem ce trebuie construit."
                text="Pornim de la afacere, obiectiv și public. Stabilim ce trebuie să facă site-ul, nu doar cum trebuie să arate."
              />

              <ProcessScene
                number="02"
                label="Design & Build"
                title="Construim experiența."
                text="Design, structură, dezvoltare, responsive și toate detaliile care fac produsul să se simtă coerent."
              />

              <ProcessScene
                number="03"
                label="Launch & Care"
                title="Lansăm. Apoi rămânem aproape."
                text="Testăm, conectăm domeniul și publicăm. Dacă alegi abonamentul, hostingul, mentenanța și suportul rămân la noi."
                last
              />
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="relative scroll-mt-24 overflow-hidden border-y md:scroll-mt-28 border-[var(--border)] bg-[var(--surface)]"
      >
        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none absolute right-[-14%] top-[4%] h-[600px] w-[600px] rounded-full bg-[var(--accent-soft)] blur-[190px]"
        />

        <div className="relative mx-auto max-w-[1500px] px-5 py-20 sm:px-6 sm:py-24 md:px-10 md:py-40">
          <motion.div {...reveal}>
            <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
                  Pricing
                </p>

                <h2 className="mt-5 max-w-4xl text-[44px] font-semibold leading-[0.99] tracking-[-0.055em] sm:mt-6 sm:text-[64px] sm:tracking-[-0.06em] md:text-[78px]">
                  Începi simplu.
                  <br />
                  Crești când ai nevoie.
                </h2>
              </div>

              <p className="max-w-xl text-[16px] leading-7 text-[var(--muted)] lg:justify-self-end">
                Fără ofertare complicată pentru proiectele standard. Alegi
                nivelul potrivit, iar noi construim și administrăm experiența.
              </p>
            </div>
          </motion.div>

          <div className="mt-12 border-t border-[var(--border)] sm:mt-16 md:mt-20">
            <PricingScene
              name="START"
              number="01"
              price="149"
              description="Pentru o prezență online simplă, curată și profesionistă."
              features={[
                "1 pagină",
                "Design responsive",
                "Hosting & SSL",
                "SEO de bază",
                "1 modificare / lună",
              ]}
            />

            <PricingScene
              name="BUSINESS"
              number="02"
              price="249"
              description="Pentru firme care vor un website complet și administrat."
              features={[
                "Până la 5 pagini",
                "Formular & WhatsApp",
                "Analytics",
                "SEO extins",
                "2 modificări / lună",
              ]}
              featured
            />

            <PricingScene
              name="PRO"
              number="03"
              price="399"
              description="Pentru proiecte mai ample, integrări și suport prioritar."
              features={[
                "Până la 8–10 pagini",
                "Integrări personalizate",
                "Suport extins",
                "Prioritate",
                "Mentenanță inclusă",
              ]}
            />
          </div>

          <motion.div
            {...reveal}
            className="mt-8 grid gap-7 rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-5 sm:mt-10 sm:rounded-[30px] sm:p-7 md:grid-cols-[1fr_auto] md:items-center md:p-9"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">
                One-time
              </p>

              <h3 className="mt-3 text-[28px] font-semibold tracking-[-0.045em] sm:text-[34px]">
                Preferi să plătești proiectul integral?
              </h3>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Avem și variante fără abonament. Prețul final depinde de
                complexitate, funcționalități și volumul de conținut.
              </p>
            </div>

            <Link
              href="/contact"
              className="inline-flex h-12 w-full items-center justify-center gap-2 self-start rounded-full border border-[var(--border-strong)] px-6 text-sm font-medium transition hover:bg-[var(--surface)] sm:w-auto md:self-auto"
            >
              Cere o ofertă
              <ArrowUpRightIcon />
            </Link>
          </motion.div>

          <motion.p
            {...reveal}
            className="mt-6 text-xs leading-5 text-[var(--muted-2)]"
          >
            Abonamentele sunt gândite pentru colaborări pe termen de minimum 12 luni.
          </motion.p>
        </div>
      </section>

      {/* CTA */}
      <FinalCTA />

      <SiteFooter theme={theme} activePage="home" />
    </main>
  );
}

function scrollToSection(
  event: MouseEvent<HTMLAnchorElement>,
  id: string
) {
  event.preventDefault();

  const element = document.getElementById(id);

  if (!element) return;

  const navOffset = 88;
  const targetY =
    element.getBoundingClientRect().top +
    window.scrollY -
    navOffset;

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}#${id}`
  );

  window.scrollTo({
    top: targetY,
    behavior: "smooth",
  });
}

function warpToSection(id: string) {
  const element = document.getElementById(id);

  if (!element) {
    console.warn(
      `ORBYVEN WARP: section "${id}" not found.`
    );
    return;
  }

  element.scrollIntoView({
    behavior: "smooth",
    block: "start",
    inline: "nearest",
  });

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}#${id}`
  );
}

function WarpChapterIndicator({
  activeSection,
}: {
  activeSection:
    | "intro"
    | "work"
    | "services"
    | "process"
    | "pricing"
    | "start"
    | null;
}) {
  const chapters = {
    intro: { number: "01", label: "Intro" },
    work: { number: "02", label: "Portofoliu" },
    services: { number: "03", label: "Servicii" },
    process: { number: "04", label: "Cum lucrăm" },
    pricing: { number: "05", label: "Prețuri" },
    start: { number: "06", label: "Start" },
  } as const;

  if (!activeSection) return null;

  const chapter = chapters[activeSection];

  return (
    <motion.div
      key={activeSection}
      initial={{
        opacity: 0,
        y: -8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.32,
        ease: easeOut,
      }}
      className="pointer-events-none fixed left-1/2 top-[92px] z-[70] max-w-[calc(100vw-32px)] -translate-x-1/2 md:top-[96px]"
    >
      <div
        style={{
          backgroundColor: "var(--bg)",
        }}
        className="flex max-w-full items-center gap-2.5 rounded-full border border-[var(--border)] px-3 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.07)] sm:gap-3 sm:px-4"
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">
          WARP
        </span>

        <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />

        <span className="text-[10px] font-semibold tracking-[0.14em] text-[var(--muted-2)]">
          {chapter.number}
        </span>

        <span className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text)] sm:text-[10px] sm:tracking-[0.16em]">
          {chapter.label}
        </span>
      </div>
    </motion.div>
  );
}

/* WARP NAVIGATION */

function WarpMenu({
  activeSection,
}: {
  activeSection:
    | "intro"
    | "work"
    | "services"
    | "process"
    | "pricing"
    | "start"
    | null;
}) {
  const [open, setOpen] = useState(false);

  const items = [
    { id: "intro", label: "Intro", number: "01" },
    { id: "work", label: "Portofoliu", number: "02" },
    { id: "services", label: "Servicii", number: "03" },
    { id: "process", label: "Cum lucrăm", number: "04" },
    { id: "pricing", label: "Prețuri", number: "05" },
    { id: "start", label: "Start", number: "06" },
  ] as const;

  const handleWarp = (id: string) => {
    setOpen(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        warpToSection(id);
      });
    });
  };

  return (
    <div
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-[90] md:bottom-auto md:left-5 md:top-1/2 md:-translate-y-1/2"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <motion.div
        animate={{
          width: open ? 236 : 64,
        }}
        transition={{
          duration: 0.34,
          ease: easeOut,
        }}
        style={{
          backgroundColor: "var(--bg)",
        }}
        className="max-w-[calc(100vw-32px)] overflow-hidden rounded-[22px] border border-[var(--border-strong)] shadow-[0_18px_60px_rgba(0,0,0,0.14)] md:rounded-[24px]"
      >
        <button
          type="button"
          onClick={() =>
            setOpen((current) => !current)
          }
          aria-expanded={open}
          aria-label="Deschide navigarea rapidă în homepage"
          className="flex h-[68px] w-full flex-col items-center justify-center gap-1 px-2 text-center md:h-[76px] md:gap-1.5 md:px-3"
        >
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center md:h-8 md:w-8">
            <span className="absolute h-6 w-6 rounded-full border border-[var(--text)]/20 md:h-7 md:w-7" />
            <span className="absolute h-[11px] w-[11px] rounded-full border border-[var(--accent)]" />
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          </span>

          <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--text)]">
            WARP
          </span>
        </button>

        <motion.div
          initial={false}
          animate={{
            height: open ? "auto" : 0,
            opacity: open ? 1 : 0,
          }}
          transition={{
            duration: 0.28,
            ease: easeOut,
          }}
          className="overflow-hidden"
        >
          <div className="max-h-[68svh] overflow-y-auto border-t border-[var(--border)] px-2.5 pb-3 pt-2 md:max-h-none md:overflow-visible md:px-3">
            {items.map((item) => {
              const active =
                activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleWarp(item.id)
                  }
                  aria-current={
                    active
                      ? "location"
                      : undefined
                  }
                  className={`group flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-[var(--surface)] text-[var(--text)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300 ${
                      active
                        ? "scale-100 bg-[var(--accent)] opacity-100"
                        : "scale-75 bg-[var(--text)] opacity-20 group-hover:opacity-45"
                    }`}
                  />

                  <span className="min-w-0 flex-1 whitespace-nowrap">
                    {item.label}
                  </span>

                  <span className="text-[9px] font-semibold tracking-[0.14em] text-[var(--muted-2)]">
                    {item.number}
                  </span>
                </button>
              );
            })}

            <div className="mt-2 border-t border-[var(--border)] pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);

                  requestAnimationFrame(() => {
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });

                    window.history.replaceState(
                      null,
                      "",
                      window.location.pathname
                    );
                  });
                }}
                className="group flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] text-[10px] transition-transform duration-300 group-hover:-translate-y-0.5">
                  ↑
                </span>

                <span className="min-w-0 flex-1 whitespace-nowrap">
                  Înapoi sus
                </span>

                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
                  Top
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* HEADER */

/* HEADINGS */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
      <div>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">
          {eyebrow}
        </p>

        <h2 className="max-w-4xl text-[40px] font-semibold leading-[1.02] tracking-[-0.052em] sm:text-[58px] sm:tracking-[-0.055em] md:text-[72px]">
          {title}
        </h2>
      </div>

      <p className="max-w-xl text-[16px] leading-7 text-[var(--muted)] lg:justify-self-end">
        {description}
      </p>
    </div>
  );
}

/* PROJECTS */

function ProjectCard({
  href,
  index,
  category,
  title,
  description,
  variant,
}: {
  href: string;
  index: string;
  category: string;
  title: string;
  description: string;
  variant: "wedding" | "business";
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [desktopPreview, setDesktopPreview] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");

    const sync = () => {
      setDesktopPreview(media.matches);
    };

    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  const cardScale = useTransform(
    scrollYProgress,
    [0, 0.28, 0.72, 1],
    [0.94, 1, 1, 0.96]
  );

  const cardOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.82, 1],
    [0.35, 1, 1, 0.45]
  );

  const cardY = useTransform(
    scrollYProgress,
    [0, 0.28, 0.72, 1],
    [70, 0, 0, -55]
  );

  const previewY = useTransform(
    scrollYProgress,
    [0, 1],
    [28, -28]
  );

  const previewScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [1.025, 1, 1.018]
  );

  return (
    <div
      ref={cardRef}
      className="relative mb-8 min-h-0 sm:mb-10 md:mb-0 md:min-h-[125vh]"
    >
      <motion.div
        style={{
          scale: desktopPreview ? cardScale : 1,
          opacity: desktopPreview ? cardOpacity : 1,
          y: desktopPreview ? cardY : 0,
        }}
        className="relative md:sticky md:top-[96px]"
      >
        <div className="group relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_70px_rgba(0,0,0,0.09)] sm:rounded-[34px] md:rounded-[38px] md:shadow-[0_30px_100px_rgba(0,0,0,0.10)]">
          <div className="grid min-h-0 md:min-h-[calc(100vh-125px)] lg:grid-cols-[0.68fr_1.32fr]">
            <div className="relative z-10 flex flex-col justify-between p-6 sm:p-7 md:p-10 lg:p-12">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--muted-2)]">
                  {index}
                </span>

                <span className="text-xs font-medium text-[var(--muted-2)]">
                  {category}
                </span>
              </div>

              <div className="mt-10 sm:mt-14 md:mt-20">
                <h3 className="text-[40px] font-semibold leading-[0.98] tracking-[-0.052em] sm:text-[60px] sm:tracking-[-0.055em] md:text-[72px]">
                  {title}
                </h3>

                <p className="mt-6 max-w-md text-[15px] leading-7 text-[var(--muted)]">
                  {description}
                </p>

                <div className="mt-9 inline-flex items-center gap-2 text-sm font-medium">
                  Vezi proiectul
                  <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                    →
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`relative min-h-[390px] overflow-hidden p-3 sm:min-h-[460px] sm:p-5 md:min-h-[540px] md:p-7 lg:p-9 ${
                variant === "wedding"
                  ? "bg-[#eee9df]"
                  : "bg-[#09090b]"
              }`}
            >
              <motion.div
                style={{
                  y: desktopPreview ? previewY : 0,
                  scale: desktopPreview ? previewScale : 1,
                }}
                className="relative h-full min-h-[370px] overflow-hidden rounded-[22px] border border-white/10 bg-[#111113] shadow-[0_28px_70px_rgba(0,0,0,0.32)] will-change-transform sm:min-h-[440px] sm:rounded-[26px] md:min-h-[520px] md:rounded-[28px] md:shadow-[0_35px_100px_rgba(0,0,0,0.35)]"
              >
                <div className="relative z-10 flex h-12 items-center border-b border-white/10 bg-[#151518]/95 px-4 backdrop-blur-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  </div>

                  <div className="absolute left-1/2 hidden -translate-x-1/2 sm:block">
                    <div className="max-w-[300px] truncate rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-[10px] text-white/45">
                      {href}
                    </div>
                  </div>

                  <div className="ml-auto rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.13em] text-white/45">
                    Live preview
                  </div>
                </div>

                <div className="relative h-[calc(100%-48px)] min-h-[322px] overflow-hidden bg-white sm:min-h-[392px] md:min-h-[472px]">
                  {desktopPreview ? (
                    <>
                      <iframe
                        src={href}
                        title={`Preview ${title}`}
                        loading="lazy"
                        tabIndex={-1}
                        aria-hidden="true"
                        scrolling="no"
                        className="pointer-events-none absolute inset-0 h-full w-full border-0 bg-white grayscale transition-[filter] duration-1000 ease-out group-hover:grayscale-0"
                      />

                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.055] via-transparent to-black/[0.04] opacity-100 transition-opacity duration-1000 group-hover:opacity-40"
                      />

                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/[0.08] to-transparent"
                      />
                    </>
                  ) : (
                    <ProjectVisual variant={variant} />
                  )}
                </div>
              </motion.div>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.08] via-transparent to-white/[0.025]"
              />
            </div>
          </div>

          <Link
            href={href}
            aria-label={`Vezi proiectul ${title}`}
            className="absolute inset-0 z-20"
          />
        </div>
      </motion.div>
    </div>
  );
}

function ProjectVisual({
  variant,
}: {
  variant: "wedding" | "business";
}) {
  if (variant === "wedding") {
    return (
      <div className="relative flex h-full min-h-[322px] items-center justify-center overflow-hidden bg-[#f3efe6] p-5 sm:min-h-[392px] sm:p-7 md:min-h-[472px] md:p-12">
        <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_25%_20%,rgba(255,255,255,.9),transparent_30%),radial-gradient(circle_at_80%_75%,rgba(194,158,68,.18),transparent_34%)]" />

        <div className="relative w-full max-w-[540px] rounded-[24px] border border-[#d4af37]/25 bg-white/95 p-6 text-center shadow-[0_18px_50px_rgba(120,90,20,0.12)] sm:rounded-[28px] sm:p-8 md:rounded-[32px] md:p-12 md:backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#9b7a22]">
            Save the date
          </p>

          <p className="mt-7 text-[46px] font-light leading-none tracking-[-0.06em] text-[#312c24] sm:mt-9 sm:text-[56px] md:text-[72px]">
            D
            <span className="mx-3 text-[#b8860b]">&</span>
            F
          </p>

          <p className="mt-7 text-sm text-[#796d58]">
            10 · 10 · 2026
          </p>

          <div className="mx-auto mt-10 h-px w-20 bg-[#d4af37]/50" />

          <p className="mt-7 text-xs leading-5 text-[#8b806d]">
            Diana & Florin
            <br />
            Digital Wedding Invitation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[322px] items-center justify-center overflow-hidden bg-[#111113] p-5 sm:min-h-[392px] sm:p-7 md:min-h-[472px] md:p-12">
      <div className="absolute left-[10%] top-[10%] hidden h-60 w-60 rounded-full bg-white/[0.04] blur-3xl md:block" />

      <div className="relative w-full max-w-[650px] overflow-hidden rounded-[22px] border border-white/10 bg-[#1c1c1e] shadow-[0_20px_55px_rgba(0,0,0,0.38)] sm:rounded-[26px] md:rounded-[28px] md:shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
        <div className="flex h-11 items-center gap-1.5 border-b border-white/10 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </div>

        <div className="p-7 md:p-10">
          <p className="text-xs text-white/45">
            Your business, elevated.
          </p>

          <p className="mt-5 max-w-lg text-[32px] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[38px] md:text-[48px]">
            A stronger digital presence.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <div className="h-24 rounded-2xl bg-white/[0.06]" />
            <div className="h-24 rounded-2xl bg-white/[0.10]" />
            <div className="h-24 rounded-2xl bg-white/[0.06]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* SERVICES */

function ServiceChapter({
  number,
  title,
  text,
  accent,
}: {
  number: string;
  title: string;
  text: string;
  accent: string;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start end", "end start"],
  });

  const numberY = useTransform(
    scrollYProgress,
    [0, 1],
    [55, -55]
  );

  const contentY = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [32, 0, -18]
  );

  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.24, 0.8, 1],
    [0.25, 1, 1, 0.55]
  );

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7, ease: easeOut }}
      className="group relative min-h-0 overflow-hidden border-b border-[var(--border)] py-10 sm:py-12 md:min-h-[440px] md:py-16"
    >
      <motion.div
        aria-hidden="true"
        style={{ y: numberY }}
        className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 select-none text-[112px] font-semibold leading-none tracking-[-0.09em] text-[var(--text)] opacity-[0.035] transition-opacity duration-700 group-hover:opacity-[0.065] sm:text-[190px] md:text-[270px]"
      >
        {number}
      </motion.div>

      <motion.div
        style={{
          y: contentY,
          opacity: contentOpacity,
        }}
        className="relative z-10 grid gap-6 sm:gap-8 md:grid-cols-[90px_1.05fr_0.95fr] md:items-center md:gap-10"
      >
        <div>
          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[var(--border-strong)] px-3 text-xs font-medium text-[var(--muted-2)] transition-all duration-500 group-hover:border-[var(--text)] group-hover:text-[var(--text)]">
            {number}
          </span>
        </div>

        <div>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">
            {accent}
          </p>

          <h3 className="text-[36px] font-semibold leading-none tracking-[-0.05em] transition-transform duration-700 ease-out sm:text-[56px] sm:tracking-[-0.055em] md:text-[68px] md:group-hover:translate-x-2">
            {title}
          </h3>
        </div>

        <div className="md:justify-self-end">
          <p className="max-w-lg text-[15px] leading-7 text-[var(--muted)]">
            {text}
          </p>

          <div className="mt-7 hidden items-center gap-3 text-xs font-medium text-[var(--muted-2)] md:flex">
            <span className="h-px w-8 bg-[var(--border-strong)] transition-all duration-500 group-hover:w-14 group-hover:bg-[var(--text)]" />
            Explore
          </div>
        </div>
      </motion.div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[var(--text)] transition-transform duration-700 ease-out group-hover:scale-x-100"
      />
    </motion.div>
  );
}

/* PROCESS */

function ProcessScene({
  number,
  label,
  title,
  text,
  last = false,
}: {
  number: string;
  label: string;
  title: string;
  text: string;
  last?: boolean;
}) {
  const sceneRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start end", "end start"],
  });

  const contentY = useTransform(
    scrollYProgress,
    [0, 0.38, 0.72, 1],
    [60, 0, 0, -28]
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.22, 0.8, 1],
    [0.22, 1, 1, 0.48]
  );

  const numberScale = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    [0.82, 1, 0.92]
  );

  return (
    <div
      ref={sceneRef}
      className={`relative min-h-0 py-12 sm:py-14 md:min-h-[70vh] md:py-20 ${
        last ? "" : "border-b border-[var(--border)]"
      }`}
    >
      <motion.div
        style={{
          y: contentY,
          opacity,
        }}
        className="grid gap-6 sm:gap-8 md:grid-cols-[72px_1fr] md:gap-10"
      >
        <div className="relative">
          <motion.div
            style={{ scale: numberScale }}
            className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg)] text-[11px] font-semibold text-[var(--muted-2)]"
          >
            {number}
          </motion.div>
        </div>

        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">
            {label}
          </p>

          <h3 className="mt-4 text-[36px] font-semibold leading-[1.02] tracking-[-0.05em] sm:mt-5 sm:text-[52px] sm:tracking-[-0.055em] md:text-[64px]">
            {title}
          </h3>

          <p className="mt-7 max-w-2xl text-[15px] leading-7 text-[var(--muted)]">
            {text}
          </p>

          <div className="mt-10 flex items-center gap-3">
            <span className="h-px w-10 bg-[var(--border-strong)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
              ORBYVEN / {number}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* PRICING */

function PricingScene({
  name,
  number,
  price,
  description,
  features,
  featured = false,
}: {
  name: string;
  number: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start end", "end start"],
  });

  const rowY = useTransform(
    scrollYProgress,
    [0, 0.34, 0.76, 1],
    [44, 0, 0, -24]
  );

  const rowOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.82, 1],
    [0.35, 1, 1, 0.58]
  );

  const priceX = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [12, 0, -6]
  );

  return (
    <motion.div
      ref={rowRef}
      style={{
        y: rowY,
        opacity: rowOpacity,
      }}
      className={`group relative overflow-hidden border-b border-[var(--border)] ${
        featured ? "bg-[var(--button)] text-[var(--button-text)]" : ""
      }`}
    >
      {featured && (
        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none absolute right-[10%] top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[var(--accent)]/20 blur-[120px]"
        />
      )}

      <div className="relative grid min-h-0 gap-7 px-5 py-10 sm:gap-9 sm:px-8 sm:py-12 md:min-h-[360px] md:grid-cols-[72px_minmax(0,1fr)_minmax(240px,0.58fr)] md:items-center md:gap-8 md:px-10 md:py-16 lg:px-12">
        <div className="self-start md:self-center">
          <span
            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-xs font-medium ${
              featured
                ? "border-white/20 text-white/60"
                : "border-[var(--border-strong)] text-[var(--muted-2)]"
            }`}
          >
            {number}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                featured ? "text-white/55" : "text-[var(--muted-2)]"
              }`}
            >
              {name}
            </p>

            {featured && (
              <span className="rounded-full bg-white px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-black">
                Most popular
              </span>
            )}
          </div>

          <p className="mt-5 max-w-lg text-[20px] leading-8 tracking-[-0.025em]">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
            {features.map((feature) => (
              <div
                key={feature}
                className={`flex items-center gap-2 text-xs ${
                  featured ? "text-white/65" : "text-[var(--muted)]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    featured ? "bg-white/55" : "bg-[var(--text)]/35"
                  }`}
                />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          style={{ x: priceX }}
          className="min-w-0 w-full md:max-w-[320px] md:justify-self-end md:text-right"
        >
          <div className="flex min-w-0 items-end gap-2 md:justify-end">
            <span className="whitespace-nowrap text-[56px] font-semibold leading-[0.86] tracking-[-0.065em] sm:text-[64px] md:text-[clamp(64px,7vw,104px)] md:leading-[0.84] md:tracking-[-0.07em]">
              {price}
            </span>

            <span
              className={`pb-1 text-sm ${
                featured ? "text-white/55" : "text-[var(--muted-2)]"
              }`}
            >
              lei
            </span>
          </div>

          <p
            className={`mt-4 text-xs ${
              featured ? "text-white/50" : "text-[var(--muted-2)]"
            }`}
          >
            pe lună · minimum 12 luni
          </p>

          <Link
            href="/contact"
            className={`mt-7 inline-flex w-full max-w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition duration-300 sm:w-auto md:mt-8 md:group-hover:translate-x-1 ${
              featured
                ? "bg-white text-black"
                : "border border-[var(--border-strong)] hover:bg-[var(--bg)]"
            }`}
          >
            Alege {name}
            <ArrowUpRightIcon />
          </Link>
        </motion.div>
      </div>

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-700 group-hover:scale-x-100 ${
          featured ? "bg-white/35" : "bg-[var(--text)]"
        }`}
      />
    </motion.div>
  );
}

function FinalCTA() {
  const ctaRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ctaRef,
    offset: ["start end", "end start"],
  });

  const titleY = useTransform(
    scrollYProgress,
    [0, 0.42, 1],
    [70, 0, -36]
  );

  const titleOpacity = useTransform(
    scrollYProgress,
    [0, 0.24, 0.82, 1],
    [0.25, 1, 1, 0.6]
  );

  const ringScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [0.82, 1, 1.08]
  );

  return (
    <section
      ref={ctaRef}
      id="start"
      className="relative scroll-mt-24 overflow-hidden px-4 pb-0 pt-6 sm:px-6 sm:pt-8 md:scroll-mt-28 md:px-10 md:pt-12"
    >
      <div className="relative mx-auto min-h-[72svh] max-w-[1500px] overflow-hidden rounded-t-[30px] bg-[var(--button)] text-[var(--button-text)] sm:min-h-[78vh] sm:rounded-t-[38px] md:min-h-[82vh] md:rounded-t-[42px]">
        {/* Static cinematic atmosphere */}
        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]/10 blur-[170px]"
        />

        {/* Orbital motif */}
        <motion.div
          aria-hidden="true"
          style={{ scale: ringScale }}
          className="pointer-events-none absolute right-[-120px] top-1/2 h-[520px] w-[520px] -translate-y-1/2 opacity-[0.16] md:right-[-50px] md:h-[680px] md:w-[680px]"
        >
          <div className="absolute inset-0 rounded-full border border-current" />
          <div className="absolute inset-[13%] rounded-full border border-current opacity-55" />
          <div className="absolute left-1/2 top-1/2 h-[108%] w-[42%] -translate-x-1/2 -translate-y-1/2 rotate-[54deg] rounded-[50%] border border-current opacity-45" />
          <div className="absolute left-1/2 top-1/2 h-[108%] w-[42%] -translate-x-1/2 -translate-y-1/2 -rotate-[54deg] rounded-[50%] border border-current opacity-30" />
        </motion.div>

        <div className="relative z-10 flex min-h-[72svh] flex-col justify-between px-5 py-8 sm:min-h-[78vh] sm:px-10 sm:py-10 md:min-h-[82vh] md:px-14 md:py-14 lg:px-16">
          <div className="flex items-center justify-between gap-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] opacity-55">
              Start something
            </p>

            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40 sm:block">
              ORBYVEN CREATIVE · 2026
            </p>
          </div>

          <motion.div
            style={{
              y: titleY,
              opacity: titleOpacity,
            }}
            className="max-w-[1150px] py-16 sm:py-20 md:py-24"
          >
            <p className="mb-6 text-[13px] font-medium opacity-55">
              Ai un proiect în minte?
            </p>

            <h2 className="text-[48px] font-semibold leading-[0.91] tracking-[-0.065em] sm:text-[clamp(58px,8.4vw,132px)] sm:leading-[0.88] sm:tracking-[-0.075em]">
              Hai să-l facem
              <br />
              greu de ignorat.
            </h2>
          </motion.div>

          <div className="flex flex-col gap-8 border-t border-current/15 pt-8 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-md text-sm leading-6 opacity-55">
              Spune-ne ce vrei să construiești. De acolo ne ocupăm împreună de
              direcție, experiență și lansare.
            </p>

            <Link
              href="/contact"
              className="group inline-flex h-14 w-full shrink-0 items-center justify-center gap-4 self-start rounded-full bg-[var(--bg)] px-7 text-sm font-semibold text-[var(--text)] transition duration-500 sm:w-auto sm:self-auto md:hover:scale-[1.03]"
            >
              Începe un proiect

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] transition-transform duration-500 group-hover:rotate-45">
                <ArrowUpRightIcon />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* FOOTER */

/* ICONS */

function ArrowUpRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-[17px] w-[17px]"
    >
      <path d="M20.2 15.7A8.5 8.5 0 0 1 8.3 3.8 8.5 8.5 0 1 0 20.2 15.7Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-[17px] w-[17px]"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.42 1.42" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}
