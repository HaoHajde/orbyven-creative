import type { Metadata } from "next";
import SeoShellEn from "@/components/seo/SeoShellEn";

export const metadata: Metadata = {
  title: "Business website guide | ORBYVEN",
  description: "Practical ORBYVEN guidance on website structure, redesign, cost and the role of a public website in a business.",
  alternates: { canonical: "https://www.orbyven.com/ghid" },
};

const guides = [
  ["What changes the cost of a business website?", "Scope, custom design, content, integrations, SEO and recurring infrastructure costs should be compared separately."],
  ["What should a business website contain?", "Offer, services, proof, process, contact, legal information and a technical SEO foundation."],
  ["When is a redesign worth it?", "When unclear positioning, weak mobile UX, slow performance or structural debt becomes a business constraint."],
  ["Website or social media?", "Social media helps distribution; a website gives you control over structure, search visibility and conversion paths."],
];

export default function GuidePageEn() {
  return (
    <SeoShellEn>
      <section className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#4b46ee]">ORBYVEN guide</p>
          <h1 className="mt-5 max-w-5xl text-[clamp(54px,8vw,106px)] font-semibold leading-[.88] tracking-[-.07em]">
            Useful answers before you buy or rebuild a website.
          </h1>
          <p className="mt-8 max-w-2xl text-[16px] leading-7 text-black/55">
            No content written just for volume. These are the questions that repeatedly matter before a real project starts.
          </p>
          <div className="mt-14 grid gap-3 md:grid-cols-2">
            {guides.map(([title, copy], index) => (
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
