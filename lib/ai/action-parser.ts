import type { IntelligenceMutationType } from "@/lib/ai/intelligence-types";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

export type LeadActionPayload = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  note?: string;
};

export type TaskActionPayload = {
  title: string;
  kind: "task" | "work" | "order";
  priority: "low" | "normal" | "high" | "urgent";
  description?: string;
  clientName?: string;
  location?: string;
};

export type CalendarActionPayload = {
  title: string;
  startAt: string;
  endAt: string;
  clientName?: string;
  taskTitle?: string;
  location?: string;
  notes?: string;
  reminderMinutes?: number;
  timeZone: string;
};

export type EstimateItemActionPayload = {
  description: string;
  quantity: number;
  unitPriceLei: number;
};

export type EstimateActionPayload = {
  title: string;
  clientName?: string;
  taskTitle?: string;
  currency: "RON";
  discountLei: number;
  taxRate: number | null;
  validUntil?: string;
  notes?: string;
  plannedLaborLei: number;
  otherCostLei: number;
  items: EstimateItemActionPayload[];
};

export type DocumentDraftActionPayload = {
  title: string;
  category: "general" | "contract" | "other";
  content: string;
  clientName?: string;
  taskTitle?: string;
  note?: string;
};

export type ParsedMutation =
  | {
      actionType: "create_lead" | "create_client";
      targetModule: "leads";
      payload: LeadActionPayload;
      summary: string;
      facts: Array<{ label: string; value: string }>;
    }
  | {
      actionType: "create_task";
      targetModule: "tasks";
      payload: TaskActionPayload;
      summary: string;
      facts: Array<{ label: string; value: string }>;
    }
  | {
      actionType: "create_calendar_event";
      targetModule: "calendar";
      payload: CalendarActionPayload;
      summary: string;
      facts: Array<{ label: string; value: string }>;
    }
  | {
      actionType: "create_estimate";
      targetModule: "estimates";
      payload: EstimateActionPayload;
      summary: string;
      facts: Array<{ label: string; value: string }>;
    }
  | {
      actionType: "create_document_draft";
      targetModule: "documents";
      payload: DocumentDraftActionPayload;
      summary: string;
      facts: Array<{ label: string; value: string }>;
    };

export type MutationParseResult =
  | { kind: "none" }
  | { kind: "needs_details"; message: string; targetModule: OrbyvenModuleId }
  | { kind: "proposal"; proposal: ParsedMutation };

const FIELD_LABELS =
  "nume|companie|firma|email|telefon|tel|nota|notă|descriere|client|lucrare|comanda|comandă|locatie|locație|prioritate|titlu|durata|durată|reminder|memento|pozitie|poziție|item|discount|reducere|tva|valabil|valabilitate|manopera|alte costuri|continut|conținut|text|categorie";

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function clean(value: string | undefined, max = 240) {
  const result = value?.trim().replace(/^["„]|["”]$/g, "");
  return result ? result.slice(0, max) : undefined;
}

function field(prompt: string, labels: string[], max = 240) {
  const label = labels.join("|");
  const pattern = new RegExp(
    "(?:^|[,;\\n]\\s*)(?:" + label + ")\\s*:\\s*(.+?)(?=\\s*(?:;|\\n|,\\s*(?:" + FIELD_LABELS + ")\\s*:)|$)",
    "i"
  );
  return clean(prompt.match(pattern)?.[1], max);
}

function fallbackName(prompt: string, entity: "lead" | "client") {
  const pattern = new RegExp(
    "(?:creeaz[ăa]|adaug[ăa]|inregistreaz[ăa])\\s+(?:un\\s+|o\\s+)?" + entity + "\\s*[:\\-]?\\s*([^,;\\n]+)",
    "i"
  );
  return clean(prompt.match(pattern)?.[1], 120);
}

function fallbackTaskTitle(prompt: string) {
  return clean(
    prompt.match(
      /(?:creeaz[ăa]|adaug[ăa]|deschide)\s+(?:o\s+|un\s+)?(?:lucrare|comand[ăa]|task|sarcin[ăa])\s*[:\-]?\s*([^,;\n]+)/i
    )?.[1],
    180
  );
}

function priorityFromPrompt(prompt: string): TaskActionPayload["priority"] {
  const explicit = normalize(field(prompt, ["prioritate"], 40) ?? "");
  const source = explicit || normalize(prompt);
  if (/\burgent\w*\b/.test(source)) return "urgent";
  if (/\b(ridicat\w*|mare|high)\b/.test(source)) return "high";
  if (/\b(scazut\w*|mica|mic|low)\b/.test(source)) return "low";
  return "normal";
}

function numericField(prompt: string, labels: string[], max = 40): number | null {
  const raw = field(prompt, labels, max);
  if (!raw) return null;
  const match = raw.replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

function estimateTitle(prompt: string) {
  return field(prompt, ["titlu"], 180) || clean(
    prompt.match(
      /(?:creeaz[ăa]|adaug[ăa])\s+(?:un\s+|o\s+)?(?:deviz|ofert[ăa])\s*[:\-]?\s*([^,;\n]+)/i
    )?.[1],
    180
  );
}

function estimateItems(prompt: string): EstimateItemActionPayload[] {
  const rows = prompt
    .split(/[;\n]+/)
    .map((row) => row.trim())
    .filter(Boolean);

  const items: EstimateItemActionPayload[] = [];
  for (const row of rows) {
    const itemText = row.match(/^(?:pozitie|poziție|item)\s*:\s*(.+)$/i)?.[1]?.trim();
    if (!itemText) continue;

    const match = itemText.match(
      /^(.+?)\s*[,|]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(?:lei|ron)?\s*$/i
    );
    if (!match) continue;

    const description = clean(match[1], 500);
    const quantity = Number(match[2].replace(",", "."));
    const unitPriceLei = Number(match[3].replace(",", "."));
    if (!description || !Number.isFinite(quantity) || quantity <= 0 ||
        !Number.isFinite(unitPriceLei) || unitPriceLei < 0) continue;

    items.push({ description, quantity, unitPriceLei });
    if (items.length >= 50) break;
  }
  return items;
}

function estimateValidUntil(prompt: string): string | undefined {
  const raw = field(prompt, ["valabil", "valabilitate"], 30);
  if (!raw) return undefined;
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return iso[1] + "-" + String(Number(iso[2])).padStart(2, "0") + "-" + String(Number(iso[3])).padStart(2, "0");
  }
  const ro = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (!ro) return undefined;
  return ro[3] + "-" + String(Number(ro[2])).padStart(2, "0") + "-" + String(Number(ro[1])).padStart(2, "0");
}


function documentTitle(prompt: string) {
  return field(prompt, ["titlu"], 160) || clean(
    prompt.match(
      /(?:creeaz[ăa]|adaug[ăa])\s+(?:un\s+|o\s+)?(?:document|raport)\s*(?:draft\s*)?[:\-]?\s*([^,;\n]+)/i
    )?.[1],
    160
  );
}

function documentCategory(prompt: string): DocumentDraftActionPayload["category"] {
  const raw = normalize(field(prompt, ["categorie"], 40) || "");
  if (raw === "contract") return "contract";
  if (raw === "other" || raw === "alt" || raw === "altele") return "other";
  return "general";
}

function ronValue(value: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 2,
  }).format(value);
}

function timezoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour"),
    read("minute"),
    read("second")
  ) - date.getTime();
}

function localToIso(
  dateKey: string,
  hour: number,
  minute: number,
  timeZone: string
): string | null {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const localUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let instant = new Date(localUtc);
  for (let index = 0; index < 3; index += 1) {
    instant = new Date(localUtc - timezoneOffsetMs(instant, timeZone));
  }

  const verification = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    verification.find((part) => part.type === type)?.value ?? "";
  const verifiedKey = read("year") + "-" + read("month") + "-" + read("day");
  if (verifiedKey !== dateKey || Number(read("hour")) !== hour || Number(read("minute")) !== minute) {
    return null;
  }
  return instant.toISOString();
}

function dateKeyForPrompt(prompt: string, timeZone: string, now: Date) {
  const normalized = normalize(prompt);
  const localToday = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const addDays = (amount: number) => {
    const [year, month, day] = localToday.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1, day + amount, 12));
    return [
      next.getUTCFullYear(),
      String(next.getUTCMonth() + 1).padStart(2, "0"),
      String(next.getUTCDate()).padStart(2, "0"),
    ].join("-");
  };

  if (/\bpoimaine\b/.test(normalized)) return addDays(2);
  if (/\bmaine\b/.test(normalized)) return addDays(1);
  if (/\bazi\b/.test(normalized)) return addDays(0);

  const iso = normalized.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    return iso[1] + "-" + String(Number(iso[2])).padStart(2, "0") + "-" + String(Number(iso[3])).padStart(2, "0");
  }

  const ro = normalized.match(/\b(\d{1,2})[./](\d{1,2})(?:[./](\d{4}))?\b/);
  if (ro) {
    const year = ro[3] ? Number(ro[3]) : Number(localToday.slice(0, 4));
    return String(year) + "-" + String(Number(ro[2])).padStart(2, "0") + "-" + String(Number(ro[1])).padStart(2, "0");
  }
  return null;
}

function calendarTitle(prompt: string) {
  const explicit = field(prompt, ["titlu"], 180);
  if (explicit) return explicit;

  const match = prompt.match(
    /(?:programeaz[ăa]|creeaz[ăa]|adaug[ăa])\s+(?:o\s+|un\s+)?(?:programare|eveniment|[îi]nt[aâ]lnire|vizit[ăa])\s*[:\-]?\s*(.*)$/i
  );
  if (!match?.[1]) return undefined;
  return clean(
    match[1]
      .replace(/\b(?:azi|m[âa]ine|poim[âa]ine)\b.*$/i, "")
      .replace(/\b\d{4}-\d{1,2}-\d{1,2}\b.*$/i, "")
      .replace(/\b\d{1,2}[./]\d{1,2}(?:[./]\d{4})?\b.*$/i, "")
      .replace(/\b(?:la|ora)\s+\d{1,2}(?::\d{2})?.*$/i, ""),
    180
  );
}

function formatLocalDate(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function parseMutationPrompt(
  prompt: string,
  options: { timeZone?: string; now?: Date } = {}
): MutationParseResult {
  const normalized = normalize(prompt);
  const timeZone = options.timeZone || "Europe/Bucharest";
  const now = options.now || new Date();

  const leadMatch = normalized.match(/\b(creeaza|adauga|inregistreaza)\s+(?:un\s+|o\s+)?(lead|client)\b/);
  if (leadMatch) {
    const entity = leadMatch[2] as "lead" | "client";
    const name = field(prompt, ["nume"], 120) || fallbackName(prompt, entity);
    if (!name) {
      return { kind: "needs_details", targetModule: "leads", message: "Spune-mi numele lead-ului/clientului pe care vrei să îl creez." };
    }
    const payload: LeadActionPayload = {
      name,
      company: field(prompt, ["companie", "firma"], 140),
      email: field(prompt, ["email"], 180),
      phone: field(prompt, ["telefon", "tel"], 60),
      note: field(prompt, ["nota", "notă"], 500),
    };
    const actionType: IntelligenceMutationType = entity === "client" ? "create_client" : "create_lead";
    return {
      kind: "proposal",
      proposal: {
        actionType,
        targetModule: "leads",
        payload,
        summary: "Creează " + (entity === "client" ? "clientul" : "lead-ul") + " „" + name + "”",
        facts: [
          { label: "Tip", value: entity === "client" ? "Client" : "Lead" },
          { label: "Nume", value: name },
          ...(payload.company ? [{ label: "Companie", value: payload.company }] : []),
          ...(payload.phone ? [{ label: "Telefon", value: payload.phone }] : []),
        ],
      },
    };
  }

  const taskMatch = normalized.match(/\b(creeaza|adauga|deschide)\s+(?:o\s+|un\s+)?(lucrare|comanda|task|sarcina)\b/);
  if (taskMatch) {
    const title = field(prompt, ["titlu"], 180) || fallbackTaskTitle(prompt);
    if (!title) {
      return { kind: "needs_details", targetModule: "tasks", message: "Spune-mi titlul lucrării, comenzii sau al task-ului." };
    }
    const payload: TaskActionPayload = {
      title,
      kind: taskMatch[2] === "lucrare" ? "work" : taskMatch[2] === "comanda" ? "order" : "task",
      priority: priorityFromPrompt(prompt),
      description: field(prompt, ["descriere"], 700),
      clientName: field(prompt, ["client"], 140),
      location: field(prompt, ["locatie", "locație"], 240),
    };
    return {
      kind: "proposal",
      proposal: {
        actionType: "create_task",
        targetModule: "tasks",
        payload,
        summary: "Creează " + (payload.kind === "work" ? "lucrarea" : payload.kind === "order" ? "comanda" : "task-ul") + " „" + title + "”",
        facts: [
          { label: "Tip", value: payload.kind === "work" ? "Lucrare" : payload.kind === "order" ? "Comandă" : "Task" },
          { label: "Titlu", value: title },
          { label: "Prioritate", value: payload.priority },
          ...(payload.clientName ? [{ label: "Client", value: payload.clientName }] : []),
        ],
      },
    };
  }

  const calendarMatch = normalized.match(/\b(programeaza|creeaza|adauga)\s+(?:o\s+|un\s+)?(programare|eveniment|intalnire|vizita)\b/);
  if (calendarMatch) {
    const title = calendarTitle(prompt);
    if (!title) {
      return { kind: "needs_details", targetModule: "calendar", message: "Spune-mi titlul programării." };
    }
    const dateKey = dateKeyForPrompt(prompt, timeZone, now);
    const time = normalized.match(/\b(?:la|ora)\s*(\d{1,2})(?::(\d{2}))?\b/);
    if (!dateKey || !time) {
      return {
        kind: "needs_details",
        targetModule: "calendar",
        message: "Pentru programare am nevoie de dată și oră, de exemplu „mâine la 10:30” sau „30.09.2026 la 10:30”.",
      };
    }
    const hour = Number(time[1]);
    const minute = Number(time[2] || 0);
    const startAt = localToIso(dateKey, hour, minute, timeZone);
    if (!startAt) {
      return { kind: "needs_details", targetModule: "calendar", message: "Data sau ora nu este validă în fusul orar al workspace-ului." };
    }
    const durationRaw = field(prompt, ["durata", "durată"], 30);
    const durationMatch = normalize(durationRaw || "").match(/(\d{1,3})/);
    const durationMinutes = durationMatch ? Math.min(480, Math.max(15, Number(durationMatch[1]))) : 60;
    const endAt = new Date(new Date(startAt).getTime() + durationMinutes * 60000).toISOString();
    const reminderRaw = field(prompt, ["reminder", "memento"], 30);
    const reminderMatch = normalize(reminderRaw || "").match(/(\d{1,3})/);
    const reminderMinutes = reminderMatch ? Math.min(1440, Math.max(0, Number(reminderMatch[1]))) : 30;
    const payload: CalendarActionPayload = {
      title,
      startAt,
      endAt,
      clientName: field(prompt, ["client"], 140),
      taskTitle: field(prompt, ["lucrare", "comanda", "comandă"], 180),
      location: field(prompt, ["locatie", "locație"], 240),
      notes: field(prompt, ["nota", "notă", "descriere"], 700),
      reminderMinutes,
      timeZone,
    };
    return {
      kind: "proposal",
      proposal: {
        actionType: "create_calendar_event",
        targetModule: "calendar",
        payload,
        summary: "Programează „" + title + "” pentru " + formatLocalDate(startAt, timeZone),
        facts: [
          { label: "Programare", value: title },
          { label: "Data", value: formatLocalDate(startAt, timeZone) },
          { label: "Durată", value: String(durationMinutes) + " min" },
          ...(payload.clientName ? [{ label: "Client", value: payload.clientName }] : []),
          ...(payload.taskTitle ? [{ label: "Operațiune", value: payload.taskTitle }] : []),
        ],
      },
    };
  }

  const estimateMatch = normalized.match(/\b(creeaza|adauga)\s+(?:un\s+|o\s+)?(deviz|oferta)\b/);
  if (estimateMatch) {
    const title = estimateTitle(prompt);
    if (!title) {
      return {
        kind: "needs_details",
        targetModule: "estimates",
        message: "Spune-mi titlul devizului.",
      };
    }

    const items = estimateItems(prompt);
    if (!items.length) {
      return {
        kind: "needs_details",
        targetModule: "estimates",
        message: "Adaugă cel puțin o poziție explicită, de exemplu „poziție: Montaj centrală, 1 x 1500 lei”. ORBYVEN nu inventează prețuri.",
      };
    }

    const discountLeiRaw = numericField(prompt, ["discount", "reducere"]);
    const taxRateRaw = numericField(prompt, ["tva"]);
    const plannedLaborRaw = numericField(prompt, ["manopera"]);
    const otherCostsRaw = numericField(prompt, ["alte costuri"]);
    const discountLei = Math.max(0, discountLeiRaw ?? 0);
    const taxRate = taxRateRaw === null ? null : Math.min(100, Math.max(0, taxRateRaw));
    const plannedLaborLei = Math.max(0, plannedLaborRaw ?? 0);
    const otherCostLei = Math.max(0, otherCostsRaw ?? 0);
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPriceLei, 0);
    const discount = Math.min(subtotal, discountLei);
    const tax = taxRate === null ? 0 : (subtotal - discount) * (taxRate / 100);
    const total = Math.max(0, subtotal - discount + tax);

    const payload: EstimateActionPayload = {
      title,
      clientName: field(prompt, ["client"], 140),
      taskTitle: field(prompt, ["lucrare", "comanda", "comandă"], 180),
      currency: "RON",
      discountLei,
      taxRate,
      validUntil: estimateValidUntil(prompt),
      notes: field(prompt, ["nota", "notă", "descriere"], 700),
      plannedLaborLei,
      otherCostLei,
      items,
    };

    return {
      kind: "proposal",
      proposal: {
        actionType: "create_estimate",
        targetModule: "estimates",
        payload,
        summary: "Creează devizul draft „" + title + "”",
        facts: [
          { label: "Status", value: "Draft" },
          { label: "Poziții", value: String(items.length) },
          { label: "Subtotal", value: ronValue(subtotal) },
          { label: "Total", value: ronValue(total) },
          ...(payload.clientName ? [{ label: "Client", value: payload.clientName }] : []),
          ...(payload.taskTitle ? [{ label: "Lucrare", value: payload.taskTitle }] : []),
        ],
      },
    };
  }


  const documentMatch = normalized.match(/\b(creeaza|adauga)\s+(?:un\s+|o\s+)?(document|raport)\b/);
  if (documentMatch) {
    const title = documentTitle(prompt);
    if (!title) {
      return {
        kind: "needs_details",
        targetModule: "documents",
        message: "Spune-mi titlul documentului intern.",
      };
    }

    const content = field(prompt, ["continut", "conținut", "text"], 900);
    if (!content) {
      return {
        kind: "needs_details",
        targetModule: "documents",
        message: "Adaugă conținutul explicit al documentului, de exemplu „conținut: S-a verificat instalația...”. ORBYVEN nu inventează text juridic sau operațional în această etapă.",
      };
    }

    const payload: DocumentDraftActionPayload = {
      title,
      category: documentCategory(prompt),
      content,
      clientName: field(prompt, ["client"], 140),
      taskTitle: field(prompt, ["lucrare", "comanda", "comandă"], 180),
      note: field(prompt, ["nota", "notă"], 300),
    };

    return {
      kind: "proposal",
      proposal: {
        actionType: "create_document_draft",
        targetModule: "documents",
        payload,
        summary: "Creează documentul draft intern „" + title + "”",
        facts: [
          { label: "Status", value: "Draft intern" },
          { label: "Titlu", value: title },
          { label: "Categorie", value: payload.category },
          { label: "Conținut", value: content.length + " caractere" },
          ...(payload.clientName ? [{ label: "Client", value: payload.clientName }] : []),
          ...(payload.taskTitle ? [{ label: "Lucrare", value: payload.taskTitle }] : []),
        ],
      },
    };
  }

  return { kind: "none" };
}
