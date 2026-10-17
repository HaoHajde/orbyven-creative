"use client";

import { useState, type FormEvent } from "react";

import type { EditableSite, SiteSectionId } from "@/lib/ai/site-editor";
import type { InvitationProjectType } from "@/lib/invitations/contracts";

type Props = {
  slug: string;
  projectType: InvitationProjectType;
  draft: EditableSite;
};

const TYPE_LABEL: Record<InvitationProjectType, string> = {
  wedding: "Nuntă",
  baptism: "Botez",
  event: "Eveniment",
};

function radius(draft: EditableSite) {
  return draft.radius === "sharp" ? "rounded-none" : draft.radius === "soft" ? "rounded-[16px]" : "rounded-[28px]";
}

export default function PublishedInvitation({ slug, projectType, draft }: Props) {
  const [guestName, setGuestName] = useState("");
  const [attending, setAttending] = useState(true);
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const visibleSections = draft.sectionOrder.filter(
    (section) => !draft.hiddenSections.includes(section)
  );
  const cardRadius = radius(draft);
  const border = `${draft.textColor}18`;
  const muted = `${draft.textColor}9f`;

  const jumpToRsvp = () => {
    document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submitRsvp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult("idle");
    setError("");
    if (guestName.trim().length < 2) {
      setError("Scrie numele pentru confirmare.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/invitations/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          guestName,
          attending,
          guestCount: attending ? guestCount : 0,
          message,
          website,
          startedAt,
        }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Răspunsul nu a putut fi trimis.");
      }
      setResult("success");
    } catch (submitError) {
      setResult("error");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Răspunsul nu a putut fi trimis."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const SectionHeader = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
    <div className="max-w-3xl">
      <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: draft.accent }}>
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[clamp(2rem,6vw,4.7rem)] font-semibold leading-[0.94] tracking-[-0.055em]">
        {title}
      </h2>
    </div>
  );

  const renderSection = (section: SiteSectionId) => {
    if (section === "hero") {
      return (
        <section key={section} className="flex min-h-[78svh] items-center px-6 py-20 sm:px-10 lg:px-[8vw]">
          <div className={draft.layout === "centered" ? "mx-auto max-w-5xl text-center" : "max-w-6xl"}>
            <p className="text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: draft.accent }}>
              {draft.eyebrow}
            </p>
            <h1 className="mt-5 text-[clamp(3.8rem,12vw,10rem)] font-semibold leading-[0.82] tracking-[-0.075em]">
              {draft.headline}
            </h1>
            <p className={`mt-8 text-[15px] leading-7 sm:text-base ${draft.layout === "centered" ? "mx-auto max-w-2xl" : "max-w-2xl"}`} style={{ color: muted }}>
              {draft.description}
            </p>
            <button
              type="button"
              onClick={jumpToRsvp}
              className="mt-8 h-12 px-6 text-[12px] font-semibold shadow-sm transition hover:-translate-y-0.5"
              style={{ background: draft.accent, color: "#fff", borderRadius: draft.radius === "sharp" ? 0 : 999 }}
            >
              {draft.cta}
            </button>
          </div>
        </section>
      );
    }

    if (section === "services") {
      return (
        <section key={section} id="detalii" className="border-t px-6 py-16 sm:px-10 lg:px-[8vw] lg:py-24" style={{ background: draft.surface, borderColor: border }}>
          <SectionHeader eyebrow="DETALII" title={draft.servicesTitle} />
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {draft.services.map((item, index) => (
              <article key={`${item.title}-${index}`} className={`${cardRadius} border p-6`} style={{ borderColor: border, background: draft.background }}>
                <span className="text-[9px] font-bold opacity-30">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-6 text-lg font-semibold tracking-[-0.03em]">{item.title}</h3>
                <p className="mt-3 text-[12px] leading-6" style={{ color: muted }}>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (section === "benefits") {
      return (
        <section key={section} className="border-t px-6 py-16 sm:px-10 lg:px-[8vw] lg:py-24" style={{ borderColor: border }}>
          <SectionHeader eyebrow="PENTRU VOI" title={draft.benefitsTitle} />
          <div className="mt-10 grid border-y md:grid-cols-3" style={{ borderColor: border }}>
            {draft.benefits.map((item, index) => (
              <article key={`${item.title}-${index}`} className="border-b p-6 md:border-b-0 md:border-r md:last:border-r-0" style={{ borderColor: border }}>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-3 text-[12px] leading-6" style={{ color: muted }}>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (section === "about") {
      return (
        <section key={section} className="border-t px-6 py-16 sm:px-10 lg:px-[8vw] lg:py-24" style={{ background: draft.surface, borderColor: border }}>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <SectionHeader eyebrow="POVESTE" title={draft.aboutTitle} />
            <p className="max-w-3xl text-[clamp(1rem,2vw,1.35rem)] leading-8" style={{ color: muted }}>
              {draft.aboutDescription}
            </p>
          </div>
        </section>
      );
    }

    if (section === "gallery") {
      return (
        <section key={section} className="border-t px-6 py-16 sm:px-10 lg:px-[8vw] lg:py-24" style={{ borderColor: border }}>
          <SectionHeader eyebrow="GALERIE" title={draft.galleryTitle} />
          <div className="mt-10 grid gap-3 md:grid-cols-12">
            {draft.gallery.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className={`${cardRadius} min-h-[230px] border p-6 ${index % 3 === 0 ? "md:col-span-7" : "md:col-span-5"}`}
                style={{ borderColor: border, background: `linear-gradient(145deg, ${draft.surface}, ${draft.accent}18)` }}
              >
                <div className="flex h-full min-h-[180px] flex-col justify-end">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-[12px] leading-6" style={{ color: muted }}>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (section === "process") {
      return (
        <section key={section} id="program" className="border-t px-6 py-16 sm:px-10 lg:px-[8vw] lg:py-24" style={{ background: draft.surface, borderColor: border }}>
          <SectionHeader eyebrow="PROGRAM" title={draft.processTitle} />
          <div className="mt-10">
            {draft.process.map((item, index) => (
              <article key={`${item.title}-${index}`} className="grid gap-3 border-t py-6 md:grid-cols-[70px_0.7fr_1.3fr]" style={{ borderColor: border }}>
                <span className="text-[10px] font-bold" style={{ color: draft.accent }}>{String(index + 1).padStart(2, "0")}</span>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="text-[12px] leading-6" style={{ color: muted }}>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (section === "faq") {
      return (
        <section key={section} className="border-t px-6 py-16 sm:px-10 lg:px-[8vw] lg:py-24" style={{ borderColor: border }}>
          <SectionHeader eyebrow="ÎNTREBĂRI" title={draft.faqTitle} />
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {draft.faq.map((item, index) => (
              <article key={`${item.question}-${index}`} className={`${cardRadius} border p-6`} style={{ background: draft.surface, borderColor: border }}>
                <h3 className="text-base font-semibold">{item.question}</h3>
                <p className="mt-3 text-[12px] leading-6" style={{ color: muted }}>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <main className="min-h-screen antialiased" style={{ background: draft.background, color: draft.textColor }}>
      <header className="sticky top-0 z-30 border-b backdrop-blur-xl" style={{ borderColor: border, background: `${draft.background}e8` }}>
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-5 sm:px-8">
          <span className="truncate text-[11px] font-semibold tracking-[-0.02em]">{draft.brand}</span>
          <nav className="flex items-center gap-4 text-[10px] font-semibold" style={{ color: muted }}>
            <a href="#detalii" className="hidden sm:inline">Detalii</a>
            <a href="#program" className="hidden sm:inline">Program</a>
            <button type="button" onClick={jumpToRsvp} className="rounded-full px-3 py-1.5" style={{ background: `${draft.accent}18`, color: draft.accent }}>
              RSVP
            </button>
          </nav>
        </div>
      </header>

      {visibleSections.map((section) => renderSection(section))}

      <section id="rsvp" className="scroll-mt-16 border-t px-6 py-20 sm:px-10 lg:px-[8vw] lg:py-28" style={{ background: draft.surface, borderColor: border }}>
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: draft.accent }}>RSVP · {TYPE_LABEL[projectType]}</p>
            <h2 className="mt-4 text-[clamp(2.8rem,8vw,6.2rem)] font-semibold leading-[0.88] tracking-[-0.065em]">{draft.contactTitle}</h2>
            <p className="mt-6 max-w-xl text-sm leading-7" style={{ color: muted }}>{draft.contactDescription}</p>
          </div>

          <div className={`${cardRadius} border p-5 sm:p-7`} style={{ background: draft.background, borderColor: border }}>
            {result === "success" ? (
              <div className="flex min-h-[330px] flex-col justify-center">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: draft.accent }}>Confirmare trimisă</span>
                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.045em]">Mulțumim, {guestName.trim()}.</h3>
                <p className="mt-3 text-sm leading-7" style={{ color: muted }}>
                  Răspunsul tău a ajuns la organizator.
                </p>
              </div>
            ) : (
              <form onSubmit={submitRsvp}>
                <label className="block">
                  <span className="text-[11px] font-semibold">Nume</span>
                  <input
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value.slice(0, 120))}
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={120}
                    className="mt-2 h-12 w-full rounded-[13px] border bg-transparent px-4 text-sm outline-none"
                    style={{ borderColor: border }}
                    placeholder="Numele tău"
                  />
                </label>

                <fieldset className="mt-5">
                  <legend className="text-[11px] font-semibold">Participi?</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[true, false].map((value) => (
                      <button
                        key={String(value)}
                        type="button"
                        onClick={() => setAttending(value)}
                        className="h-11 rounded-[13px] border text-[11px] font-semibold"
                        style={{
                          borderColor: attending === value ? draft.accent : border,
                          background: attending === value ? `${draft.accent}16` : "transparent",
                          color: attending === value ? draft.accent : draft.textColor,
                        }}
                      >
                        {value ? "Da, particip" : "Nu pot ajunge"}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {attending ? (
                  <label className="mt-5 block">
                    <span className="text-[11px] font-semibold">Număr persoane</span>
                    <select
                      value={guestCount}
                      onChange={(event) => setGuestCount(Number(event.target.value))}
                      className="mt-2 h-12 w-full rounded-[13px] border bg-transparent px-4 text-sm outline-none"
                      style={{ borderColor: border, color: draft.textColor }}
                    >
                      {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => (
                        <option key={count} value={count} style={{ color: "#111" }}>{count}</option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label className="mt-5 block">
                  <span className="text-[11px] font-semibold">Mesaj <span className="font-normal opacity-45">· opțional</span></span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value.slice(0, 700))}
                    rows={4}
                    maxLength={700}
                    className="mt-2 w-full resize-none rounded-[13px] border bg-transparent px-4 py-3 text-sm leading-6 outline-none"
                    style={{ borderColor: border }}
                    placeholder="Un mesaj pentru organizatori"
                  />
                </label>

                <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
                  <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
                </div>

                {error ? <p className="mt-4 text-[11px] leading-5 text-red-500">{error}</p> : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-5 h-12 w-full px-5 text-[12px] font-semibold disabled:opacity-50"
                  style={{ background: draft.accent, color: "#fff", borderRadius: draft.radius === "sharp" ? 0 : 999 }}
                >
                  {submitting ? "Se trimite…" : attending ? "Confirmă prezența" : "Trimite răspunsul"}
                </button>
                <p className="mt-4 text-[9px] leading-4 opacity-45">
                  Datele introduse sunt folosite doar pentru gestionarea confirmării de participare la acest eveniment.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t px-6 py-8 text-center text-[9px] font-medium uppercase tracking-[0.16em] opacity-35" style={{ borderColor: border }}>
        Invitație creată cu ORBYVEN
      </footer>
    </main>
  );
}
