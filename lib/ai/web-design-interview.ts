import type {
  WebDesignBriefGap,
  WebDesignBriefGapId,
  WebDesignBriefGapReport,
} from "@/lib/ai/web-design-brief-gaps";

export type WebDesignInterviewQuestion = WebDesignBriefGap;

const GAP_IDS = new Set<WebDesignBriefGapId>([
  "brand_name",
  "hero_offer",
  "services_real",
  "gallery_real",
  "about_real",
  "process_real",
  "faq_real",
  "contact_real",
  "conversion_goal",
  "claim_evidence",
]);

const SECTION_IDS = new Set<WebDesignBriefGap["sections"][number]>([
  "hero",
  "services",
  "benefits",
  "about",
  "gallery",
  "process",
  "faq",
  "contact",
]);

export function readWebDesignInterviewQuestions(
  value: unknown
): WebDesignInterviewQuestion[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const label = typeof record.label === "string" ? record.label.trim() : "";
      const question =
        typeof record.question === "string" ? record.question.trim() : "";
      const priority =
        record.priority === 1 || record.priority === 2 || record.priority === 3
          ? record.priority
          : null;
      const sections = Array.isArray(record.sections)
        ? record.sections.filter(
            (section): section is WebDesignBriefGap["sections"][number] =>
              typeof section === "string" &&
              SECTION_IDS.has(
                section as WebDesignBriefGap["sections"][number]
              )
          )
        : [];

      if (
        !GAP_IDS.has(id as WebDesignBriefGapId) ||
        !label ||
        !question ||
        !priority
      ) {
        return null;
      }

      return {
        id: id as WebDesignBriefGapId,
        label: label.slice(0, 80),
        question: question.slice(0, 220),
        priority,
        sections,
      } satisfies WebDesignInterviewQuestion;
    })
    .filter((item): item is WebDesignInterviewQuestion => item !== null)
    .slice(0, 6);
}

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
