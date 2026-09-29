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
    pattern: /\b(site|website|web design|hero|landing|pagin\w*|layout|culor\w*|palet\w*|font\w*|template\w*|design|seo site|titlu site)\b/,
  },
  {
    specialist: "finance",
    pattern: /\b(finant\w*|financiar\w*|incas\w*|factur\w*|scadent\w*|restant\w*|cashflow|profit\w*|cheltu\w*|venit\w*|bani|plat\w*|de primit)\b/,
  },
  {
    specialist: "documents",
    pattern: /\b(document\w*|contract\w*|pdf|fisier\w*|atasament\w*|semnatur\w*|proces verbal|proces-verbal)\b/,
  },
  {
    specialist: "operations",
    pattern: /\b(azi|astazi|task\w*|lucrar\w*|client\w*|lead\w*|ofert\w*|deviz\w*|calendar\w*|programar\w*|follow.?up|prioritat\w*|blocat\w*|intarziat\w*|de facut)\b/,
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
