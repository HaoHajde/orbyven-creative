import type { Metadata } from "next";
import Link from "next/link";

import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Centrul juridic",
  description: "Documentele juridice și de conformitate ORBYVEN.",
};

const documents = [
  ["/legal/terms", "Termeni și Condiții", "Regulile generale pentru folosirea serviciilor ORBYVEN."],
  ["/legal/subscriptions", "Termeni de abonament B2B", "Durată, facturare, suspendare, upgrade și încetare."],
  ["/legal/privacy", "Politica de Confidențialitate", "Cum prelucrăm datele personale pentru ORBYVEN."],
  ["/legal/cookies", "Politica Cookies", "Cookie-uri necesare și mecanismul pentru cele opționale."],
  ["/legal/dpa", "DPA", "Cadrul operator–persoană împuternicită pentru datele clienților."],
  ["/legal/acceptable-use", "Acceptable Use Policy", "Reguli pentru folosirea sigură și legală a platformei."],
] as const;

export default function LegalCenterPage() {
  return (
    <LegalDocument
      eyebrow="ORBYVEN · Legal"
      title="Un singur loc pentru regulile platformei."
      intro="Aceste documente separă clar relația comercială, protecția datelor și regulile tehnice ale platformei ORBYVEN."
    >
      <LegalSection title="Documente">
        <div className="grid gap-3 sm:grid-cols-2">
          {documents.map(([href, title, text]) => (
            <Link
              key={href}
              href={href}
              className="rounded-[22px] border border-black/[0.08] p-5 transition hover:-translate-y-0.5 dark:border-white/[0.1]"
            >
              <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{title}</p>
              <p className="mt-2 text-sm text-[#6e6e73] dark:text-[#a1a1a6]">{text}</p>
            </Link>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Domeniu">
        <p>
          Termenii de abonament sunt concepuți pentru clienți profesioniști — societăți, PFA și alte entități care contractează ORBYVEN în scopul activității lor economice. Produsele destinate consumatorilor persoane fizice trebuie contractate sub termeni B2C separați înainte de a fi comercializate.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
