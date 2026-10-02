import Link from "next/link";

const documents = [
  ["/legal/terms", "Terms and Conditions", "General rules for ORBYVEN services and platform access."],
  ["/legal/privacy", "Privacy Policy", "How personal data is processed across the website and platform."],
  ["/legal/cookies", "Cookie Policy", "Necessary storage, optional technologies and consent choices."],
  ["/legal/consumer", "Consumer information", "Pre-launch information for services offered to individuals."],
  ["/legal/ai", "AI-assisted features", "Transparency around ORBYVEN Intelligence and optional AI functions."],
] as const;

export default function EnglishLegalCenterPage() {
  return (
    <main lang="en" className="min-h-screen bg-white px-6 py-14 text-[#1d1d1f] dark:bg-[#09090a] dark:text-[#f5f5f7] md:px-10 md:py-20">
      <div className="mx-auto max-w-[1180px]">
        <Link href="/" className="text-sm font-semibold tracking-[0.16em]">ORBYVEN</Link>
        <p className="mt-16 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6e6e73] dark:text-[#a1a1a6]">Legal center</p>
        <h1 className="mt-5 max-w-4xl text-[48px] font-semibold leading-[0.95] tracking-[-0.055em] sm:text-[68px]">Clear documents.<br />One place.</h1>
        <p className="mt-7 max-w-2xl text-[15px] leading-7 text-[#6e6e73] dark:text-[#a1a1a6]">
          Core information about ORBYVEN terms, privacy, cookies, consumer flows and AI-assisted functionality.
        </p>
        <div className="mt-12 grid gap-3 md:grid-cols-2">
          {documents.map(([href, title, copy]) => (
            <Link key={href} href={href} className="rounded-[24px] border border-black/[0.08] bg-[#f5f5f7] p-6 transition hover:-translate-y-0.5 dark:border-white/[0.1] dark:bg-[#111113]">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">{copy}</p>
              <span className="mt-6 inline-block text-sm font-semibold">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
