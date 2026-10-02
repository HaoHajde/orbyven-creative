export const CLIENT_COOLING_DAYS = 90;
export const CLIENT_DORMANT_DAYS = 180;
const DAY_MS = 86400000;

export type ClientLifecycleState =
  | "active"
  | "scheduled"
  | "overdue"
  | "cooling"
  | "dormant";

export type ClientLifecycleInput = {
  id: string;
  name: string;
  kind: "lead" | "client";
  lastContactAt?: string | null;
  nextFollowUpAt?: string | null;
  convertedAt?: string | null;
  createdAt: string;
};

export type ClientLifecycleSnapshot = {
  state: ClientLifecycleState;
  label: string;
  detail: string;
  inactiveDays: number;
  lastTouchAt: string;
  nextFollowUpAt: string | null;
  needsReactivation: boolean;
};

function parseMillis(value?: string | null) {
  if (!value) return null;
  const millis = new Date(value).getTime();
  return Number.isFinite(millis) ? millis : null;
}

function latestTouch(input: ClientLifecycleInput) {
  const candidates = [
    input.lastContactAt,
    input.convertedAt,
    input.createdAt,
  ]
    .map((value) => ({ value, millis: parseMillis(value) }))
    .filter((entry): entry is { value: string; millis: number } =>
      Boolean(entry.value) && entry.millis !== null
    );

  candidates.sort((left, right) => right.millis - left.millis);
  return candidates[0] ?? {
    value: input.createdAt,
    millis: parseMillis(input.createdAt) ?? 0,
  };
}

export function evaluateClientLifecycle(
  input: ClientLifecycleInput,
  now = new Date()
): ClientLifecycleSnapshot | null {
  if (input.kind !== "client") return null;

  const nowMs = now.getTime();
  const touch = latestTouch(input);
  const inactiveDays = Math.max(0, Math.floor((nowMs - touch.millis) / DAY_MS));
  const followUpMs = parseMillis(input.nextFollowUpAt);

  if (followUpMs !== null) {
    if (followUpMs < nowMs) {
      return {
        state: "overdue",
        label: "Revenire restantă",
        detail: "Există un follow-up ajuns la termen.",
        inactiveDays,
        lastTouchAt: touch.value,
        nextFollowUpAt: input.nextFollowUpAt ?? null,
        needsReactivation: false,
      };
    }

    return {
      state: "scheduled",
      label: "Revenire programată",
      detail: "Relația are deja următorul pas stabilit.",
      inactiveDays,
      lastTouchAt: touch.value,
      nextFollowUpAt: input.nextFollowUpAt ?? null,
      needsReactivation: false,
    };
  }

  if (inactiveDays >= CLIENT_DORMANT_DAYS) {
    return {
      state: "dormant",
      label: "De reactivat",
      detail: `Fără interacțiune de aproximativ ${inactiveDays} zile.`,
      inactiveDays,
      lastTouchAt: touch.value,
      nextFollowUpAt: null,
      needsReactivation: true,
    };
  }

  if (inactiveDays >= CLIENT_COOLING_DAYS) {
    return {
      state: "cooling",
      label: "Relație în răcire",
      detail: `Au trecut aproximativ ${inactiveDays} zile de la ultima interacțiune.`,
      inactiveDays,
      lastTouchAt: touch.value,
      nextFollowUpAt: null,
      needsReactivation: true,
    };
  }

  return {
    state: "active",
    label: "Client activ",
    detail: `Ultima interacțiune este în intervalul sănătos de ${CLIENT_COOLING_DAYS} zile.`,
    inactiveDays,
    lastTouchAt: touch.value,
    nextFollowUpAt: null,
    needsReactivation: false,
  };
}
