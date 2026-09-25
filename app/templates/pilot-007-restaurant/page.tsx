import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TAVOLA · Pilot #007 | ORBYVEN",
  description: "Restaurant cu meniu, coș demonstrativ și rezervări simulate.",
  robots: { index: false, follow: false },
};

export default function Pilot007DemoPage() {
  return (
    <main className="fixed inset-0 bg-[#0b0b0d]">
      <iframe
        title="TAVOLA — demo interactiv ORBYVEN"
        src="/orbyven-demos/pilot-007/index.html"
        className="absolute inset-0 h-full w-full border-0"
        sandbox="allow-scripts allow-forms allow-downloads"
      />
      <Link
        href="/templates"
        aria-label="Înapoi la toate template-urile ORBYVEN"
        className="fixed bottom-4 left-4 z-50 rounded-full border border-white/30 bg-black/75 px-4 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-black md:bottom-6 md:left-6"
      >
        ← Templates
      </Link>
    </main>
  );
}
