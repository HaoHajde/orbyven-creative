export type WebDesignProjectMode =
  | "website"
  | "wedding_invitation"
  | "baptism_invitation"
  | "event_invitation";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectWebDesignProjectMode(prompt: string): WebDesignProjectMode {
  const value = normalize(prompt);

  if (
    /\b(nunta|wedding|mireasa|mire|cununie|casatorie)\b/.test(value) &&
    /\b(invitatie|invitation|site|pagina|online|web)\b/.test(value)
  ) {
    return "wedding_invitation";
  }

  if (
    /\b(botez|baptism|baptismal|christening)\b/.test(value) &&
    /\b(invitatie|invitation|site|pagina|online|web)\b/.test(value)
  ) {
    return "baptism_invitation";
  }

  if (
    /\b(invitatie|invitation)\b/.test(value) &&
    /\b(eveniment|event|majorat|aniversare|birthday|petrecere|party|gala|lansare|launch)\b/.test(value)
  ) {
    return "event_invitation";
  }

  return "website";
}

const INVITATION_LABELS: Record<Exclude<WebDesignProjectMode, "website">, string> = {
  wedding_invitation: "nuntă",
  baptism_invitation: "botez",
  event_invitation: "eveniment",
};

export function buildWebDesignProjectPrompt(prompt: string) {
  const mode = detectWebDesignProjectMode(prompt);
  if (mode === "website") return { mode, prompt };

  const label = INVITATION_LABELS[mode];
  const source = prompt.trim().slice(0, 1350);
  const instruction = [
    `[MOD ORBYVEN: invitație online / ${label}]`,
    "Construiește o invitație online premium, mobile-first, nu un site comercial.",
    "Câmpul brand poate deveni numele persoanelor sau titlul evenimentului, dar numai dacă apare în cererea utilizatorului.",
    "Mapează schema astfel: services=detalii eveniment, benefits=repere, about=poveste, gallery=galerie, process=program, faq=informații utile, contact=RSVP.",
    "Include servicii pentru detaliile evenimentului; include despre pentru poveste; include proces pentru program; include contact pentru RSVP. Galeria și FAQ rămân opționale.",
    "CTA-ul principal trebuie să fie RSVP sau confirmarea prezenței. Evită limbajul de vânzare, ofertare și clienți.",
    "Nu inventa nume, dată, oră, locație, adresă, nași/părinți, program, dress code, cadouri, contacte sau alte fapte lipsă.",
    `Cererea utilizatorului: ${source}`,
  ].join(" ");

  return {
    mode,
    prompt: instruction.slice(0, 2000),
  };
}

export function isInvitationProjectMode(mode: WebDesignProjectMode) {
  return mode !== "website";
}
