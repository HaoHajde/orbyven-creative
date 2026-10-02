import Link from "next/link";

const WINDOWS_INSTALLER_URL =
  "https://github.com/HaoHajde/orbyven-creative/releases/download/desktop-latest/ORBYVEN-Windows-Setup.exe";

export default function AppDownloadSection({
  locale = "ro",
}: {
  locale?: "ro" | "en";
}) {
  const copy =
    locale === "ro"
      ? {
          eyebrow: "ORBYVEN APPS",
          title: "Ia workspace-ul cu tine.",
          intro: "Windows pentru birou. iPhone și iPad prin ORBYVEN Web App, până la lansarea TestFlight/App Store.",
          windows: "Windows",
          windowsNote: "Aplicație desktop ORBYVEN · Alpha",
          windowsCta: "Descarcă .exe",
          ios: "iPhone / iPad",
          iosNote: "Instalare gratuită ca Web App din Safari",
          iosCta: "Instalează pe iOS",
        }
      : {
          eyebrow: "ORBYVEN APPS",
          title: "Take your workspace with you.",
          intro: "Windows for the desk. iPhone and iPad through the ORBYVEN Web App until TestFlight/App Store distribution is enabled.",
          windows: "Windows",
          windowsNote: "ORBYVEN desktop app · Alpha",
          windowsCta: "Download .exe",
          ios: "iPhone / iPad",
          iosNote: "Free Web App install from Safari",
          iosCta: "Install on iOS",
        };

  return (
    <section className="relative z-10 px-5 pb-8 pt-6 sm:px-6 md:px-10 md:pb-12">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,.06)] sm:p-8 md:p-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted-2)]">{copy.eyebrow}</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
          <div>
            <h2 className="max-w-3xl text-[clamp(34px,4.7vw,58px)] font-semibold leading-[.96] tracking-[-.055em] text-[var(--text)]">
              {copy.title}
            </h2>
            <p className="mt-4 max-w-xl text-[12px] leading-6 text-[var(--muted)]">{copy.intro}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={WINDOWS_INSTALLER_URL}
              className="group flex min-h-[150px] flex-col justify-between rounded-[24px] border border-[var(--border)] bg-[var(--surface-2)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">{copy.windows}</p>
                <p className="mt-2 text-[12px] leading-5 text-[var(--muted)]">{copy.windowsNote}</p>
              </div>
              <div className="mt-8 flex items-center justify-between text-sm font-semibold text-[var(--text)]">
                <span>{copy.windowsCta}</span>
                <span aria-hidden="true" className="transition group-hover:translate-x-1">↓</span>
              </div>
            </a>

            <Link
              href="/download/ios"
              className="group flex min-h-[150px] flex-col justify-between rounded-[24px] border border-[var(--border)] bg-[var(--surface-2)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">{copy.ios}</p>
                <p className="mt-2 text-[12px] leading-5 text-[var(--muted)]">{copy.iosNote}</p>
              </div>
              <div className="mt-8 flex items-center justify-between text-sm font-semibold text-[var(--text)]">
                <span>{copy.iosCta}</span>
                <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
