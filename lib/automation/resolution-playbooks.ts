import type { AutomationSignal } from "@/lib/automation/business-signals";

export type GuidedResolution = {
  label: string;
  rationale: string;
  steps: string[];
};

const PLAYBOOKS: Partial<Record<AutomationSignal["rule"], GuidedResolution>> = {
  operation_blocked: {
    label: "Rezolvă blocajul",
    rationale: "Execuția nu poate avansa până când motivul blocării este clarificat.",
    steps: [
      "Deschide lucrarea și verifică motivul concret al blocării.",
      "Confirmă decizia, resursa sau informația care lipsește.",
      "Actualizează statusul numai după ce blocajul este rezolvat.",
    ],
  },
  operation_overdue: {
    label: "Recuperează termenul",
    rationale: "Termenul a fost depășit și lucrarea are nevoie de un nou pas explicit.",
    steps: [
      "Verifică starea reală și ce a împiedicat finalizarea.",
      "Confirmă responsabilul și următorul termen realist.",
      "Comunică schimbarea clientului dacă aceasta îl afectează.",
    ],
  },
  calendar_conflict: {
    label: "Rezolvă conflictul",
    rationale: "Două programări folosesc aceeași persoană în intervale care se suprapun.",
    steps: [
      "Compară cele două programări și prioritatea lor reală.",
      "Mută una dintre programări sau alocă o resursă disponibilă.",
      "Verifică din nou calendarul înainte de confirmarea modificării.",
    ],
  },
  appointment_needs_resources: {
    label: "Pregătește resursele",
    rationale: "Programarea se apropie, dar resursele necesare nu sunt încă alocate complet.",
    steps: [
      "Deschide programarea și verifică necesarul de oameni/resurse.",
      "Alege doar resurse disponibile în intervalul respectiv.",
      "Confirmă alocarea înainte de începerea execuției.",
    ],
  },
  operation_assignee_inactive: {
    label: "Realocă responsabilul",
    rationale: "Responsabilul curent este marcat inactiv în Team.",
    steps: [
      "Deschide lucrarea și verifică responsabilul actual.",
      "Alege un membru activ și disponibil.",
      "Confirmă noua responsabilitate înainte de continuarea execuției.",
    ],
  },
  operation_unassigned: {
    label: "Alocă responsabil",
    rationale: "Execuția este apropiată sau în lucru fără un responsabil explicit.",
    steps: [
      "Verifică cine poate prelua lucrarea.",
      "Confirmă disponibilitatea persoanei selectate.",
      "Alocă responsabilul înainte de următorul pas operațional.",
    ],
  },
  execution_without_accepted_estimate: {
    label: "Clarifică aprobarea comercială",
    rationale: "Execuția a început, dar fluxul de ofertare nu arată o ofertă acceptată.",
    steps: [
      "Verifică oferta sau devizul legat de lucrare.",
      "Confirmă dacă există acceptarea clientului în afara sistemului.",
      "Actualizează fluxul comercial înainte de a continua costuri suplimentare.",
    ],
  },
  accepted_estimate_needs_schedule: {
    label: "Programează execuția",
    rationale: "Oferta este acceptată, dar lucrarea nu are încă o programare operațională.",
    steps: [
      "Verifică intervalul dorit de client și termenul lucrării.",
      "Confirmă disponibilitatea echipei și resurselor.",
      "Creează programarea legată de lucrare.",
    ],
  },
  estimate_expiring: {
    label: "Rezolvă oferta",
    rationale: "Oferta este expirată sau foarte aproape de termenul de valabilitate.",
    steps: [
      "Verifică dacă clientul a răspuns deja.",
      "Decide dacă oferta rămâne valabilă sau trebuie actualizată.",
      "Fă follow-up și păstrează statusul comercial actualizat.",
    ],
  },
  estimate_follow_up: {
    label: "Fă follow-up",
    rationale: "Oferta a rămas trimisă fără răspuns suficient timp cât să necesite revenire.",
    steps: [
      "Recitește oferta și contextul clientului.",
      "Contactează clientul pentru o decizie sau întrebări.",
      "Actualizează statusul doar după răspunsul real.",
    ],
  },
  operation_due_soon: {
    label: "Pregătește termenul",
    rationale: "Termenul se apropie și merită verificată readiness-ul înainte să devină urgent.",
    steps: [
      "Verifică responsabilul, resursele și programarea.",
      "Confirmă că nu există un blocaj comercial sau operațional.",
      "Păstrează termenul sau ajustează-l explicit dacă este nerealist.",
    ],
  },
  operation_unplanned: {
    label: "Planifică lucrarea",
    rationale: "Lucrarea este deschisă, dar nu are un termen sau o programare suficient de clară.",
    steps: [
      "Stabilește următorul rezultat concret al lucrării.",
      "Alege responsabilul și termenul.",
      "Adaugă programarea dacă execuția necesită un interval rezervat.",
    ],
  },
  appointment_upcoming: {
    label: "Verifică programarea",
    rationale: "Programarea este apropiată și trebuie să fie pregătită pentru execuție.",
    steps: [
      "Confirmă clientul, ora și locația.",
      "Verifică responsabilul și resursele necesare.",
      "Rezolvă orice lipsă înainte de ora programării.",
    ],
  },
};

export function guidedResolutionForSignal(
  signal: Pick<AutomationSignal, "rule" | "actionLabel">
): GuidedResolution {
  return PLAYBOOKS[signal.rule] ?? {
    label: signal.actionLabel || "Rezolvă",
    rationale: "Semnalul necesită verificarea contextului înainte de o modificare.",
    steps: [
      "Deschide contextul semnalului.",
      "Verifică datele reale și cauza atenționării.",
      "Aplică modificarea potrivită numai după confirmare.",
    ],
  };
}
