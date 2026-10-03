import type { IntelligenceResponse } from "@/lib/ai/intelligence-types";
import type { EntityQuestionScope } from "@/lib/ai/entity-intelligence-core";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

export type EntityScopeEstimate = {
  id: string;
  reference: string;
  status: string;
  total_cents: number;
  currency: string;
  task_id: string | null;
  client_id: string | null;
};

export type EntityScopeEvent = {
  id: string;
  title: string;
  start_at: string;
  task_id: string | null;
  client_id: string | null;
};

export type EntityScopeDocument = {
  id: string;
  name: string;
  task_id: string | null;
};

export type EntityScopeTask = {
  id: string;
  title: string;
  status: string;
};

export type EntityScopeActivity = {
  kind: string;
  occurred_at: string;
};

export type EntityFinanceSummary = {
  moduleEnabled: boolean;
  roleAllowed: boolean;
  incomeCents: number;
  expensesCents: number;
  outstandingCents: number;
};

function ron(cents: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ro-RO", {
    timeZone: "Europe/Bucharest",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function activityLabel(kind: string) {
  return ({
    note: "notă",
    call: "apel",
    email: "email",
    meeting: "întâlnire",
    status: "status",
  } as Record<string, string>)[kind] || kind;
}

function clientAction(clientId: string) {
  return {
    kind: "open_module" as const,
    label: "Deschide clientul",
    moduleId: "leads" as const,
    recordId: clientId,
  };
}

function workAction(taskId: string, clientId?: string | null) {
  return {
    kind: "open_module" as const,
    label: "Deschide lucrarea",
    moduleId: "tasks" as const,
    recordId: taskId,
    clientId: clientId ?? undefined,
    taskId,
  };
}

export function clientScopedResponse(input: {
  scope: EntityQuestionScope;
  available: Set<OrbyvenModuleId>;
  clientId: string;
  name: string;
  tasks: EntityScopeTask[];
  estimates: EntityScopeEstimate[];
  activeEstimateCount: number;
  events: EntityScopeEvent[];
  documents: EntityScopeDocument[];
  activities: EntityScopeActivity[];
  finance: EntityFinanceSummary;
}): IntelligenceResponse | null {
  const {
    scope,
    available,
    clientId,
    name,
    tasks,
    estimates,
    activeEstimateCount,
    events,
    documents,
    activities,
    finance,
  } = input;

  if (scope === "overview") return null;

  if (scope === "finance") {
    if (!finance.moduleEnabled) {
      return {
        specialist: "finance",
        answer: `Modulul Finanțe nu este activ pentru ${name}.`,
        facts: [{ label: "Client", value: name }],
        actions: [clientAction(clientId)],
        generatedBy: "orbyven_core",
      };
    }
    if (!finance.roleAllowed) {
      return {
        specialist: "finance",
        answer: "Rolul tău nu are acces la contextul financiar al acestui client.",
        facts: [{ label: "Client", value: name }],
        actions: [clientAction(clientId)],
        generatedBy: "orbyven_core",
      };
    }
    return {
      specialist: "finance",
      answer: `${name}: încasat ${ron(finance.incomeCents)}, costuri înregistrate ${ron(finance.expensesCents)}, de încasat ${ron(finance.outstandingCents)}.`,
      facts: [
        { label: "Client", value: name },
        { label: "Încasat", value: ron(finance.incomeCents) },
        { label: "Costuri", value: ron(finance.expensesCents) },
        { label: "De încasat", value: ron(finance.outstandingCents) },
      ],
      actions: [
        { kind: "open_module", label: "Deschide Finanțe", moduleId: "expenses", clientId },
        clientAction(clientId),
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "estimates") {
    if (!available.has("estimates")) {
      return {
        specialist: "operations",
        answer: "Modulul Oferte & devize nu este activ în acest workspace.",
        facts: [{ label: "Client", value: name }],
        actions: [clientAction(clientId)],
        generatedBy: "orbyven_core",
      };
    }
    const latest = estimates[0] ?? null;
    return {
      specialist: "operations",
      answer: latest
        ? `${name} are ${estimates.length} devize în context; cel mai recent este ${latest.reference}, status ${latest.status}, valoare ${latest.currency === "RON" ? ron(latest.total_cents) : latest.total_cents / 100 + " " + latest.currency}.`
        : `${name} nu are încă devize înregistrate.`,
      facts: [
        { label: "Client", value: name },
        { label: "Devize", value: String(estimates.length) },
        { label: "Active", value: String(activeEstimateCount) },
        ...(latest
          ? [
              { label: "Ultimul", value: latest.reference },
              { label: "Status", value: latest.status },
            ]
          : []),
      ],
      actions: [
        ...(latest
          ? [{
              kind: "open_module" as const,
              label: latest.reference,
              moduleId: "estimates" as const,
              recordId: latest.id,
              clientId,
              taskId: latest.task_id ?? undefined,
              estimateId: latest.id,
            }]
          : []),
        clientAction(clientId),
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "calendar") {
    if (!available.has("calendar")) {
      return {
        specialist: "operations",
        answer: "Modulul Calendar nu este activ în acest workspace.",
        facts: [{ label: "Client", value: name }],
        actions: [clientAction(clientId)],
        generatedBy: "orbyven_core",
      };
    }
    const next = events[0] ?? null;
    return {
      specialist: "operations",
      answer: next
        ? `Următoarea programare pentru ${name} este „${next.title}”, ${formatDateTime(next.start_at)}.`
        : `${name} nu are programări viitoare în calendar.`,
      facts: [
        { label: "Client", value: name },
        { label: "Programări viitoare", value: String(events.length) },
        ...(next ? [{ label: "Următoarea", value: formatDateTime(next.start_at) }] : []),
      ],
      actions: [
        ...(next
          ? [{
              kind: "open_module" as const,
              label: "Deschide programarea",
              moduleId: "calendar" as const,
              recordId: next.id,
              clientId,
              taskId: next.task_id ?? undefined,
            }]
          : []),
        clientAction(clientId),
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "documents") {
    if (!available.has("documents")) {
      return {
        specialist: "documents",
        answer: "Modulul Documente nu este activ în acest workspace.",
        facts: [{ label: "Client", value: name }],
        actions: [clientAction(clientId)],
        generatedBy: "orbyven_core",
      };
    }
    const latest = documents[0] ?? null;
    return {
      specialist: "documents",
      answer: latest
        ? `${name} are ${documents.length} documente în context; cel mai recent este „${latest.name}”.`
        : `${name} nu are documente legate în workspace.`,
      facts: [
        { label: "Client", value: name },
        { label: "Documente", value: String(documents.length) },
        ...(latest ? [{ label: "Cel mai recent", value: latest.name }] : []),
      ],
      actions: [
        ...(latest
          ? [{
              kind: "open_module" as const,
              label: latest.name,
              moduleId: "documents" as const,
              recordId: latest.id,
              taskId: latest.task_id ?? undefined,
            }]
          : []),
        clientAction(clientId),
      ],
      generatedBy: "orbyven_core",
    };
  }

  const last = activities[0] ?? null;
  const completed = tasks.filter((row) => row.status === "done");
  return {
    specialist: "operations",
    answer: last
      ? `Ultima activitate pentru ${name}: ${activityLabel(last.kind)}, ${formatDateTime(last.occurred_at)}. În context sunt ${completed.length} lucrări finalizate.`
      : `Nu există activități CRM recente pentru ${name}. În context sunt ${completed.length} lucrări finalizate.`,
    facts: [
      { label: "Client", value: name },
      { label: "Activități recente", value: String(activities.length) },
      { label: "Lucrări finalizate", value: String(completed.length) },
      ...(last
        ? [{ label: "Ultima activitate", value: activityLabel(last.kind) + " · " + formatDateTime(last.occurred_at) }]
        : []),
    ],
    actions: [
      clientAction(clientId),
      ...(completed[0]
        ? [{
            kind: "open_module" as const,
            label: completed[0].title,
            moduleId: "tasks" as const,
            recordId: completed[0].id,
            clientId,
            taskId: completed[0].id,
          }]
        : []),
    ],
    generatedBy: "orbyven_core",
  };
}

export function workScopedResponse(input: {
  scope: EntityQuestionScope;
  available: Set<OrbyvenModuleId>;
  taskId: string;
  clientId: string | null;
  title: string;
  status: string;
  progress: number;
  updatedAt: string;
  estimates: EntityScopeEstimate[];
  events: EntityScopeEvent[];
  documents: EntityScopeDocument[];
  finance: EntityFinanceSummary;
}): IntelligenceResponse | null {
  const {
    scope,
    available,
    taskId,
    clientId,
    title,
    status,
    progress,
    updatedAt,
    estimates,
    events,
    documents,
    finance,
  } = input;

  if (scope === "overview") return null;

  if (scope === "finance") {
    if (!finance.moduleEnabled) {
      return {
        specialist: "finance",
        answer: "Modulul Finanțe nu este activ în acest workspace.",
        facts: [{ label: "Lucrare", value: title }],
        actions: [workAction(taskId, clientId)],
        generatedBy: "orbyven_core",
      };
    }
    if (!finance.roleAllowed) {
      return {
        specialist: "finance",
        answer: "Rolul tău nu are acces la contextul financiar al acestei lucrări.",
        facts: [{ label: "Lucrare", value: title }],
        actions: [workAction(taskId, clientId)],
        generatedBy: "orbyven_core",
      };
    }
    return {
      specialist: "finance",
      answer: `„${title}”: încasat ${ron(finance.incomeCents)}, costuri înregistrate ${ron(finance.expensesCents)}, de încasat ${ron(finance.outstandingCents)}.`,
      facts: [
        { label: "Lucrare", value: title },
        { label: "Încasat", value: ron(finance.incomeCents) },
        { label: "Costuri", value: ron(finance.expensesCents) },
        { label: "De încasat", value: ron(finance.outstandingCents) },
      ],
      actions: [
        { kind: "open_module", label: "Deschide Finanțe", moduleId: "expenses", clientId: clientId ?? undefined, taskId },
        workAction(taskId, clientId),
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "estimates") {
    if (!available.has("estimates")) {
      return {
        specialist: "operations",
        answer: "Modulul Oferte & devize nu este activ în acest workspace.",
        facts: [{ label: "Lucrare", value: title }],
        actions: [workAction(taskId, clientId)],
        generatedBy: "orbyven_core",
      };
    }
    const latest = estimates[0] ?? null;
    return {
      specialist: "operations",
      answer: latest
        ? `„${title}” are ${estimates.length} devize în context; cel mai recent este ${latest.reference}, status ${latest.status}, valoare ${latest.currency === "RON" ? ron(latest.total_cents) : latest.total_cents / 100 + " " + latest.currency}.`
        : `„${title}” nu are încă devize înregistrate.`,
      facts: [
        { label: "Lucrare", value: title },
        { label: "Devize", value: String(estimates.length) },
        ...(latest
          ? [
              { label: "Ultimul", value: latest.reference },
              { label: "Status", value: latest.status },
            ]
          : []),
      ],
      actions: [
        ...(latest
          ? [{
              kind: "open_module" as const,
              label: latest.reference,
              moduleId: "estimates" as const,
              recordId: latest.id,
              clientId: latest.client_id ?? undefined,
              taskId,
              estimateId: latest.id,
            }]
          : []),
        workAction(taskId, clientId),
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "calendar") {
    if (!available.has("calendar")) {
      return {
        specialist: "operations",
        answer: "Modulul Calendar nu este activ în acest workspace.",
        facts: [{ label: "Lucrare", value: title }],
        actions: [workAction(taskId, clientId)],
        generatedBy: "orbyven_core",
      };
    }
    const next = events[0] ?? null;
    return {
      specialist: "operations",
      answer: next
        ? `Următoarea programare pentru „${title}” este „${next.title}”, ${formatDateTime(next.start_at)}.`
        : `„${title}” nu are programări viitoare în calendar.`,
      facts: [
        { label: "Lucrare", value: title },
        { label: "Programări viitoare", value: String(events.length) },
        ...(next ? [{ label: "Următoarea", value: formatDateTime(next.start_at) }] : []),
      ],
      actions: [
        ...(next
          ? [{
              kind: "open_module" as const,
              label: "Deschide programarea",
              moduleId: "calendar" as const,
              recordId: next.id,
              clientId: next.client_id ?? undefined,
              taskId,
            }]
          : []),
        workAction(taskId, clientId),
      ],
      generatedBy: "orbyven_core",
    };
  }

  if (scope === "documents") {
    if (!available.has("documents")) {
      return {
        specialist: "documents",
        answer: "Modulul Documente nu este activ în acest workspace.",
        facts: [{ label: "Lucrare", value: title }],
        actions: [workAction(taskId, clientId)],
        generatedBy: "orbyven_core",
      };
    }
    const latest = documents[0] ?? null;
    return {
      specialist: "documents",
      answer: latest
        ? `„${title}” are ${documents.length} documente în context; cel mai recent este „${latest.name}”.`
        : `„${title}” nu are documente legate.`,
      facts: [
        { label: "Lucrare", value: title },
        { label: "Documente", value: String(documents.length) },
        ...(latest ? [{ label: "Cel mai recent", value: latest.name }] : []),
      ],
      actions: [
        ...(latest
          ? [{
              kind: "open_module" as const,
              label: latest.name,
              moduleId: "documents" as const,
              recordId: latest.id,
              taskId,
            }]
          : []),
        workAction(taskId, clientId),
      ],
      generatedBy: "orbyven_core",
    };
  }

  return {
    specialist: "operations",
    answer:
      `„${title}” este ${status}, la ${progress}% progres. Ultima actualizare a fost ${formatDateTime(updatedAt)}; sunt ${events.length} programări viitoare și ${documents.length} documente legate.`,
    facts: [
      { label: "Lucrare", value: title },
      { label: "Ultima actualizare", value: formatDateTime(updatedAt) },
      { label: "Status", value: status },
      { label: "Progres", value: `${progress}%` },
      { label: "Programări viitoare", value: String(events.length) },
      { label: "Documente", value: String(documents.length) },
    ],
    actions: [workAction(taskId, clientId)],
    generatedBy: "orbyven_core",
  };
}
