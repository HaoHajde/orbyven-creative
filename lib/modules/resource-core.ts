export type OperationalResourceType = "person" | "crew" | "vehicle" | "equipment" | "space";

export const RESOURCE_TYPE_LABELS: Record<OperationalResourceType, string> = {
  person: "Persoană",
  crew: "Echipă",
  vehicle: "Vehicul",
  equipment: "Utilaj / echipament",
  space: "Spațiu / post",
};

export function normalizeResourceIds(resourceIds: string[] | undefined | null, max = 20) {
  if (!resourceIds?.length) return [];
  const normalized = [...new Set(resourceIds.map((id) => id.trim()).filter(Boolean))];
  if (normalized.length > max) throw new Error(`Poți aloca maximum ${max} resurse unei programări.`);
  return normalized;
}

export function schedulerErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/resource_schedule_conflict/i.test(message)) {
    return "Una dintre resurse este deja programată în intervalul ales.";
  }
  if (/resource_unavailable/i.test(message)) {
    return "Una dintre resurse este indisponibilă în intervalul ales.";
  }
  if (/resource_not_available/i.test(message)) {
    return "Resursa selectată nu mai este activă sau nu aparține firmei.";
  }
  return message || "Operațiunea de programare nu a putut fi finalizată.";
}
