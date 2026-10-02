import type { Metadata } from "next";
import SeoShellEn from "@/components/seo/SeoShellEn";

export const metadata: Metadata = {
  title: "ORBYVEN case studies and pilots",
  description: "ORBYVEN pilots across events, field service, infrastructure and auto detailing.",
  alternates: { canonical: "https://www.orbyven.com/studii-de-caz" },
};

const pilots = [
  ["Pilot #001 · Events", "A digital event experience that connects the public invitation with RSVP and event organization."],
  ["Pilot #002 · Field service", "A plumbing and heating workflow that connects inquiries, visits, estimates, materials and project context."],
  ["Pilot #003 · Infrastructure", "A visual website direction for asphalt and infrastructure services with room for field-service workflows."],
  ["Pilot #005 · Auto detailing", "A premium detailing experience built around before/after proof, package selection and scheduling."],
];

export default function CaseStudiesPageEn() {
  return (
    <SeoShellEn>
      <section className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#4b46ee]">Case studies</p>
          <h1 className="mt-5 max-w-5xl text-[clamp(54px,8vw,106px)] font-semibold leading-[.88] tracking-[-.07em]">
            What we build and what each pilot is designed to validate.
          </h1>
          <p className="mt-8 max-w-2xl text-[16px] leading-7 text-black/55">
            We describe implementations without inventing performance claims. Each pilot tests a different combination of public experience and operational workflow.
          </p>
          <div className="mt-14 grid gap-3 md:grid-cols-2">
            {pilots.map(([title, copy], index) => (
              <article key={title} className="min-h-[220px] rounded-[28px] border border-black/[.07] bg-[#f7f7f9] p-7 md:p-8">
                <span className="text-[9px] font-bold tracking-[.16em] text-black/28">{String(index + 1).padStart(2, "0")}</span>
                <h2 className="mt-10 text-[30px] font-semibold tracking-[-.05em]">{title}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-black/50">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SeoShellEn>
  );
}
