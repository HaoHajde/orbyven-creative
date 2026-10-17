export type RecoveryReason =
  | "offline"
  | "timeout"
  | "rate_limited"
  | "service_unavailable"
  | "authentication"
  | "permission"
  | "not_found"
  | "conflict"
  | "validation"
  | "unknown";

export type RecoveryOperationSafety =
  | "read"
  | "idempotent_write"
  | "non_idempotent_write";

export type RecoveryActionKind = "retry" | "refresh";

export type RecoveryPresentation = {
  reason: RecoveryReason;
  tone: "neutral" | "warning" | "danger";
  title: string;
  description: string;
  hint: string | null;
  action: {
    kind: RecoveryActionKind;
    label: string;
  } | null;
};

type Copy = {
  title: string;
  description: string;
  hint?: string;
  tone: RecoveryPresentation["tone"];
};

const COPY_RO: Record<RecoveryReason, Copy> = {
  offline: {
    title: "Conexiunea s-a întrerupt",
    description: "ORBYVEN nu poate confirma starea actuală până când conexiunea revine.",
    hint: "Datele deja salvate nu sunt retrimise automat.",
    tone: "warning",
  },
  timeout: {
    title: "Răspunsul întârzie",
    description: "Operațiunea nu a primit un răspuns la timp.",
    hint: "Poți relua doar acțiunile care sunt sigure de repetat.",
    tone: "warning",
  },
  rate_limited: {
    title: "Prea multe cereri într-un timp scurt",
    description: "Serviciul are nevoie de câteva momente înainte de o nouă încercare.",
    tone: "neutral",
  },
  service_unavailable: {
    title: "Serviciul este temporar indisponibil",
    description: "ORBYVEN nu poate finaliza această cerere momentan.",
    tone: "warning",
  },
  authentication: {
    title: "Sesiunea trebuie reînnoită",
    description: "Autentifică-te din nou înainte de a continua această operațiune.",
    tone: "warning",
  },
  permission: {
    title: "Nu ai acces la această acțiune",
    description: "Rolul curent nu permite această operațiune.",
    tone: "neutral",
  },
  not_found: {
    title: "Elementul nu mai este disponibil",
    description: "Este posibil să fi fost mutat, arhivat sau eliminat.",
    tone: "neutral",
  },
  conflict: {
    title: "Datele s-au schimbat între timp",
    description: "Reîncarcă starea curentă înainte de a continua, ca să nu suprascrii modificări mai noi.",
    tone: "warning",
  },
  validation: {
    title: "Verifică informațiile introduse",
    description: "Unele date trebuie corectate înainte ca operațiunea să poată continua.",
    tone: "neutral",
  },
  unknown: {
    title: "Operațiunea nu a putut fi finalizată",
    description: "ORBYVEN a oprit acțiunea în siguranță. Poți verifica starea și continua de acolo.",
    tone: "danger",
  },
};

const COPY_EN: Record<RecoveryReason, Copy> = {
  offline: {
    title: "Connection interrupted",
    description: "ORBYVEN cannot confirm the current state until the connection returns.",
    hint: "Already submitted data is not sent again automatically.",
    tone: "warning",
  },
  timeout: {
    title: "The response is taking longer than expected",
    description: "The operation did not receive a response in time.",
    hint: "Only actions that are safe to repeat can be retried directly.",
    tone: "warning",
  },
  rate_limited: {
    title: "Too many requests in a short time",
    description: "The service needs a moment before another attempt.",
    tone: "neutral",
  },
  service_unavailable: {
    title: "The service is temporarily unavailable",
    description: "ORBYVEN cannot complete this request right now.",
    tone: "warning",
  },
  authentication: {
    title: "Your session needs to be renewed",
    description: "Sign in again before continuing this operation.",
    tone: "warning",
  },
  permission: {
    title: "You do not have access to this action",
    description: "Your current role does not allow this operation.",
    tone: "neutral",
  },
  not_found: {
    title: "This item is no longer available",
    description: "It may have been moved, archived, or removed.",
    tone: "neutral",
  },
  conflict: {
    title: "The data changed in the meantime",
    description: "Reload the current state before continuing so newer changes are not overwritten.",
    tone: "warning",
  },
  validation: {
    title: "Check the information you entered",
    description: "Some fields need to be corrected before the operation can continue.",
    tone: "neutral",
  },
  unknown: {
    title: "The operation could not be completed",
    description: "ORBYVEN stopped the action safely. Check the current state and continue from there.",
    tone: "danger",
  },
};

const TRANSIENT_REASONS = new Set<RecoveryReason>([
  "offline",
  "timeout",
  "rate_limited",
  "service_unavailable",
  "unknown",
]);

function isEnglish(locale: string | undefined) {
  return Boolean(locale?.toLocaleLowerCase().startsWith("en"));
}

function retryLabel(locale: string | undefined) {
  return isEnglish(locale) ? "Try again" : "Încearcă din nou";
}

function refreshLabel(locale: string | undefined, conflict = false) {
  if (isEnglish(locale)) return conflict ? "Reload data" : "Check current state";
  return conflict ? "Reîncarcă datele" : "Verifică starea";
}

function nonIdempotentHint(locale: string | undefined) {
  return isEnglish(locale)
    ? "ORBYVEN will not automatically resend this action, to avoid creating a duplicate."
    : "ORBYVEN nu retrimite automat această acțiune, pentru a evita crearea unui duplicat.";
}

export function buildRecoveryPresentation(input: {
  reason: RecoveryReason;
  operation: RecoveryOperationSafety;
  locale?: string;
}): RecoveryPresentation {
  const copy = (isEnglish(input.locale) ? COPY_EN : COPY_RO)[input.reason];
  let action: RecoveryPresentation["action"] = null;
  let hint = copy.hint ?? null;

  if (input.reason === "conflict") {
    action = { kind: "refresh", label: refreshLabel(input.locale, true) };
  } else if (TRANSIENT_REASONS.has(input.reason)) {
    if (input.operation === "non_idempotent_write") {
      action = { kind: "refresh", label: refreshLabel(input.locale) };
      hint = nonIdempotentHint(input.locale);
    } else {
      action = { kind: "retry", label: retryLabel(input.locale) };
    }
  }

  return {
    reason: input.reason,
    tone: copy.tone,
    title: copy.title,
    description: copy.description,
    hint,
    action,
  };
}
