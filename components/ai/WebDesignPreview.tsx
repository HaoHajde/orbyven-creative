"use client";

import type {
  EditableSite,
  SiteContentItem,
  SiteSectionId,
} from "@/lib/ai/site-editor";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

type Props = {
  draft: EditableSite;
  device: PreviewDevice;
};

function densityPadding(draft: EditableSite) {
  return draft.density === "airy"
    ? "px-7 py-16 sm:px-10 lg:px-14 lg:py-20"
    : draft.density === "compact"
      ? "px-6 py-9 sm:px-8 lg:px-10 lg:py-11"
      : "px-7 py-12 sm:px-10 lg:px-14 lg:py-14";
}

function radiusClass(draft: EditableSite) {
  return draft.radius === "sharp"
    ? "rounded-none"
    : draft.radius === "soft"
      ? "rounded-[12px]"
      : "rounded-[24px]";
}

function SectionTitle({
  eyebrow,
  title,
  draft,
}: {
  eyebrow: string;
  title: string;
  draft: EditableSite;
}) {
  return (
    <div className="max-w-3xl">
      <p
        className="text-[9px] font-bold uppercase tracking-[0.18em]"
        style={{ color: draft.accent }}
      >
        {eyebrow}
      </p>
      <h3 className="mt-2 text-[clamp(1.8rem,4vw,3.4rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
        {title}
      </h3>
    </div>
  );
}

function ItemGrid({
  items,
  draft,
  variant,
}: {
  items: SiteContentItem[];
  draft: EditableSite;
  variant: "cards" | "list" | "spotlight";
}) {
  const radius = radiusClass(draft);

  if (variant === "list") {
    return (
      <div className="mt-8 divide-y" style={{ borderColor: `${draft.textColor}18` }}>
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="grid gap-3 py-5 md:grid-cols-[44px_1fr_1.3fr] md:items-start">
            <span className="text-[10px] font-semibold opacity-35">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h4 className="text-[15px] font-semibold">{item.title}</h4>
            <p className="text-[12px] leading-6 opacity-60">{item.description}</p>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "spotlight") {
    const [first, ...rest] = items;
    return (
      <div className="mt-8 grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        {first ? (
          <article
            className={`${radius} min-h-[230px] border p-6`}
            style={{ background: draft.background, borderColor: `${draft.textColor}14` }}
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: draft.accent }}>
              PRINCIPAL
            </p>
            <h4 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{first.title}</h4>
            <p className="mt-4 max-w-xl text-[12px] leading-6 opacity-60">{first.description}</p>
          </article>
        ) : null}
        <div className="grid gap-3">
          {rest.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className={`${radius} border p-5`}
              style={{ background: draft.background, borderColor: `${draft.textColor}14` }}
            >
              <h4 className="text-[13px] font-semibold">{item.title}</h4>
              <p className="mt-2 text-[11px] leading-5 opacity-55">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-3 md:grid-cols-3">
      {items.map((item, index) => (
        <article
          key={`${item.title}-${index}`}
          className={`${radius} min-h-36 border p-5`}
          style={{ background: draft.background, borderColor: `${draft.textColor}14` }}
        >
          <span className="text-[9px] font-bold opacity-30">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h4 className="mt-5 text-[14px] font-semibold">{item.title}</h4>
          <p className="mt-2 text-[11px] leading-5 opacity-55">{item.description}</p>
        </article>
      ))}
    </div>
  );
}

export default function WebDesignPreview({ draft, device }: Props) {
  const visibleSections = draft.sectionOrder.filter(
    (section) => !draft.hiddenSections.includes(section)
  );
  const radius = radiusClass(draft);
  const pad = densityPadding(draft);
  const widthClass =
    device === "mobile"
      ? "max-w-[430px]"
      : device === "tablet"
        ? "max-w-[820px]"
        : "max-w-none";

  const surfaceBorder = `${draft.textColor}16`;

  const renderSection = (section: SiteSectionId) => {
    if (section === "hero") {
      const heroVariant = draft.variants.hero;
      const isCentered = heroVariant === "centered" || draft.layout === "centered";
      const isEditorial = heroVariant === "editorial" || draft.layout === "editorial";
      const split = heroVariant === "split" && !isCentered && !isEditorial;

      return (
        <section
          key={section}
          className={`${pad} grid min-h-[430px] items-center gap-8 ${split ? "lg:grid-cols-[1.05fr_0.95fr]" : ""}`}
        >
          <div className={isCentered ? "mx-auto max-w-3xl text-center" : isEditorial ? "max-w-5xl" : "max-w-3xl"}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: draft.accent }}>
              {draft.eyebrow}
            </p>
            <h2
              className={`mt-4 font-semibold tracking-[-0.06em] ${
                draft.headlineSize === "large"
                  ? "text-[clamp(3.25rem,8vw,7.4rem)] leading-[0.87]"
                  : "text-[clamp(2.7rem,6vw,5.6rem)] leading-[0.92]"
              }`}
            >
              {draft.headline}
            </h2>
            <p className={`mt-6 text-[14px] leading-7 opacity-62 ${isCentered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
              {draft.description}
            </p>
            <button
              type="button"
              className={`mt-7 px-5 py-3 text-[11px] font-semibold ${draft.radius === "sharp" ? "" : "rounded-full"}`}
              style={{ background: draft.accent, color: "#fff" }}
            >
              {draft.cta}
            </button>
          </div>

          {split ? (
            <div
              className={`${radius} min-h-[280px] border shadow-inner`}
              style={{
                background: `linear-gradient(145deg, ${draft.surface}, ${draft.accent}16)`,
                borderColor: surfaceBorder,
              }}
            >
              <div className="flex min-h-[280px] items-end p-6">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-35">
                    MEDIA / HERO
                  </p>
                  <p className="mt-2 max-w-xs text-[11px] leading-5 opacity-45">
                    Zonă vizuală controlată. Imaginea reală se adaugă separat, fără ca modelul să inventeze asset-uri.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      );
    }

    if (section === "services") {
      return (
        <section key={section} className={`${pad} border-t`} style={{ background: draft.surface, borderColor: surfaceBorder }}>
          <SectionTitle eyebrow="SERVICII" title={draft.servicesTitle} draft={draft} />
          <ItemGrid items={draft.services} draft={draft} variant={draft.variants.services} />
        </section>
      );
    }

    if (section === "benefits") {
      return (
        <section key={section} className={`${pad} border-t`} style={{ borderColor: surfaceBorder }}>
          <SectionTitle eyebrow="BENEFICII" title={draft.benefitsTitle} draft={draft} />
          {draft.variants.benefits === "strip" ? (
            <div className="mt-8 grid border-y md:grid-cols-3" style={{ borderColor: surfaceBorder }}>
              {draft.benefits.map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="border-b p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
                  style={{ borderColor: surfaceBorder }}
                >
                  <h4 className="text-[13px] font-semibold">{item.title}</h4>
                  <p className="mt-2 text-[11px] leading-5 opacity-55">{item.description}</p>
                </article>
              ))}
            </div>
          ) : (
            <ItemGrid items={draft.benefits} draft={draft} variant="cards" />
          )}
        </section>
      );
    }

    if (section === "about") {
      return (
        <section key={section} className={`${pad} border-t`} style={{ background: draft.surface, borderColor: surfaceBorder }}>
          <div className={draft.variants.about === "split" ? "grid gap-8 lg:grid-cols-[0.8fr_1.2fr]" : "max-w-4xl"}>
            <SectionTitle eyebrow="DESPRE" title={draft.aboutTitle} draft={draft} />
            <p className="text-[14px] leading-7 opacity-62">{draft.aboutDescription}</p>
          </div>
        </section>
      );
    }

    if (section === "gallery") {
      const mosaic = draft.variants.gallery === "mosaic";
      return (
        <section key={section} className={`${pad} border-t`} style={{ borderColor: surfaceBorder }}>
          <SectionTitle eyebrow="PORTOFOLIU" title={draft.galleryTitle} draft={draft} />
          <div className={`mt-8 grid gap-3 ${mosaic ? "md:grid-cols-12" : "md:grid-cols-3"}`}>
            {draft.gallery.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className={`${radius} min-h-[180px] border p-5 ${
                  mosaic ? (index % 3 === 0 ? "md:col-span-7" : "md:col-span-5") : ""
                }`}
                style={{
                  borderColor: surfaceBorder,
                  background: `linear-gradient(150deg, ${draft.surface}, ${draft.accent}12)`,
                }}
              >
                <div className="flex h-full min-h-[140px] flex-col justify-end">
                  <h4 className="text-[14px] font-semibold">{item.title}</h4>
                  <p className="mt-2 text-[11px] leading-5 opacity-50">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (section === "process") {
      return (
        <section key={section} className={`${pad} border-t`} style={{ background: draft.surface, borderColor: surfaceBorder }}>
          <SectionTitle eyebrow="PROCES" title={draft.processTitle} draft={draft} />
          <div className={`mt-8 ${draft.variants.process === "timeline" ? "space-y-0" : "grid gap-3 md:grid-cols-3"}`}>
            {draft.process.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className={
                  draft.variants.process === "timeline"
                    ? "grid gap-4 border-t py-5 md:grid-cols-[64px_0.7fr_1.3fr]"
                    : `${radius} border p-5`
                }
                style={{ borderColor: surfaceBorder }}
              >
                <span className="text-[10px] font-bold" style={{ color: draft.accent }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h4 className="text-[13px] font-semibold">{item.title}</h4>
                <p className="text-[11px] leading-5 opacity-55">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (section === "faq") {
      return (
        <section key={section} className={`${pad} border-t`} style={{ borderColor: surfaceBorder }}>
          <SectionTitle eyebrow="FAQ" title={draft.faqTitle} draft={draft} />
          <div className={`mt-8 grid gap-3 ${draft.variants.faq === "columns" ? "md:grid-cols-2" : ""}`}>
            {draft.faq.map((item, index) => (
              <article
                key={`${item.question}-${index}`}
                className={`${radius} border p-5`}
                style={{ background: draft.surface, borderColor: surfaceBorder }}
              >
                <h4 className="text-[13px] font-semibold">{item.question}</h4>
                <p className="mt-2 text-[11px] leading-5 opacity-55">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section key={section} className={`${pad} border-t`} style={{ background: draft.surface, borderColor: surfaceBorder }}>
        <div className={draft.variants.contact === "split" ? "grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end" : "max-w-3xl"}>
          <div>
            <SectionTitle eyebrow="CONTACT" title={draft.contactTitle} draft={draft} />
            <p className="mt-4 max-w-2xl text-[13px] leading-6 opacity-62">
              {draft.contactDescription}
            </p>
          </div>
          <button
            type="button"
            className={`h-12 px-5 text-[11px] font-semibold ${draft.radius === "sharp" ? "" : "rounded-full"}`}
            style={{ background: draft.accent, color: "#fff" }}
          >
            {draft.cta}
          </button>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-[640px] overflow-x-auto bg-[#090b13] p-2 sm:p-4">
      <div
        className={`mx-auto overflow-hidden border shadow-[0_30px_100px_rgba(0,0,0,0.32)] transition-[max-width] duration-300 ${widthClass} ${radius}`}
        style={{
          background: draft.background,
          color: draft.textColor,
          borderColor: "rgba(255,255,255,0.10)",
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: surfaceBorder }}>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.16em] opacity-35">LIVE PREVIEW</p>
            <p className="mt-1 text-[11px] font-semibold">{draft.brand}</p>
          </div>
          <div className="flex gap-1.5">
            {draft.sectionOrder.map((section) => (
              <span
                key={section}
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: draft.hiddenSections.includes(section)
                    ? `${draft.textColor}18`
                    : draft.accent,
                }}
                title={section}
              />
            ))}
          </div>
        </div>
        {visibleSections.map(renderSection)}
      </div>
    </div>
  );
}
