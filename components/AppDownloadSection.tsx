import Link from "next/link";

const WINDOWS_INSTALLER_URL =
  "https://github.com/HaoHajde/orbyven-creative/releases/download/desktop-latest/ORBYVEN-Windows-Setup.exe";

function WindowsMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className="h-7 w-7 fill-current">
      <path d="M2 4.4 12.8 2.9v10.4H2V4.4Zm12.3-1.7L26 1v12.3H14.3V2.7ZM2 14.7h10.8v10.4L2 23.6v-8.9Zm12.3 0H26V27l-11.7-1.7V14.7Z" />
    </svg>
  );
}

function PhoneMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className="h-7 w-7 fill-none stroke-current" strokeWidth="1.7">
      <rect x="7" y="2.5" width="14" height="23" rx="4.2" />
      <path d="M11.5 5.2h5" strokeLinecap="round" />
      <circle cx="14" cy="22.1" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.7">
      <path d="M10 3v10m0 0 4-4m-4 4L6 9M4 16h12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.7">
      <path d="M4 10h11m0 0-4-4m4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AppDownloadSection({
  locale = "ro",
}: {
  locale?: "ro" | "en";
}) {
  const copy =
    locale === "ro"
      ? {
          eyebrow: "ORBYVEN APPS",
          title: "ORBYVEN, oriunde lucrezi.",
          intro:
            "Același workspace. Aceleași date. Pe desktop sau în buzunar, fără să schimbi felul în care lucrezi.",
          windows: "ORBYVEN pentru Windows",
          windowsNote: "Aplicația desktop pentru birou, lucrări și operațiuni zilnice.",
          windowsMeta: "Windows 10 / 11",
          windowsBadge: "Alpha",
          windowsCta: "Descarcă pentru Windows",
          windowsFoot: "Installer .exe · actualizări continue",
          ios: "ORBYVEN pentru iPhone & iPad",
          iosNote: "Instalează acum Web App-ul ORBYVEN direct din Safari, full-screen.",
          iosMeta: "iPhone / iPad",
          iosBadge: "Web App",
          iosCta: "Instalează pe iOS",
          iosFoot: "Gratuit acum · TestFlight / App Store ulterior",
          available: "Disponibil acum",
        }
      : {
          eyebrow: "ORBYVEN APPS",
          title: "ORBYVEN, wherever you work.",
          intro:
            "The same workspace. The same data. On your desktop or in your pocket, without changing how you work.",
          windows: "ORBYVEN for Windows",
          windowsNote: "The desktop app for office work, jobs and everyday operations.",
          windowsMeta: "Windows 10 / 11",
          windowsBadge: "Alpha",
          windowsCta: "Download for Windows",
          windowsFoot: "Installer .exe · continuous updates",
          ios: "ORBYVEN for iPhone & iPad",
          iosNote: "Install the ORBYVEN Web App directly from Safari, full-screen.",
          iosMeta: "iPhone / iPad",
          iosBadge: "Web App",
          iosCta: "Install on iOS",
          iosFoot: "Free now · TestFlight / App Store later",
          available: "Available now",
        };

  return (
    <section className="relative z-10 overflow-hidden px-4 pb-10 pt-7 sm:px-6 md:px-10 md:pb-16 md:pt-10">
      <div className="relative mx-auto max-w-[1500px] overflow-hidden rounded-[38px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_30px_100px_rgba(0,0,0,.08)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(circle at 9% 10%, rgba(116,88,215,.14), transparent 28%), radial-gradient(circle at 88% 18%, rgba(73,116,255,.12), transparent 26%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-[-96px] h-[280px] w-[280px] rounded-full border border-[var(--border)] opacity-50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 top-[-32px] h-[150px] w-[150px] rounded-full border border-[var(--border)] opacity-40"
        />

        <div className="relative p-5 sm:p-7 md:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--surface-2)]/80 px-3 py-1.5 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7460f0] shadow-[0_0_14px_rgba(116,96,240,.7)]" />
                <span className="text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">
                  {copy.eyebrow}
                </span>
              </div>

              <h2 className="mt-5 max-w-[650px] text-[clamp(38px,5.1vw,68px)] font-semibold leading-[.93] tracking-[-.065em] text-[var(--text)]">
                {copy.title}
              </h2>
              <p className="mt-5 max-w-lg text-[13px] leading-6 text-[var(--muted)] sm:text-[14px]">
                {copy.intro}
              </p>

              <div className="mt-7 hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted-2)] lg:flex">
                <span className="flex h-7 items-center rounded-full border border-[var(--border)] px-3">
                  Windows
                </span>
                <span className="h-px w-8 bg-[var(--border)]" />
                <span className="flex h-7 items-center rounded-full border border-[var(--border)] px-3">
                  iOS
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={WINDOWS_INSTALLER_URL}
                className="group relative min-h-[300px] overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1422] p-5 text-white shadow-[0_26px_70px_rgba(11,18,32,.26)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(11,18,32,.34)] sm:p-6"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#476ff0]/25 blur-3xl transition duration-500 group-hover:scale-110"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-[-68px] left-[-46px] h-44 w-44 rounded-full border border-white/10"
                />

                <div className="relative flex h-full min-h-[250px] flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[15px] border border-white/10 bg-white/[.08] text-[#98b1ff] shadow-inner">
                      <WindowsMark />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[.07] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-white/60">
                      {copy.windowsBadge}
                    </span>
                  </div>

                  <div className="mt-8">
                    <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-white/42">
                      {copy.windowsMeta}
                    </p>
                    <h3 className="mt-2 text-[25px] font-semibold leading-tight tracking-[-.045em]">
                      {copy.windows}
                    </h3>
                    <p className="mt-3 max-w-sm text-[12px] leading-5 text-white/52">
                      {copy.windowsNote}
                    </p>
                  </div>

                  <div className="mt-auto pt-8">
                    <div className="flex min-h-12 items-center justify-between gap-3 rounded-[15px] bg-white px-4 text-[12px] font-semibold text-[#111726] transition group-hover:bg-[#f3f5ff]">
                      <span>{copy.windowsCta}</span>
                      <ArrowDown />
                    </div>
                    <p className="mt-3 text-[9px] leading-4 text-white/34">{copy.windowsFoot}</p>
                  </div>
                </div>
              </a>

              <Link
                href="/download/ios"
                className="group relative min-h-[300px] overflow-hidden rounded-[30px] border border-[var(--border)] bg-[color:var(--surface-2)]/86 p-5 shadow-[0_20px_60px_rgba(0,0,0,.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[0_26px_80px_rgba(0,0,0,.10)] sm:p-6"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#8b7cff]/15 blur-3xl transition duration-500 group-hover:scale-110"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-16 -right-8 h-40 w-40 rounded-[42px] border border-[var(--border)] opacity-60"
                />

                <div className="relative flex h-full min-h-[250px] flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[15px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-sm">
                      <PhoneMark />
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">
                      {copy.iosBadge}
                    </span>
                  </div>

                  <div className="mt-8">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#7460f0]" />
                      <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[var(--muted-2)]">
                        {copy.available}
                      </p>
                    </div>
                    <h3 className="mt-2 text-[25px] font-semibold leading-tight tracking-[-.045em] text-[var(--text)]">
                      {copy.ios}
                    </h3>
                    <p className="mt-3 max-w-sm text-[12px] leading-5 text-[var(--muted)]">
                      {copy.iosNote}
                    </p>
                  </div>

                  <div className="mt-auto pt-8">
                    <div className="flex min-h-12 items-center justify-between gap-3 rounded-[15px] border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-[12px] font-semibold text-[var(--text)] transition group-hover:bg-[var(--accent-soft)]">
                      <span>{copy.iosCta}</span>
                      <ArrowRight />
                    </div>
                    <p className="mt-3 text-[9px] leading-4 text-[var(--muted-2)]">{copy.iosFoot}</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
