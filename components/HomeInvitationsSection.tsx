"use client";

import HomeInvitationPreview from "@/components/HomeInvitationPreview";
import Link from "next/link";

const invitationHighlights = [
  {
    href: "/invitatii-nunta",
    title: "Invitații de nuntă",
    label: "O poveste în doi",
    kind: "wedding" as const,
  },
  {
    href: "/invitatii-botez",
    title: "Invitații de botez",
    label: "Un nou început",
    kind: "baptism" as const,
  },
  {
    href: "/invitatii-majorat",
    title: "Invitații de majorat",
    label: "Un nou capitol",
    kind: "birthday" as const,
  },
];

export default function HomeInvitationsSection() {
  return (
    <section
      aria-labelledby="invitatii-orbyven"
      className="orbyven-home-soft orbyven-home-flow-section orbyven-home-flow-section--invites px-5 py-16 sm:px-6 md:px-10 md:py-20"
    >
      <div className="mx-auto max-w-[1500px]">
        <p className="orbyven-home-kicker">
          <span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span>
          <span>Momente care rămân</span>
          <span aria-hidden="true" className="orbyven-home-kicker-line" />
        </p>
        <h2
          id="invitatii-orbyven"
          className="mt-4 max-w-3xl text-[38px] font-semibold leading-[1.05] tracking-[-0.055em] sm:text-[52px]"
        >
          Momente{" "}
          <span className="relative z-10 -mx-[0.035em] text-[var(--home-violet)]">
            personale.
          </span>{" "}
          Un link memorabil.
        </h2>
        <div className="orbyven-home-invite-grid mt-10">
          {invitationHighlights.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="orbyven-home-invite-card group relative isolate block overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface-2)] hover:border-[var(--home-violet)] focus-visible:border-[var(--home-violet)]"
            >
              <HomeInvitationPreview kind={item.kind} />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080710]/85 via-transparent to-transparent"
              />
              <span className="absolute left-6 top-6 rounded-full border border-white/30 bg-black/20 px-3 py-2 text-[9px] font-semibold tracking-[.17em] text-white shadow-sm backdrop-blur-sm">
                ORBYVEN / 0{index + 1}
              </span>
              <span
                aria-hidden="true"
                className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-sm transition duration-300 group-hover:rotate-45 group-hover:bg-[var(--accent)]"
              >
                ↗
              </span>
              <div className="absolute inset-x-7 bottom-8">
                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d8c7ff]">
                  {item.label}
                </p>
                <h3 className="mt-3 text-[clamp(27px,3vw,44px)] font-semibold leading-[1.02] tracking-[-.06em] text-white">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
