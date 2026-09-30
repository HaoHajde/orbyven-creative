export type EstimateWorkflowStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export type EstimateWorkflowShape = {
  status: EstimateWorkflowStatus;
  client_id: string | null;
  task_id: string | null;
  valid_until: string | null;
  sent_at: string | null;
};

export type EstimateNextAction =
  | "complete_context"
  | "send"
  | "await_response"
  | "review_expired"
  | "schedule_work"
  | "revise";

export type EstimateWorkflowEvaluation = {
  overdue: boolean;
  daysSinceSent: number | null;
  nextAction: EstimateNextAction;
  label: string;
  detail: string;
};

function dateOnly(value: string) {
  return value.slice(0, 10);
}

export function evaluateEstimateWorkflow(
  estimate: EstimateWorkflowShape,
  todayKey: string
): EstimateWorkflowEvaluation {
  const overdue = Boolean(
    estimate.status === "sent" &&
    estimate.valid_until &&
    dateOnly(estimate.valid_until) < todayKey
  );

  const today = Date.parse(todayKey + "T12:00:00Z");
  const sent = estimate.sent_at ? Date.parse(estimate.sent_at) : Number.NaN;
  const daysSinceSent = Number.isFinite(sent) && Number.isFinite(today)
    ? Math.max(0, Math.floor((today - sent) / 86_400_000))
    : null;

  if (estimate.status === "draft") {
    if (!estimate.client_id || !estimate.task_id) {
      return {
        overdue: false,
        daysSinceSent,
        nextAction: "complete_context",
        label: "Completează contextul",
        detail: "Leagă devizul de client și lucrare înainte de trimitere.",
      };
    }
    return {
      overdue: false,
      daysSinceSent,
      nextAction: "send",
      label: "Pregătită de trimis",
      detail: "Devizul are contextul necesar pentru pasul comercial următor.",
    };
  }

  if (estimate.status === "sent") {
    if (overdue) {
      return {
        overdue: true,
        daysSinceSent,
        nextAction: "review_expired",
        label: "Valabilitate depășită",
        detail: "Marchează oferta expirată sau creează o revizie nouă.",
      };
    }
    return {
      overdue: false,
      daysSinceSent,
      nextAction: "await_response",
      label: "Așteaptă răspuns",
      detail: daysSinceSent === null
        ? "Oferta este trimisă și așteaptă decizia clientului."
        : "Trimisă de " + daysSinceSent + " zile.",
    };
  }

  if (estimate.status === "accepted") {
    return {
      overdue: false,
      daysSinceSent,
      nextAction: "schedule_work",
      label: "Pregătită pentru execuție",
      detail: "Oferta este acceptată. Următorul pas operațional este programarea lucrării.",
    };
  }

  return {
    overdue: false,
    daysSinceSent,
    nextAction: "revise",
    label: estimate.status === "rejected" ? "Necesită revizie" : "Oferta a expirat",
    detail: "Păstrează istoricul și creează o versiune nouă pentru o nouă propunere.",
  };
}
