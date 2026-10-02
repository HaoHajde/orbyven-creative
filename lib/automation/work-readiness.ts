export type WorkReadinessLevel = "ready" | "attention" | "blocked";
export type WorkReadinessCheckState = "good" | "attention" | "info" | "unavailable";

export type WorkReadinessOperation = {
  kind: "task" | "work" | "order";
  status: "planned" | "in_progress" | "blocked" | "done" | "cancelled";
  assignee: string | null;
  scheduledAt: string | null;
  dueAt: string | null;
  progress: number;
};

export type WorkReadinessContext = {
  estimatesCount: number;
  sentEstimatesCount: number;
  acceptedEstimatesCount: number;
  documentsCount: number;
  upcomingEventsCount: number;
  expensesCount: number | null;
  expensesCents: number | null;
  inventoryMovementsCount: number | null;
  openPurchaseOrdersCount: number | null;
  inventoryConsumedCents: number | null;
  inventoryRequiredLines: number | null;
  inventoryUntrackedLines: number | null;
  inventoryUnreadyLines: number | null;
  inventoryShortageLines: number | null;
};

export type WorkReadinessCheck = {
  key: "status" | "ownership" | "commercial" | "schedule" | "checklist" | "documents" | "materials" | "procurement" | "costs";
  label: string;
  state: WorkReadinessCheckState;
  message: string;
};

export type WorkReadinessResult = {
  level: WorkReadinessLevel;
  label: string;
  headline: string;
  checks: WorkReadinessCheck[];
  attentionCount: number;
};

const DAY_MS = 86_400_000;

function normalized(value: string | null | undefined) {
  return (value || "")
    .trim()
    .toLocaleLowerCase("ro-RO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function within(value: string | null, now: Date, ms: number) {
  if (!value) return false;
  const point = new Date(value).getTime();
  return Number.isFinite(point) && point >= now.getTime() && point <= now.getTime() + ms;
}

export function evaluateWorkReadiness(input: {
  operation: WorkReadinessOperation;
  context: WorkReadinessContext | null;
  checklist: { total: number; done: number };
  inactiveAssigneeNames?: string[];
  enabled: {
    estimates: boolean;
    documents: boolean;
    calendar: boolean;
    expenses: boolean;
    inventory: boolean;
    team: boolean;
  };
  canAccessFinances: boolean;
  now: Date;
}): WorkReadinessResult {
  const { operation, context, checklist, enabled, canAccessFinances, now } = input;
  const checks: WorkReadinessCheck[] = [];
  const inactiveNames = new Set((input.inactiveAssigneeNames ?? []).map(normalized).filter(Boolean));
  const assignee = normalized(operation.assignee);
  const operationalKind = operation.kind === "work" || operation.kind === "order";
  const executionSoon =
    !["done", "cancelled"].includes(operation.status) &&
    (
      operation.status === "in_progress" ||
      within(operation.scheduledAt, now, 7 * DAY_MS) ||
      within(operation.dueAt, now, 7 * DAY_MS)
    );

  if (operation.status === "blocked") {
    checks.push({
      key: "status",
      label: "Status",
      state: "attention",
      message: "Operațiunea este blocată și necesită o decizie înainte de continuare.",
    });
  } else if (operation.status === "done") {
    checks.push({ key: "status", label: "Status", state: "good", message: "Operațiunea este finalizată." });
  } else if (operation.status === "cancelled") {
    checks.push({ key: "status", label: "Status", state: "info", message: "Operațiunea este anulată; istoricul rămâne disponibil." });
  } else {
    checks.push({ key: "status", label: "Status", state: "good", message: "Fluxul operațional este activ." });
  }

  if (operationalKind && executionSoon) {
    if (!assignee) {
      checks.push({
        key: "ownership",
        label: "Responsabil",
        state: "attention",
        message: "Execuția este apropiată sau pornită, dar nu are responsabil.",
      });
    } else if (enabled.team && inactiveNames.has(assignee)) {
      checks.push({
        key: "ownership",
        label: "Responsabil",
        state: "attention",
        message: "Responsabilul asociat este marcat inactiv în Team.",
      });
    } else {
      checks.push({
        key: "ownership",
        label: "Responsabil",
        state: "good",
        message: operation.assignee?.trim() || "Responsabil alocat.",
      });
    }
  } else {
    checks.push({
      key: "ownership",
      label: "Responsabil",
      state: assignee ? "good" : "info",
      message: assignee ? operation.assignee!.trim() : "Poate fi alocat când intră în execuție.",
    });
  }

  if (enabled.estimates && context) {
    if (
      operation.status === "in_progress" &&
      context.sentEstimatesCount > 0 &&
      context.acceptedEstimatesCount === 0
    ) {
      checks.push({
        key: "commercial",
        label: "Comercial",
        state: "attention",
        message: "Execuția a început, dar oferta asociată este încă în așteptare.",
      });
    } else if (context.acceptedEstimatesCount > 0) {
      checks.push({
        key: "commercial",
        label: "Comercial",
        state: "good",
        message: context.acceptedEstimatesCount + " ofertă/oferte acceptate.",
      });
    } else {
      checks.push({
        key: "commercial",
        label: "Comercial",
        state: "info",
        message: context.sentEstimatesCount
          ? context.sentEstimatesCount + " ofertă/oferte în așteptare."
          : "Nu există ofertă acceptată asociată.",
      });
    }
  } else {
    checks.push({
      key: "commercial",
      label: "Comercial",
      state: "unavailable",
      message: enabled.estimates ? "Contextul comercial se încarcă." : "Modulul Oferte nu este activ.",
    });
  }

  if (enabled.calendar && context) {
    const hasTiming = Boolean(operation.scheduledAt || operation.dueAt || context.upcomingEventsCount > 0);
    if (
      operationalKind &&
      operation.status === "planned" &&
      context.acceptedEstimatesCount > 0 &&
      !hasTiming
    ) {
      checks.push({
        key: "schedule",
        label: "Planificare",
        state: "attention",
        message: "Oferta este acceptată, dar execuția nu are încă programare sau termen.",
      });
    } else {
      checks.push({
        key: "schedule",
        label: "Planificare",
        state: hasTiming ? "good" : "info",
        message: hasTiming ? "Există termen sau programare asociată." : "Încă fără programare explicită.",
      });
    }
  } else {
    checks.push({
      key: "schedule",
      label: "Planificare",
      state: "unavailable",
      message: enabled.calendar ? "Calendarul se încarcă." : "Modulul Calendar nu este activ.",
    });
  }

  const pendingChecklist = Math.max(0, checklist.total - checklist.done);
  if (!checklist.total) {
    checks.push({ key: "checklist", label: "Checklist", state: "info", message: "Nu există pași de checklist definiți." });
  } else if (!pendingChecklist) {
    checks.push({ key: "checklist", label: "Checklist", state: "good", message: "Checklist complet." });
  } else if (
    operation.status === "done" ||
    (operation.status !== "cancelled" && within(operation.dueAt, now, DAY_MS))
  ) {
    checks.push({
      key: "checklist",
      label: "Checklist",
      state: "attention",
      message: pendingChecklist + " pași sunt încă nefinalizați.",
    });
  } else {
    checks.push({
      key: "checklist",
      label: "Checklist",
      state: "info",
      message: pendingChecklist + " pași rămași din " + checklist.total + ".",
    });
  }

  if (enabled.documents && context) {
    const completedWithoutEvidence =
      operationalKind &&
      operation.status === "done" &&
      context.documentsCount === 0;
    checks.push({
      key: "documents",
      label: "Documente",
      state: context.documentsCount > 0 ? "good" : completedWithoutEvidence ? "attention" : "info",
      message: context.documentsCount
        ? context.documentsCount + " documente legate de dosar."
        : completedWithoutEvidence
          ? "Lucrarea este finalizată, dar dosarul nu are încă nicio dovadă sau document."
          : "Dosarul nu are încă documente asociate.",
    });
  } else {
    checks.push({
      key: "documents",
      label: "Documente",
      state: "unavailable",
      message: enabled.documents ? "Documentele se încarcă." : "Modulul Documente nu este activ.",
    });
  }

  if (enabled.inventory && operationalKind && context) {
    const requiredLines = context.inventoryRequiredLines ?? 0;
    const untrackedLines = context.inventoryUntrackedLines ?? 0;
    const unreadyLines = context.inventoryUnreadyLines ?? 0;
    const shortageLines = context.inventoryShortageLines ?? 0;

    if (shortageLines > 0) {
      checks.push({
        key: "materials",
        label: "Materiale",
        state: "attention",
        message: shortageLines + " poziții materiale au lipsă după rezervarea stocului disponibil.",
      });
    } else if (unreadyLines > 0) {
      checks.push({
        key: "materials",
        label: "Materiale",
        state: "attention",
        message: unreadyLines + " poziții materiale nu sunt încă rezervate complet pentru lucrare.",
      });
    } else if (requiredLines > 0) {
      checks.push({
        key: "materials",
        label: "Materiale",
        state: untrackedLines > 0 ? "info" : "good",
        message: untrackedLines > 0
          ? untrackedLines + " poziții materiale nu folosesc stoc tracking; verificarea lor rămâne manuală."
          : "Necesarul material este consumat sau rezervat integral.",
      });
    } else {
      checks.push({
        key: "materials",
        label: "Materiale",
        state: "info",
        message: "Nu există necesar material confirmat în oferta acceptată.",
      });
    }
  } else {
    checks.push({
      key: "materials",
      label: "Materiale",
      state: "unavailable",
      message: enabled.inventory
        ? "Material readiness este disponibil pentru lucrări și comenzi."
        : "Modulul Stoc & achiziții nu este activ.",
    });
  }

  if (enabled.inventory && operationalKind && context) {
    const openPurchaseOrders = context.openPurchaseOrdersCount ?? 0;
    const closedOperation = operation.status === "done" || operation.status === "cancelled";
    checks.push({
      key: "procurement",
      label: "Achiziții",
      state: closedOperation && openPurchaseOrders > 0 ? "attention" : openPurchaseOrders > 0 ? "info" : "good",
      message: openPurchaseOrders > 0
        ? closedOperation
          ? openPurchaseOrders + " comenzi furnizor sunt încă deschise pentru o operațiune închisă."
          : openPurchaseOrders + " comenzi furnizor sunt încă în circuit."
        : "Nu există comenzi furnizor deschise pe această operațiune.",
    });
  }

  if (canAccessFinances && enabled.expenses && context) {
    const expenseCount = context.expensesCount ?? 0;
    const inventoryCount = enabled.inventory ? (context.inventoryMovementsCount ?? 0) : 0;
    const hasRecordedCost = expenseCount > 0 || inventoryCount > 0;
    checks.push({
      key: "costs",
      label: "Costuri",
      state: hasRecordedCost ? "good" : "info",
      message: hasRecordedCost
        ? "Există costuri sau consumuri reale asociate lucrării."
        : "Nu sunt încă înregistrate costuri sau consumuri reale.",
    });
  } else {
    checks.push({
      key: "costs",
      label: "Costuri",
      state: "unavailable",
      message: canAccessFinances ? "Contextul financiar nu este disponibil." : "Vizibil doar pentru rolurile financiare.",
    });
  }

  const attentionCount = checks.filter((check) => check.state === "attention").length;
  const level: WorkReadinessLevel =
    operation.status === "blocked" ? "blocked" : attentionCount ? "attention" : "ready";
  const label =
    level === "blocked" ? "Blocată" :
    level === "attention" ? "Necesită atenție" :
    operation.status === "done" ? "Dosar finalizat" :
    "Pregătire coerentă";
  const firstAttention = checks.find((check) => check.state === "attention");

  return {
    level,
    label,
    headline: firstAttention?.message || "Nu sunt detectate blocaje de readiness în contextul disponibil.",
    checks,
    attentionCount,
  };
}
