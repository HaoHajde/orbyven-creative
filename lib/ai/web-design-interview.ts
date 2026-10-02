import type {
  WebDesignBriefGap,
  WebDesignBriefGapId,
  WebDesignBriefGapReport,
} from "@/lib/ai/web-design-brief-gaps";

export type WebDesignInterviewQuestion = WebDesignBriefGap;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function pickNextWebDesignInterviewQuestion(
  report: WebDesignBriefGapReport | null | undefined
): WebDesignInterviewQuestion | null {
  if (!report?.gaps?.length) return null;
  return [...report.gaps]
    .sort((left, right) => {
      if (left.priority !== right.priority) return left.priority - right.priority;
      return left.label.localeCompare(right.label, "ro");
    })[0] ?? null;
}

function isNegativeAnswer(value: string) {
  const normalized = normalize(value);
  return /^(nu|nu este|nu sunt|nu avem|nu oferim|fals|no|false)\b/.test(normalized);
}

function promptForGap(
  id: WebDesignBriefGapId,
  answer: string,
  question: string
) {
  const fact = answer.trim().slice(0, 1200);

  switch (id) {
    case "brand_name":
      return \`Schimbă doar brandul. Numele real al brandului/firmei este: "\${fact}". Păstrează toate celelalte zone neschimbate.\`;
    case "hero_offer":
      return \`Schimbă doar hero-ul pe baza acestei informații reale furnizate de utilizator: "\${fact}". Oferta principală trebuie să fie clară, scurtă și să nu inventeze alte fapte. Păstrează restul site-ului neschimbat.\`;
    case "services_real":
      return \`Schimbă doar secțiunea de servicii/produse. Informația reală furnizată de utilizator este: "\${fact}". Folosește exclusiv aceste informații și păstrează restul site-ului neschimbat.\`;
    case "gallery_real":
      return \`Schimbă doar galeria/portofoliul. Proiectele, produsele sau exemplele reale furnizate de utilizator sunt: "\${fact}". Nu inventa alte proiecte. Păstrează restul neschimbat.\`;
    case "about_real":
      return \`Schimbă doar secțiunea despre. Descrierea reală furnizată de utilizator este: "\${fact}". Rescrie concis fără să inventezi fapte și păstrează restul neschimbat.\`;
    case "process_real":
      return \`Schimbă doar secțiunea proces. Pașii reali furnizați de utilizator sunt: "\${fact}". Nu inventa etape suplimentare și păstrează restul neschimbat.\`;
    case "faq_real":
      return \`Schimbă doar FAQ-ul. Întrebările și/sau răspunsurile reale furnizate de utilizator sunt: "\${fact}". Nu inventa politici, garanții sau condiții și păstrează restul neschimbat.\`;
    case "contact_real":
      return \`Schimbă doar contactul și CTA-ul din hero astfel încât traseul real dorit să fie: "\${fact}". Păstrează restul site-ului neschimbat.\`;
    case "conversion_goal":
      return \`Schimbă doar hero-ul și contactul pentru a reflecta obiectivul principal real al site-ului: "\${fact}". Nu modifica alte secțiuni.\`;
    case "claim_evidence":
      if (isNegativeAnswer(fact)) {
        return \`Utilizatorul NU confirmă afirmațiile din această întrebare: "\${question}". Elimină sau evită aceste afirmații și păstrează restul site-ului neschimbat.\`;
      }
      return \`Utilizatorul răspunde la întrebarea de verificare "\${question}" astfel: "\${fact}". Folosește numai afirmațiile confirmate explicit de acest răspuns. Modifică doar copy-ul relevant din hero, servicii, despre și contact dacă este necesar; păstrează restul neschimbat.\`;
  }
}

export function buildWebDesignInterviewPrompt(
  gap: WebDesignInterviewQuestion,
  answer: string
) {
  const trimmed = answer.trim();
  if (trimmed.length < 2 || trimmed.length > 1200) return null;
  return promptForGap(gap.id, trimmed, gap.question);
}
