import type { IntelligenceIntent, IntelligenceSpecialist } from "@/lib/ai/intelligence-types";

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

const RULES: Array<{ specialist: IntelligenceSpecialist; pattern: RegExp }> = [
  {
    specialist: "web_design",
    pattern: /\b(site|website|web design|hero|landing|pagina|layout|culori|paleta|font|template|design|seo site|titlu site)\b/,
  },
  {
    specialist: "finance",
    pattern: /\b(finante|financiar|incas|factur|scadent|restant|cashflow|profit|cheltu|venit|bani|plata|platit|de primit)\b/,
  },
  {
    specialist: "documents",
    pattern: /\b(document|contract|pdf|fisier|atasament|semnatur|proces verbal|proces-verbal)\b/,
  },
  {
    specialist: "operations",
    pattern: /\b(azi|astazi|task|lucrare|lucrari|client|lead|ofert|deviz|calendar|programar|follow.?up|prioritat|blocat|intarziat|de facut)\b/,
  },
];

export function routeIntelligencePrompt(prompt: string): IntelligenceIntent {
  const normalizedPrompt = normalize(prompt);
  if (!normalizedPrompt || normalizedPrompt.length > 1200) {
    return { specialist: "general", confidence: "medium", normalizedPrompt };
  }

  for (const rule of RULES) {
    if (rule.pattern.test(normalizedPrompt)) {
      return { specialist: rule.specialist, confidence: "high", normalizedPrompt };
    }
  }

  return { specialist: "general", confidence: "medium", normalizedPrompt };
}
