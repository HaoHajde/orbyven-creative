import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import SeoShell from "@/components/seo/SeoShell";
import { publicLocaleForHost, publicOriginForLocale } from "@/lib/domain-locale";

async function localeFromRequest() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host");

  return publicLocaleForHost(host);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await localeFromRequest();
  const origin = publicOriginForLocale(locale);
  const title =
    locale === "ro"
      ? "Instalează ORBYVEN pe iPhone și iPad"
      : "Install ORBYVEN on iPhone and iPad";
  const description =
    locale === "ro"
      ? "Instalează gratuit ORBYVEN ca Web App din Safari. TestFlight și App Store vor fi activate separat."
      : "Install ORBYVEN for free as a Web App from Safari. TestFlight and App Store distribution will be enabled separately.";

  return {
    title,
    description,
    alternates: {
      canonical: `${origin}/download/ios`,
      languages: {
        ro: "https://orbyven.ro/download/ios",
        en: "https://www.orbyven.com/download/ios",
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function IosDownloadPage() {
  const locale = await localeFromRequest();
  const ro = locale === "ro";

  return (
    <SeoShell locale={locale}>
      <section className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#4b46ee]">
            ORBYVEN · iOS
          </p>
          <h1 className="mt-5 max-w-5xl text-[clamp(50px,7vw,96px)] font-semibold leading-[.9] tracking-[-.065em]">
            {ro ? "ORBYVEN pe iPhone. Fără costuri suplimentare." : "ORBYVEN on iPhone. No extra cost."}
          </h1>
          <p className="mt-7 max-w-2xl text-[16px] leading-7 text-black/55">
            {ro
              ? "În etapa actuală instalezi ORBYVEN ca Web App direct din Safari. Se deschide full-screen, are icon ORBYVEN și folosește același cont și același workspace. Build-ul nativ TestFlight/App Store rămâne pregătit pentru etapa următoare."
              : "At this stage, install ORBYVEN directly from Safari as a Web App. It opens full-screen, uses the ORBYVEN icon, and keeps the same account and workspace. The native TestFlight/App Store build remains prepared for the next stage."}
          </p>

          <div className="mt-12 grid gap-3 md:grid-cols-3">
            {[
              ro
                ? ["01", "Deschide în Safari", "Intră pe ORBYVEN din Safari pe iPhone sau iPad."]
                : ["01", "Open in Safari", "Open ORBYVEN in Safari on your iPhone or iPad."],
              ro
                ? ["02", "Share", "Apasă butonul Share din Safari."]
                : ["02", "Share", "Tap the Share button in Safari."],
              ro
                ? ["03", "Add to Home Screen", "Alege Add to Home Screen / Open as Web App."]
                : ["03", "Add to Home Screen", "Choose Add to Home Screen / Open as Web App."],
            ].map(([number, title, copy]) => (
              <article key={number} className="rounded-[26px] border border-black/[.07] bg-[#f7f7f9] p-6">
                <span className="text-[9px] font-bold tracking-[.16em] text-black/28">{number}</span>
                <h2 className="mt-8 text-[26px] font-semibold tracking-[-.045em]">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-black/50">{copy}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              href="/workspace"
              className="inline-flex h-12 items-center rounded-full bg-[#171719] px-6 text-sm font-semibold text-white"
            >
              {ro ? "Deschide ORBYVEN →" : "Open ORBYVEN →"}
            </Link>
            <Link
              href="/servicii"
              className="inline-flex h-12 items-center rounded-full border border-black/10 px-6 text-sm font-semibold"
            >
              {ro ? "Înapoi la servicii" : "Back to services"}
            </Link>
          </div>

          <p className="mt-8 max-w-2xl text-xs leading-6 text-black/42">
            {ro
              ? "Notă: acesta este modul gratuit de instalare disponibil acum. Linkul TestFlight/App Store va înlocui acest flux când distribuția Apple este activată."
              : "Note: this is the free install path available now. The TestFlight/App Store link will replace this flow when Apple distribution is enabled."}
          </p>
        </div>
      </section>
    </SeoShell>
  );
}
