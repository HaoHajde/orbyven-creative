"use client";

import Image from "next/image";
import { clientTemplateCatalog, type ClientTemplateSlug } from "@/lib/client-template-catalog";
import type { StudioDraft } from "@/lib/site-studio";

export default function StudioSitePreview({
  draft,
  templateSlug,
  mobile,
}: {
  draft: StudioDraft;
  templateSlug: ClientTemplateSlug;
  mobile: boolean;
}) {
  const image = clientTemplateCatalog[templateSlug].gallery.find((item) => item.image)?.image;
  const contrast = draft.foreground.toLowerCase() === "#ffffff";
  const muted = contrast ? "rgba(255,255,255,.65)" : "rgba(24,24,29,.60)";
  const subtle = contrast ? "rgba(255,255,255,.08)" : "rgba(24,24,29,.05)";
  const rule = contrast ? "rgba(255,255,255,.13)" : "rgba(24,24,29,.12)";

  return (
    <div
      className="min-h-full overflow-hidden rounded-[16px] font-sans"
      style={{ backgroundColor: draft.background, color: draft.foreground }}
    >
      <header className="flex items-center justify-between gap-3 border-b px-[5%] py-5" style={{ borderColor: rule }}>
        <span className="max-w-[65%] truncate text-[clamp(14px,1.7vw,21px)] font-bold tracking-[-.045em]">{draft.brandName}</span>
        <div className="flex items-center gap-5">
          {!mobile && <span className="text-xs" style={{ color: muted }}>Servicii &nbsp; Despre noi &nbsp; Contact</span>}
          <a href="#studio-preview-contact" className="rounded-full px-4 py-2 text-[10px] font-semibold" style={{ backgroundColor: draft.accent, color: "#ffffff" }}>
            Contact
          </a>
        </div>
      </header>

      <section className={mobile ? "flex flex-col" : "grid min-h-[470px] grid-cols-[1.05fr_.95fr]"}>
        <div className={mobile ? "px-6 py-11" : "flex flex-col justify-center px-[9%] py-14"}>
          <p className="text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: draft.accent }}>{draft.eyebrow}</p>
          <h2 className={mobile ? "mt-6 text-[38px] font-semibold leading-[.98] tracking-[-.055em]" : "mt-7 text-[clamp(33px,4vw,68px)] font-semibold leading-[.94] tracking-[-.06em]"}>
            {draft.headline}
          </h2>
          <p className="mt-6 max-w-xl text-[13px] leading-6" style={{ color: muted }}>{draft.description}</p>
          <a href="#studio-preview-contact" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full px-6 text-[12px] font-semibold" style={{ backgroundColor: draft.accent, color: "#ffffff" }}>
            {draft.buttonText} →
          </a>
        </div>
        <div className={mobile ? "relative min-h-[250px]" : "relative min-h-[470px]"} style={{ backgroundColor: subtle }}>
          {image ? (
            <Image src={image} alt="Exemplu vizual din template" fill sizes={mobile ? "360px" : "(max-width: 1024px) 100vw, 50vw"} className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(145deg, " + draft.accent + "45, transparent 80%)" }}>
              <span className="text-[clamp(45px,9vw,110px)] font-black uppercase tracking-[-.08em] opacity-25">{draft.brandName.slice(0, 2)}</span>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 max-w-xs rounded-2xl border border-white/20 bg-black/45 p-4 text-white backdrop-blur-sm">
            <p className="text-[8px] font-semibold uppercase tracking-[.18em] text-white/60">Afacerea ta · în prim-plan</p>
            <p className="mt-2 text-sm font-semibold">{draft.eyebrow}</p>
          </div>
        </div>
      </section>

      <section className={mobile ? "px-6 py-10" : "px-[6%] py-14"} style={{ backgroundColor: subtle }}>
        <p className="text-[10px] font-semibold uppercase tracking-[.18em]" style={{ color: draft.accent }}>Ce oferim</p>
        <h3 className={mobile ? "mt-3 text-3xl font-semibold" : "mt-3 text-4xl font-semibold"}>Servicii, fără complicații.</h3>
        <div className={mobile ? "mt-7 grid gap-3" : "mt-8 grid grid-cols-3 gap-3"}>
          {draft.services.map((service, index) => (
            <article key={index} className="min-w-0 rounded-2xl border p-5" style={{ borderColor: rule, backgroundColor: draft.background }}>
              <span className="text-[11px] font-semibold" style={{ color: draft.accent }}>0{index + 1}</span>
              <h4 className="mt-7 text-lg font-semibold tracking-[-.03em]">{service.title}</h4>
              <p className="mt-3 text-[11px] leading-5" style={{ color: muted }}>{service.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="studio-preview-contact" className={mobile ? "px-6 py-11" : "px-[6%] py-14"}>
        <p className="text-[10px] font-semibold uppercase tracking-[.18em]" style={{ color: draft.accent }}>Începem?</p>
        <h3 className={mobile ? "mt-3 text-3xl font-semibold" : "mt-3 text-4xl font-semibold"}>Hai să vorbim.</h3>
        <p className="mt-4 text-sm" style={{ color: muted }}>{draft.contactLine}</p>
        <span className="mt-6 inline-flex rounded-full border px-5 py-3 text-xs font-semibold" style={{ borderColor: rule }}>Contactează-ne →</span>
      </section>
      <footer className="border-t px-[6%] py-5 text-[10px]" style={{ borderColor: rule, color: muted }}>
        {draft.brandName} · Preview ORBYVEN · Nepublicat
      </footer>
    </div>
  );
}
